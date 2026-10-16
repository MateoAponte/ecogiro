import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, MongoRepository } from 'typeorm';
import { Document, UpdateResult } from 'mongodb';
import { User } from '../user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { MongoHelper } from 'src/common/helpers/mongo.helpers';

@Injectable()
export class UserRepositoryService {
  constructor(
    @InjectRepository(User)
    private readonly repo: MongoRepository<User>,
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
        _id: MongoHelper.toObjectId(id),
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

  async updateUser(
    id: string,
    body: UpdateUserDto,
  ): Promise<Document | UpdateResult> {
    return this.repo.updateOne(
      { _id: MongoHelper.toObjectId(id) },
      { $set: body },
    );
  }

  deleteUser(id: string): Promise<DeleteResult> {
    const objectId = MongoHelper.toObjectId(id);

    return this.repo.delete(objectId);
  }
}
