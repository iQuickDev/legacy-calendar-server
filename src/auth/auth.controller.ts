import { Controller, Post, UseGuards, Request, Body, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthLoginDto } from './dto/auth-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiBody({ type: AuthLoginDto })
    @ApiResponse({ status: 200, description: 'Return JWT access token' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Request() req, @Body() loginDto: AuthLoginDto) {
        return this.authService.login(req.user);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('profile')
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({ status: 200, description: 'Return user profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Request() req) {
        return this.usersService.findOne(req.user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @ApiOperation({ summary: 'Change user password' })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiResponse({ status: 400, description: 'Incorrect current password' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.userId, changePasswordDto);
    }
}
