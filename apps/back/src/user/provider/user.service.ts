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
import { UpdateTeamDto } from '../dto/update-team.dto';

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

  async updateFavorities(id: string, favorite: number): Promise<string> {
    const { favorities, ...user } = await this.checkUser(id);

    if (favorities.includes(favorite))
      favorities.splice(favorities.indexOf(favorite), 1);
    else favorities.push(favorite);

    await this.userRepository.updateUser(id, { ...user, favorities });
    return 'Favorities updated successfully';
  }

  async updateTeam(id: string, update: UpdateTeamDto): Promise<string> {
    if (update.team.length > 6) {
      throw new BadRequestException('You can only add 6 pokemon to your team');
    }

    const { ...user } = await this.checkUser(id);

    const uniqueTeam = new Set(update.team);
    if (uniqueTeam.size !== update.team.length) {
      throw new BadRequestException('Team cannot contain duplicate pokemon');
    }
    await this.userRepository.updateUser(id, {
      ...user,
      team: update.team,
    });

    return 'Team updated successfully';
  }

  async removePokemonFromTeam(id: string, pokemonId: number): Promise<string> {
    const { team, ...user } = await this.checkUser(id);

    if (!team.includes(pokemonId)) {
      throw new BadRequestException(
        `Pokemon with id ${pokemonId} is not in your team`,
      );
    }

    team.splice(team.indexOf(pokemonId), 1);
    await this.userRepository.updateUser(id, {
      ...user,
      team,
    });

    return 'Pokemon removed successfully';
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<string> {
    const user = await this.userRepository.findUserById(id);
    if (user === null)
      throw new NotFoundException(`User with id ${id} not found`);

    const update = await this.userRepository.updateUser(id, updateUserDto);

    if (update.modifiedCount <= 0) return 'The user was already updated';
    return 'User updated successfully';
  }

  async remove(id: string): Promise<DeleteResult> {
    const user = await this.userRepository.findUserById(id);

    if (user === null)
      throw new NotFoundException(`User with id ${id} not found`);

    return this.userRepository.deleteUser(id);
  }
}
