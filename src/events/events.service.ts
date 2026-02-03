import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsRepository } from './events.repository';

@Injectable()
export class EventsService {
    constructor(private readonly eventsRepo: EventsRepository) { }

    async create(createEventDto: CreateEventDto, userId: number) {
        return this.eventsRepo.create({
            ...createEventDto,
            host: { connect: { id: userId } },
        });
    }

    findAll() {
        return this.eventsRepo.findAll();
    }

    async findOne(id: number) {
        const event = await this.eventsRepo.findOne(id);
        if (!event) throw new NotFoundException(`Event with id ${id} not found`);
        return event;
    }

    async remove(id: number, userId: number) {
        const event = await this.findOne(id);
        if (event.hostId !== userId) {
            throw new ForbiddenException('Only the host can delete this event');
        }
        return this.eventsRepo.remove(id);
    }

    async join(eventId: number, userId: number) {
        const event = await this.findOne(eventId); // Ensure event exists
        try {
            return await this.eventsRepo.join(userId, eventId);
        } catch (e) {
            // Handle unique constraint violation if user already joined?
            // For simplicity, we might just let it fail or catch specific error
            throw e;
        }
    }
}
