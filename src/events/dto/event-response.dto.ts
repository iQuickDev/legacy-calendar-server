
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../users/dto/user.dto';
import { InviteStatus } from '@prisma/client';

export class EventParticipantDto extends UserDto {
    @ApiProperty({ enum: InviteStatus, example: 'PENDING', description: 'Status of the invitation' })
    status: InviteStatus;

    @ApiProperty({ example: true, description: 'User wants food' })
    wantsFood?: boolean;

    @ApiProperty({ example: true, description: 'User wants weed' })
    wantsWeed?: boolean;

    @ApiProperty({ example: true, description: 'User wants sleep' })
    wantsSleep?: boolean;

    @ApiProperty({ example: true, description: 'User wants alcohol' })
    wantsAlcohol?: boolean;
}

export class EventResponseDto {
    @ApiProperty({ example: 1, description: 'Event ID' })
    id: number;

    @ApiProperty({ example: 'Team Standup', description: 'Title of the event' })
    title: string;

    @ApiProperty({ example: 'Weekly sync with the team', description: 'Description', required: false })
    description?: string;

    @ApiProperty({ example: 'Meeting Room A', description: 'Location', required: false })
    location?: string;

    @ApiProperty({ example: '2026-02-04T10:00:00Z', description: 'Start time' })
    startTime: Date;

    @ApiProperty({ example: '2026-02-04T11:00:00Z', description: 'End time', required: false })
    endTime: Date | null;

    @ApiProperty({ type: UserDto, description: 'Host of the event' })
    host: UserDto;

    @ApiProperty({ type: [EventParticipantDto], description: 'List of participants' })
    participants: EventParticipantDto[];

    @ApiProperty({ example: true, description: 'Whether the event is open for spontaneous joining' })
    isOpen: boolean;

    @ApiProperty({ example: true, description: 'Event has food' })
    hasFood?: boolean;

    @ApiProperty({ example: true, description: 'Event has weed' })
    hasWeed?: boolean;

    @ApiProperty({ example: true, description: 'Event has sleep' })
    hasSleep?: boolean;

    @ApiProperty({ example: true, description: 'Event has alcohol' })
    hasAlcohol?: boolean;
}
