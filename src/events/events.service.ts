import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsRepository } from './events.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto, EventParticipantDto } from './dto/event-response.dto';
import { UserDto } from '../users/dto/user.dto';
import { Prisma, InviteStatus } from '@prisma/client';

@Injectable()
export class EventsService {
    constructor(
        private readonly eventsRepo: EventsRepository,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(createEventDto: CreateEventDto, userId: number): Promise<EventResponseDto> {
        const { participants, ...eventData } = createEventDto;

        // Ensure IDs are numbers
        const hostId = Number(userId);
        const participantIds = participants?.map(id => Number(id)) || [];

        try {
            const event = await this.eventsRepo.create({
                ...eventData,
                host: { connect: { id: hostId } },
                participants: participantIds.length ? {
                    create: participantIds.map(id => ({
                        userId: id,
                        status: 'PENDING'
                    }))
                } : undefined
            });

            // Notify participants (Invitation)
            if (participantIds.length > 0) {
                this.notifyUserIds(participantIds, 'New Invitation', `You have been invited to "${event.title}"`);
            }

            return this.findOne(event.id);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                console.error('Prisma Connect Error:', error.meta);
                throw new NotFoundException(`User in host or participants not found. IDs: host=${hostId}, participants=[${participantIds.join(', ')}]`);
            }
            throw error;
        }
    }

    async findAll(): Promise<EventResponseDto[]> {
        const events = await this.eventsRepo.findAll();
        return events.map(event => this.mapToDto(event));
    }

    async findOne(id: number): Promise<EventResponseDto> {
        const event = await this.eventsRepo.findOne(id);
        if (!event) throw new NotFoundException(`Event with id ${id} not found`);
        return this.mapToDto(event);
    }

    async remove(id: number, userId: number) {
        // We use findOne internal calling repo directly to avoid circular dependency or overhead if we just want check hostId?
        // actually findOne calls this.eventsRepo.findOne, so it returns the entity from repo (but typed as DTO in service signature now?).
        // Wait, if I change findOne signature, I need to be careful.
        // The previous findOne returned the database entity.
        // Let's use eventsRepo.findOne directly here to check permissions on the raw entity if needed, 
        // OR rely on DTO if it has hostId... DTO has host object.

        const event = await this.eventsRepo.findOne(id);
        if (!event) throw new NotFoundException(`Event with id ${id} not found`);

        if (event.hostId !== userId) {
            throw new ForbiddenException('Only the host can delete this event');
        }

        // Notify before deleting, because we need participants
        await this.notifyParticipants(event.id, 'Event Cancelled', `Event "${event.title}" has been cancelled.`);

        return this.eventsRepo.remove(id);
    }

    async update(id: number, updateEventDto: UpdateEventDto, userId: number): Promise<EventResponseDto> {
        const event = await this.findOne(id);

        if (event.host.id !== userId) {
            throw new ForbiddenException('Only the host can update this event');
        }

        const { participants, ...eventData } = updateEventDto;
        const updateData: any = { ...eventData };

        if (participants) {
            // "event" here is the result of findOne, which is an EventResponseDto
            const existingUserIds = event.participants.map(p => p.id);
            const toAdd = participants.filter(id => !existingUserIds.includes(id));
            const toRemove = existingUserIds.filter(id => !participants.includes(id));

            if (toAdd.length > 0 || toRemove.length > 0) {
                const participantsUpdate: any = {};
                if (toRemove.length > 0) {
                    participantsUpdate.deleteMany = { userId: { in: toRemove } };
                }
                if (toAdd.length > 0) {
                    participantsUpdate.create = toAdd.map(pid => ({
                        userId: pid,
                        status: 'PENDING'
                    }));
                }
                updateData.participants = participantsUpdate;
            }
        }

        await this.eventsRepo.update(id, updateData);

        // Notify newly added participants
        if (participants) {
            const existingUserIds = event.participants.map(p => p.id);
            const toAdd = participants.filter(id => !existingUserIds.includes(id));
            if (toAdd.length > 0) {
                this.notifyUserIds(toAdd, 'New Invitation', `You have been invited to "${event.title}"`);
            }
        }

        // Notify existing participants who accepted
        this.notifyParticipants(event.id, 'Event Updated', `Event "${event.title}" has been updated.`, InviteStatus.ACCEPTED);

        return this.findOne(id);
    }

    async invite(eventId: number, username: string, userId: number) {
        const event = await this.eventsRepo.findOne(eventId);
        if (!event) throw new NotFoundException(`Event with id ${eventId} not found`);

        if (event.hostId !== userId) {
            throw new ForbiddenException('Only the host can invite users');
        }

        const invitedUser = await this.eventsRepo.inviteUser(eventId, username);

        if (invitedUser && invitedUser.fcmToken) {
            this.notificationsService.sendNotification(
                invitedUser.fcmToken,
                'New Invitation',
                `You have been invited to "${event.title}"`
            );
        }

        return { message: 'User invited' };
    }

    private async notifyParticipants(eventId: number, title: string, body: string, status?: InviteStatus) {
        const tokens = status
            ? await this.eventsRepo.getParticipantTokensByStatus(eventId, status)
            : await this.eventsRepo.getParticipantTokens(eventId);

        if (tokens.length > 0) {
            this.notificationsService.sendMulticast(tokens, title, body);
        }
    }

    private async notifyUserIds(userIds: number[], title: string, body: string) {
        const tokens = await this.eventsRepo.getUserTokens(userIds);
        if (tokens.length > 0) {
            this.notificationsService.sendMulticast(tokens, title, body);
        }
    }

    async join(eventId: number, userId: number) {
        const event = await this.findOne(eventId); // Ensure event exists and get DTO

        const isParticipant = event.participants.some(p => p.id === userId);

        if (!event.isOpen && !isParticipant) {
            throw new ForbiddenException('This event is closed and cannot be joined spontaneously');
        }

        try {
            const result = await this.eventsRepo.join(userId, eventId);

            // Notify host
            const hostTokens = await this.eventsRepo.getUserTokens([event.host.id]);
            if (hostTokens.length > 0) {
                const joiningUser = await this.eventsRepo.getUserById(userId);
                const username = joiningUser?.username || 'A user';
                this.notificationsService.sendMulticast(
                    hostTokens,
                    'Invite Accepted',
                    `${username} has accepted your invitation to "${event.title}"`
                );
            }

            return result;
        } catch (e) {
            throw e;
        }
    }

    private mapToDto(event: any): EventResponseDto {
        const hostDto: UserDto = {
            id: event.host.id,
            username: event.host.username,
            // email is not in schema based on view_file earlier, only username/password/fcmToken
        };

        const participantsDto: EventParticipantDto[] = event.participants.map((p: any) => ({
            id: p.user.id,
            username: p.user.username,
            status: p.status,
        }));

        return {
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            host: hostDto,
            participants: participantsDto,
            isOpen: event.isOpen,
        };
    }
}
