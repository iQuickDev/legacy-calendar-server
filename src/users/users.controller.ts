
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, ParseFilePipeBuilder, HttpStatus, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { BypassGuard } from '../auth/guards/bypass.guard';
import { UserAuthGuard } from '../auth/guards/user-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseGuards(BypassGuard)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiHeader({ name: 'X-Bypass', description: 'Bypass key for user operations' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-Bypass header' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post('profile-picture')
  @UseGuards(UserAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Bypass', description: 'Bypass key for user operations (optional if using JWT)', required: false })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile picture uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  uploadProfilePicture(
    @Body('userId') userId: string,
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /image\/(jpg|jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    const targetUserId = req.isBypass ? +userId : (userId ? +userId : req.user.userId);

    if (isNaN(targetUserId)) {
      throw new BadRequestException('Invalid or missing userId');
    }

    if (!req.isBypass && req.user && targetUserId !== req.user.userId) {
      throw new ForbiddenException('You can only update your own profile picture');
    }
    return this.usersService.uploadProfilePicture(targetUserId, file);
  }

  @Delete('profile-picture')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Remove profile picture' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Bypass', description: 'Bypass key for user operations (optional if using JWT)', required: false })
  @ApiResponse({ status: 200, description: 'Profile picture removed' })
  removeProfilePicture(@Body('userId') userId: string, @Request() req: any) {
    const targetUserId = req.isBypass ? +userId : (userId ? +userId : req.user.userId);

    if (isNaN(targetUserId)) {
      throw new BadRequestException('Invalid or missing userId');
    }

    if (!req.isBypass && req.user && targetUserId !== req.user.userId) {
      throw new ForbiddenException('You can only remove your own profile picture');
    }
    return this.usersService.removeProfilePicture(targetUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(BypassGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiHeader({ name: 'X-Bypass', description: 'Bypass key for user operations' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-Bypass header' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(BypassGuard)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiHeader({ name: 'X-Bypass', description: 'Bypass key for user operations' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-Bypass header' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
