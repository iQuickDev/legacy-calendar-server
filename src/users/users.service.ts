import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersRepository } from './users.repository';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) { }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      return await this.usersRepo.create({ username: createUserDto.username, password: hashedPassword });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Username already taken');
      }
      throw e;
    }
  }

  findAll(): Promise<UserDto[]> {
    return this.usersRepo.findAll();
  }

  async findOne(id: number): Promise<UserDto> {
    const user = await this.usersRepo.findOne(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findOneByUsername(username: string) {
    return this.usersRepo.findOneByUsername(username);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
    try {
      const updateData = { ...updateUserDto };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      return await this.usersRepo.update(id, updateData as any);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Username already taken');
        }
        if (e.code === 'P2025') {
          throw new NotFoundException(`User with id ${id} not found`);
        }
      }
      throw e;
    }
  }

  async remove(id: number): Promise<UserDto> {
    try {
      return await this.usersRepo.remove(id);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw e;
    }
  }
  async uploadProfilePicture(id: number, file: Express.Multer.File): Promise<UserDto> {
    const user = await this.findOne(id);
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filename = `${id}.webp`;
    const filePath = path.join(uploadDir, filename);

    // Process image: resize to 128x128, convert to webp
    await sharp(file.buffer)
      .resize(128, 128)
      .webp()
      .toFile(filePath);

    const publicUrl = `/uploads/profile-pictures/${filename}`;
    return await this.usersRepo.update(id, { profilePicture: publicUrl } as any);
  }

  async removeProfilePicture(id: number): Promise<UserDto> {
    const user = await this.findOne(id);

    // Attempt to remove file if it exists and looks like a local path
    if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
      try {
        const relativePath = user.profilePicture.replace('/uploads/', '');
        const filePath = path.join(process.cwd(), 'uploads', relativePath);
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore error if file doesn't exist, but log it if needed
        console.error('Failed to delete profile picture file:', error);
      }
    }

    try {
      return await this.usersRepo.update(id, { profilePicture: null } as any);
    } catch (e) {
      console.error('Failed to update user profile picture in DB:', e);
      throw e;
    }
  }
}
