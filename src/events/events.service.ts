import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsRepository } from './events.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { ParticipateDto } from './dto/participate.dto';
import { EventResponseDto, EventParticipantDto } from './dto/event-response.dto';
import { UserDto } from '../users/dto/user.dto';
import { Prisma, InviteStatus } from '@prisma/client';
import { NotificationCode } from '../notifications/notification-codes';

@Injectable()
export class EventsService {
    constructor(
        private readonly eventsRepo: EventsRepository,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(createEventDto: CreateEventDto, userId: number): Promise<EventResponseDto> {
        const { participants, ...eventData } = createEventDto;

        const hostId = Number(userId);
        const participantIds = participants?.map(id => Number(id)) || [];

        try {
            const event = await this.eventsRepo.create({
                ...eventData,
                endTime: (eventData.endTime || null) as any,
                host: { connect: { id: hostId } },
                participants: participantIds.length ? {
                    create: participantIds.map(id => ({
                        userId: id,
                        status: 'PENDING'
                    }))
                } : undefined
            });

            if (participantIds.length > 0) {
                this.notifyUserIds(participantIds, event.id, NotificationCode.INVITATION_NEW, 'New Invitation', `You have been invited to "${event.title}"`);
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
        const event = await this.eventsRepo.findOne(id);
        if (!event) throw new NotFoundException(`Event with id ${id} not found`);

        if (event.hostId !== userId) {
            throw new ForbiddenException('Only the host can delete this event');
        }

        await this.notifyParticipants(event.id, NotificationCode.EVENT_CANCELLED, 'Event Cancelled', `Event "${event.title}" has been cancelled.`);

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

        if (participants) {
            const existingUserIds = event.participants.map(p => p.id);
            const toAdd = participants.filter(id => !existingUserIds.includes(id));
            if (toAdd.length > 0) {
                this.notifyUserIds(toAdd, event.id, NotificationCode.INVITATION_NEW, 'New Invitation', `You have been invited to "${event.title}"`);
            }
        }

        this.notifyParticipants(event.id, NotificationCode.EVENT_UPDATED, 'Event Updated', `Event "${event.title}" has been updated.`, InviteStatus.ACCEPTED);

        return this.findOne(id);
    }

    async invite(eventId: number, username: string, userId: number) {
        const event = await this.eventsRepo.findOne(eventId);
        if (!event) throw new NotFoundException(`Event with id ${eventId} not found`);

        if (event.hostId !== userId) {
            throw new ForbiddenException('Only the host can invite users');
        }

        const invitedUser = await this.eventsRepo.inviteUser(eventId, username);

        if (invitedUser) {
            const tokens = await this.eventsRepo.getUserTokens([invitedUser.id]);
            if (tokens.length > 0) {
                this.notificationsService.sendMulticast(
                    tokens,
                    'New Invitation',
                    `You have been invited to "${event.title}"`,
                    { type: NotificationCode.INVITATION_NEW, eventId: String(eventId) }
                );
            }
        }

        return { message: 'User invited' };
    }

    private async notifyParticipants(eventId: number, type: NotificationCode, title: string, body: string, status?: InviteStatus) {
        const tokens = status
            ? await this.eventsRepo.getParticipantTokensByStatus(eventId, status)
            : await this.eventsRepo.getParticipantTokens(eventId);

        if (tokens.length > 0) {
            this.notificationsService.sendMulticast(tokens, title, body, { type, eventId: String(eventId) });
        }
    }

    private async notifyUserIds(userIds: number[], eventId: number, type: NotificationCode, title: string, body: string) {
        const tokens = await this.eventsRepo.getUserTokens(userIds);
        if (tokens.length > 0) {
            this.notificationsService.sendMulticast(tokens, title, body, { type, eventId: String(eventId) });
        }
    }

    async join(eventId: number, userId: number, participateDto: ParticipateDto) {
        const event = await this.findOne(eventId);

        const participantData = event.participants.find(p => p.id === userId);
        const isParticipant = !!participantData;

        if (!event.isOpen && !isParticipant) {
            throw new ForbiddenException('This event is closed and cannot be joined spontaneously');
        }

        try {
            const result = await this.eventsRepo.join(userId, eventId, participateDto);

            const hostTokens = await this.eventsRepo.getUserTokens([event.host.id]);
            if (hostTokens.length > 0) {
                const joiningUser = await this.eventsRepo.getUserById(userId);
                const username = joiningUser?.username || 'A user';
                const wasPending = participantData?.status === 'PENDING';

                if (!isParticipant || wasPending) {
                    this.notificationsService.sendMulticast(
                        hostTokens,
                        'Invite Accepted',
                        `${username} has accepted your invitation to "${event.title}"`,
                        { type: NotificationCode.PARTICIPATION_ACCEPTED, eventId: String(eventId) }
                    );
                } else {
                    this.notificationsService.sendMulticast(
                        hostTokens,
                        'Participation Updated',
                        `${username} has updated their preferences for "${event.title}"`,
                        { type: NotificationCode.PARTICIPATION_UPDATED, eventId: String(eventId) }
                    );
                }
            }

            return result;
        } catch (e) {
            throw e;
        }
    }

    async leave(eventId: number, userId: number) {
        const event = await this.findOne(eventId);

        try {
            const result = await this.eventsRepo.leave(userId, eventId);

            const hostTokens = await this.eventsRepo.getUserTokens([event.host.id]);
            if (hostTokens.length > 0) {
                const leavingUser = await this.eventsRepo.getUserById(userId);
                const username = leavingUser?.username || 'A user';
                this.notificationsService.sendMulticast(
                    hostTokens,
                    'Participation Cancelled',
                    `${username} has cancelled their participation in "${event.title}"`,
                    { type: NotificationCode.PARTICIPATION_CANCELLED, eventId: String(eventId) }
                );
            }

            return result;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Participation not found');
            }
            throw error;
        }
    }

    private mapToDto(event: any): EventResponseDto {
        const hostDto: UserDto = {
            id: event.host.id,
            username: event.host.username,
            profilePicture: event.host.profilePicture,
        };

        const participantsDto: EventParticipantDto[] = event.participants.map((p: any) => ({
            id: p.user.id,
            username: p.user.username,
            profilePicture: p.user.profilePicture,
            status: p.status,
            wantsFood: p.wantsFood,
            wantsWeed: p.wantsWeed,
            wantsSleep: p.wantsSleep,
            wantsAlcohol: p.wantsAlcohol,
        }));

        return {
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime ?? null,
            host: hostDto,
            participants: participantsDto,
            isOpen: event.isOpen,
            hasFood: event.hasFood,
            hasWeed: event.hasWeed,
            hasSleep: event.hasSleep,
            hasAlcohol: event.hasAlcohol,
        };
    }
}
