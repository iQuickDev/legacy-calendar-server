import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Event, InviteStatus } from '@prisma/client';
import { ParticipateDto } from './dto/participate.dto';

@Injectable()
export class EventsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.EventCreateInput): Promise<Event> {
        return this.prisma.event.create({ data });
    }

    async getUserById(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findAll(): Promise<Event[]> {
        return this.prisma.event.findMany({
            include: {
                host: { select: { id: true, username: true, profilePicture: true } },
                participants: {
                    include: { user: { select: { id: true, username: true, profilePicture: true } } }
                }
            }
        });
    }

    async findOne(id: number): Promise<Event | null> {
        return this.prisma.event.findUnique({
            where: { id },
            include: {
                host: { select: { id: true, username: true, profilePicture: true } },
                participants: {
                    include: { user: { select: { id: true, username: true, profilePicture: true } } }
                }
            },
        });
    }

    async remove(id: number): Promise<Event> {
        return this.prisma.event.delete({ where: { id } });
    }

    async join(userId: number, eventId: number, participateDto: ParticipateDto) {
        const { wantsFood, wantsWeed, wantsSleep, wantsAlcohol } = participateDto;

        return this.prisma.attendance.upsert({
            where: {
                userId_eventId: { userId, eventId }
            },
            update: {
                status: 'ACCEPTED',
                wantsFood,
                wantsWeed,
                wantsSleep,
                wantsAlcohol,
            },
            create: {
                userId,
                eventId,
                status: 'ACCEPTED',
                wantsFood,
                wantsWeed,
                wantsSleep,
                wantsAlcohol,
            },
        });
    }

    async leave(userId: number, eventId: number) {
        return this.prisma.attendance.delete({
            where: {
                userId_eventId: { userId, eventId }
            }
        });
    }

    async update(id: number, data: any): Promise<Event> {
        return this.prisma.event.update({
            where: { id },
            data,
            include: {
                host: { select: { id: true, username: true, profilePicture: true } },
                participants: {
                    include: { user: { select: { id: true, username: true, profilePicture: true } } }
                }
            },
        });
    }

    async inviteUser(eventId: number, username: string) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) {
            return null;
        }

        const existing = await this.prisma.attendance.findUnique({
            where: { userId_eventId: { userId: user.id, eventId } }
        });

        if (existing) return user;

        await this.prisma.attendance.create({
            data: {
                userId: user.id,
                eventId,
                status: 'PENDING',
            },
        });

        return user;
    }

    async getParticipantTokens(eventId: number): Promise<string[]> {
        const attendances = await this.prisma.attendance.findMany({
            where: { eventId },
            include: { user: { include: { fcmTokens: true } } },
        });

        return attendances.flatMap((a) => a.user.fcmTokens.map((t) => t.token));
    }

    async getParticipantTokensByStatus(eventId: number, status: InviteStatus): Promise<string[]> {
        const attendances = await this.prisma.attendance.findMany({
            where: { eventId, status },
            include: { user: { include: { fcmTokens: true } } },
        });

        return attendances.flatMap((a) => a.user.fcmTokens.map((t) => t.token));
    }

    async getUserTokens(userIds: number[]): Promise<string[]> {
        const tokens = await this.prisma.fcmToken.findMany({
            where: { userId: { in: userIds } },
            select: { token: true },
        });

        return tokens.map((t) => t.token);
    }
}
