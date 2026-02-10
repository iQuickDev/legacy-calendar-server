import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User as UserModel } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: Prisma.UserCreateInput): Promise<Pick<UserModel, 'id' | 'username' | 'profilePicture'>> {
    return this.prisma.user.create({
      data,
      select: { id: true, username: true, profilePicture: true },
    });
  }

  findAll(): Promise<Pick<UserModel, 'id' | 'username' | 'profilePicture'>[]> {
    return this.prisma.user.findMany({
      select: { id: true, username: true, profilePicture: true },
    });
  }

  findOne(id: number): Promise<Pick<UserModel, 'id' | 'username' | 'profilePicture'> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, profilePicture: true },
    });
  }

  findOneByUsername(username: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  update(id: number, data: Prisma.UserUpdateInput): Promise<Pick<UserModel, 'id' | 'username' | 'profilePicture'>> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, profilePicture: true },
    });
  }

  remove(id: number): Promise<Pick<UserModel, 'id' | 'username' | 'profilePicture'>> {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, username: true, profilePicture: true },
    });
  }
}
