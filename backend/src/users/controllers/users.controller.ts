import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { UsersService } from '@/users/services/users.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import {
  ICustomRequest,
  IRequestUser,
} from '@/common/interfaces/custom-request.interface';
import { UserModel } from '@/users/models/user.model';
import { DeleteUserDto } from '@/users/dto/delete-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';

@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Return self user' })
  @Get('me')
  async getSelfUser(@Req() { user }: ICustomRequest) {
    const { id } = user as IRequestUser;
    const userDoc = await this.usersService.getOne({ id });

    return plainToInstance(UserModel, userDoc, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Return user by id' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.getOne({ id });

    return plainToInstance(UserModel, user, { excludeExtraneousValues: true });
  }

  @ApiOperation({ summary: 'Update self user' })
  @Patch('me')
  async update(@Req() { user }: ICustomRequest, @Body() dto: UpdateUserDto) {
    const { id } = user as IRequestUser;
    await this.usersService.update({ id, ...dto });
  }

  @ApiOperation({ summary: 'Delete self user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @Delete()
  async remove(
    @Req() { user }: ICustomRequest,
    @Body() { password }: DeleteUserDto,
  ) {
    const { id } = user as IRequestUser;
    await this.usersService.remove({ id, password });
  }
}
