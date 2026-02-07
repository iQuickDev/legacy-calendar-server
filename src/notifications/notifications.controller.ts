import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

class SubscribeDto {
    @ApiProperty({ example: 'fcm_token_here', description: 'Firebase FCM Token' })
    @IsString()
    @IsNotEmpty()
    token: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('subscribe')
    @ApiOperation({ summary: 'Subscribe device to notifications' })
    @ApiResponse({ status: 201, description: 'Subscribed successfully' })
    async subscribe(@Request() req, @Body() body: SubscribeDto): Promise<void> {
        await this.notificationsService.subscribe(req.user.userId, body.token);
    }
}
