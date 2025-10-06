import { verify } from 'argon2';
import { WhereOptions } from 'sequelize/types';
import { InjectModel } from '@nestjs/sequelize';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptions, InferAttributes } from 'sequelize';

import { UserModel } from '@/users/models/user.model';
import {
  IUserDataCreation,
  IUserDataRemoving,
  IGetUserFilterOptions,
  IGetOneUserOptions,
  IUserDataUpdate,
} from '@/users/interfaces/user.service.interfaces';

@Injectable()
export class UsersService {
  constructor(@InjectModel(UserModel) private userModel: typeof UserModel) {}
  async create(data: IUserDataCreation) {
    const user = await this.userModel.create<UserModel>(data);
    return user.toJSON();
  }

  async update(data: IUserDataUpdate) {
    const { id, ...updateData } = data;
    const result = await this.userModel.update(updateData, {
      where: { id },
    });
    if (result[0] === 0) throw new ForbiddenException('Permission error');
    return;
  }

  async remove({ id, password }: IUserDataRemoving) {
    const user = await this.getOne({ id });
    const verifyPass = await verify(user.password, password);
    if (!verifyPass) throw new BadRequestException('Wrong password');
    await this.userModel.destroy({ where: { id } });
  }

  async getOne(options: IGetOneUserOptions) {
    const findOneOptions: FindOptions<InferAttributes<UserModel>> = {};
    findOneOptions.where = this.getFilter(options);
    const user = await this.userModel.findOne(findOneOptions);
    if (!user) throw new NotFoundException('User not found');
    return user.toJSON();
  }

  async checkUserEmailExists(email: string) {
    const user = await this.userModel.findOne({ where: { email } });
    if (user) throw new BadRequestException('User email already exist');
    return;
  }

  getFilter(options: IGetUserFilterOptions): WhereOptions<UserModel> {
    const filter: WhereOptions<UserModel> = {};

    if (options.id != null) filter.id = options.id;
    if (options.email != null) filter.email = options.email;

    return filter;
  }
}
