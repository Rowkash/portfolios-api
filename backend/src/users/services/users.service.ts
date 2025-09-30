import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { verify } from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';

import {
  IUserDataCreation,
  IUserDataRemoving,
  IGetUserFilterOptions,
  IGetOneUserOptions,
  IUserDataUpdate,
} from '@/users/interfaces/user.service.interfaces';
import { UserEntity } from '@/users/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}
  async create(data: IUserDataCreation) {
    const user = this.usersRepository.create(data);
    return await this.usersRepository.save(user);
  }

  async update(data: IUserDataUpdate) {
    const { id, ...updateData } = data;
    const { affected } = await this.usersRepository.update(id, updateData);
    if (affected === 0) throw new ForbiddenException('Permission error');
    return;
  }

  async remove({ id, password }: IUserDataRemoving) {
    const user = await this.getOne({ id });
    const verifyPass = await verify(user.password, password);
    if (!verifyPass) throw new BadRequestException('Wrong password');
    await this.usersRepository.delete({ id });
  }

  async getOne(options: IGetOneUserOptions) {
    const findOneOptions: FindOneOptions<UserEntity> = {};
    findOneOptions.where = this.getFilter(options);
    const user = await this.usersRepository.findOne(findOneOptions);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async checkUserEmailExists(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) throw new BadRequestException('User email already exist');
    return;
  }

  getFilter(options: IGetUserFilterOptions): FindOptionsWhere<UserEntity> {
    const filter: FindOptionsWhere<UserEntity> = {};

    if (options.id != null) filter.id = options.id;
    if (options.email != null) filter.email = options.email;

    return filter;
  }
}
