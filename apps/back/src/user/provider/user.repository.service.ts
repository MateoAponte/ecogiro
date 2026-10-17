import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { User } from '../user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserRepositoryService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  createUser(body: CreateUserDto): Promise<User> {
    const user = this.repo.create(body);
    return this.repo.save(user);
  }

  findAll(): Promise<User[]> {
    return this.repo.find();
  }

  findUserById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: {
        id: this.parseId(id),
      },
    });
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: {
        email,
      },
    });
  }

  async updateUser(id: string, body: UpdateUserDto): Promise<UpdateResult> {
    return this.repo.update(this.parseId(id), body);
  }

  deleteUser(id: string): Promise<DeleteResult> {
    return this.repo.delete(this.parseId(id));
  }

  private parseId(id: string): number {
    const value = Number(id);
    if (
      !/^\d+$/.test(id) ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      value > 2147483647
    ) {
      throw new BadRequestException('Not valid ID');
    }
    return value;
  }
}
