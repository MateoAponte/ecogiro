import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

export class MongoHelper {
  static toObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch {
      throw new BadRequestException('Invalid user id');
    }
  }
}
