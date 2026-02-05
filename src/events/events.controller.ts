import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ParseIntPipe, Patch } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventResponseDto } from './dto/event-response.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully', type: EventResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(@Body() createEventDto: CreateEventDto, @Request() req) {
        return this.eventsService.create(createEventDto, req.user.userId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all events' })
    @ApiResponse({ status: 200, description: 'Return all events', type: [EventResponseDto] })
    findAll() {
        return this.eventsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an event by ID' })
    @ApiResponse({ status: 200, description: 'Return event', type: EventResponseDto })
    @ApiResponse({ status: 404, description: 'Event not found' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.eventsService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete an event' })
    @ApiResponse({ status: 200, description: 'Event deleted' })
    @ApiResponse({ status: 403, description: 'Forbidden - Only host can delete' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.eventsService.remove(id, req.user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Update an event' })
    @ApiResponse({ status: 200, description: 'Event updated', type: EventResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden - Only host can update' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateEventDto: UpdateEventDto, @Request() req) {
        return this.eventsService.update(id, updateEventDto, req.user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/invite')
    @ApiOperation({ summary: 'Invite a user to an event' })
    @ApiResponse({ status: 201, description: 'User invited' })
    invite(@Param('id', ParseIntPipe) id: number, @Body('username') username: string, @Request() req) {
        return this.eventsService.invite(id, username, req.user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':id/join')
    @ApiOperation({ summary: 'Join an event' })
    @ApiResponse({ status: 201, description: 'Joined event successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    join(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.eventsService.join(id, req.user.userId);
    }
}
