import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  ParseIntPipe,
  Patch,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AuthGuard } from '@/auth/guards/auth.guard';
import {
  ICustomRequest,
  IRequestUser,
} from '@/common/interfaces/custom-request.interface';
import { PortfolioPageDto } from '@/portfolios/dto/portfolio-page.dto';
import { PortfolioEntity } from '@/portfolios/entities/portfolio.entity';
import { CreatePortfolioDto } from '@/portfolios/dto/create-portfolio.dto';
import { PortfoliosService } from '@/portfolios/services/portfolios.service';
import { UpdatePortfolioDto } from '@/portfolios/dto/update-portfolio.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @ApiOperation({ summary: 'Create portfolio' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Returns portfolio',
  })
  @Post()
  async create(
    @Req() { user }: ICustomRequest,
    @Body() dto: CreatePortfolioDto,
  ) {
    const { id: userId } = user as IRequestUser;
    const portfolio = await this.portfoliosService.create({ ...dto, userId });
    return plainToInstance(PortfolioEntity, portfolio, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update portfolio' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @Patch(':id')
  update(
    @Req() { user }: ICustomRequest,
    @Param('id', ParseIntPipe) portfolioId: number,
    @Body() dto: UpdatePortfolioDto,
  ) {
    const { id: userId } = user as IRequestUser;
    return this.portfoliosService.update({ ...dto, portfolioId, userId });
  }

  @ApiOperation({ summary: 'Get portfolios page' })
  @SerializeOptions({ excludeExtraneousValues: true })
  @Get()
  async getPage(@Query() query: PortfolioPageDto) {
    const { models, count } = await this.portfoliosService.getPage(query);
    return {
      models: plainToInstance(PortfolioEntity, models, {
        excludeExtraneousValues: true,
      }),
      count,
    };
  }

  @ApiOperation({ summary: 'Get portfolio by id' })
  @ApiOkResponse({ type: PortfolioEntity })
  @SerializeOptions({ excludeExtraneousValues: true })
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) portfolioId: number) {
    const portfolio = await this.portfoliosService.findOne({
      id: portfolioId,
      relations: { images: true },
    });

    return plainToInstance(PortfolioEntity, portfolio, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete portfolio' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @Delete(':id')
  async remove(
    @Req() { user }: ICustomRequest,
    @Param('id', ParseIntPipe) portfolioId: number,
  ) {
    const { id: userId } = user as IRequestUser;

    await this.portfoliosService.remove(portfolioId, userId);
  }
}
