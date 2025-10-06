import {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Column, DataType, Table, HasMany } from 'sequelize-typescript';

import { BaseModel } from '@/common/models/base.model';
import { PortfolioModel } from '@/portfolios/models/portfolio.model';

@Exclude()
@Table({ tableName: 'users' })
export class UserModel extends BaseModel<
  InferAttributes<UserModel>,
  InferCreationAttributes<UserModel>
> {
  @ApiProperty({ example: 'Benjamin', description: 'User name' })
  @Expose()
  @Column({ allowNull: false })
  name: string;

  @ApiProperty({ example: 'Franklin', description: 'User last name' })
  @Expose()
  @Column({ allowNull: false })
  lastName: string;

  @ApiProperty({
    example: 'benfrank@protonmail.com',
    description: 'User email',
  })
  @Expose()
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  @Exclude()
  password: string;

  @ApiProperty({ type: [PortfolioModel], description: 'Portfolios array' })
  @Expose()
  @HasMany(() => PortfolioModel)
  portfolios?: CreationOptional<PortfolioModel[]>;
}
