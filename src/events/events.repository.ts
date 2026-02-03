import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Prisma, Event } from '../generated/prisma/client';

@Injectable()
export class EventsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.EventCreateInput): Promise<Event> {
        return this.prisma.event.create({ data });
    }

    async findAll(): Promise<Event[]> {
        return this.prisma.event.findMany({ include: { host: true, participants: true } });
    }

    async findOne(id: number): Promise<Event | null> {
        return this.prisma.event.findUnique({
            where: { id },
            include: { host: true, participants: true },
        });
    }

    async remove(id: number): Promise<Event> {
        return this.prisma.event.delete({ where: { id } });
    }

    async join(userId: number, eventId: number) {
        return this.prisma.attendance.create({
            data: {
                userId,
                eventId,
                status: 'ACCEPTED', // Auto-accept for now
            },
        });
    }
}
