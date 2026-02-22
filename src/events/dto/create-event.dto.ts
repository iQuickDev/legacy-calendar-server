import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
    @ApiProperty({ example: 'Team Standup', description: 'Title of the event' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Weekly sync with the team', description: 'Description', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'Meeting Room A', description: 'Location of the event', required: false })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiProperty({ example: '2026-02-04T10:00:00Z', description: 'Start time (ISO 8601)' })
    @IsDateString()
    @IsNotEmpty()
    startTime: string;

    @ApiProperty({ example: '2026-02-04T11:00:00Z', description: 'End time (ISO 8601)', required: false })
    @IsDateString()
    @IsOptional()
    endTime?: string;

    @ApiProperty({ example: [1, 2], description: 'List of participant user IDs', required: false })
    @IsOptional()
    @IsInt({ each: true })
    participants?: number[];

    @ApiProperty({ example: true, description: 'Whether the event can be joined spontaneously', required: false })
    @IsOptional()
    @IsBoolean()
    isOpen?: boolean;

    @ApiProperty({ example: true, description: 'Whether the event has food', required: false })
    @IsOptional()
    @IsBoolean()
    hasFood?: boolean;

    @ApiProperty({ example: true, description: 'Whether the event has weed', required: false })
    @IsOptional()
    @IsBoolean()
    hasWeed?: boolean;

    @ApiProperty({ example: true, description: 'Whether the event has sleep', required: false })
    @IsOptional()
    @IsBoolean()
    hasSleep?: boolean;

    @ApiProperty({ example: true, description: 'Whether the event has alcohol', required: false })
    @IsOptional()
    @IsBoolean()
    hasAlcohol?: boolean;
}
