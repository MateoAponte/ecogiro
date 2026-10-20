import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepositoryService } from './user.repository.service';
import { DeleteResult } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { User } from '../user.entity';

@Injectable()
export class UserService {
  constructor(
    /**
     * Inject the UserService
     * @param userRepository - Inject the UserRepositoryService
     */
    private readonly userRepository: UserRepositoryService,

    /**
     * Inject the AuthService
     * @param authService - Inject the AuthService
     */
    private readonly authService: AuthService,
  ) {}

  async checkUser(id: string): Promise<User> {
    const user = await this.userRepository.findUserById(id);
    if (user === null)
      throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const hashPass = await this.authService.hashPassword(
      createUserDto.password,
    );

    const existingUser = await this.userRepository.findUserByEmail(
      createUserDto.email,
    );
    if (existingUser !== null)
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );

    const user = await this.userRepository.createUser({
      ...createUserDto,
      password: hashPass,
    });

    return UserResponseDto.fromEntity(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findUserById(id);

    if (user == null)
      throw new NotFoundException(`User with id ${id} not found`);
    return UserResponseDto.fromEntity(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<string> {
    const user = await this.userRepository.findUserById(id);
    if (user === null)
      throw new NotFoundException(`User with id ${id} not found`);

    if (!Object.keys(updateUserDto).length) {
      throw new BadRequestException('Provide at least one field to update');
    }
    const changes = { ...updateUserDto };
    if (changes.password !== undefined) {
      changes.password = await this.authService.hashPassword(changes.password);
    }
    const update = await this.userRepository.updateUser(id, changes);

    if (update.affected === 0)
      throw new NotFoundException(`User with id ${id} not found`);
    return 'User updated successfully';
  }

  async remove(id: string): Promise<DeleteResult> {
    const user = await this.userRepository.findUserById(id);

    if (user === null)
      throw new NotFoundException(`User with id ${id} not found`);

    return this.userRepository.deleteUser(id);
  }
}
