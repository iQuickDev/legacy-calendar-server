import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User as UserModel } from '../generated/prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(data: Prisma.UserCreateInput): Promise<UserModel> {
    return this.prisma.user.create({ data });
  }

  findAll(): Promise<UserModel[]> {
    return this.prisma.user.findMany();
  }

  findOne(id: number): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findOneByUsername(username: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  update(id: number, data: Prisma.UserUpdateInput): Promise<UserModel> {
    return this.prisma.user.update({ where: { id }, data });
  }

  remove(id: number): Promise<UserModel> {
    return this.prisma.user.delete({ where: { id } });
  }
}
