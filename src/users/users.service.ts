import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersRepository } from './users.repository';
import { Prisma } from '@prisma/client';

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
}
