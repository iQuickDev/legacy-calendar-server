import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) { }

  async create(createUserDto: CreateUserDto) {
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

  findAll() {
    return this.usersRepo.findAll();
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findOneByUsername(username: string) {
    return this.usersRepo.findOneByUsername(username);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      return await this.usersRepo.update(id, updateUserDto as any);
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

  async remove(id: number) {
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
