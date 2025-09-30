import {
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  Like,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { MinioService } from '@/minio/services/minio.service';
import {
  IGetOnePortfolioOptions,
  IPortfolioDataCreation,
  IPortfolioDataUpdate,
  IGetPortfolioFilterOptions,
  IGetPortfolioRelationsOptions,
} from '@/portfolios/interfaces/portfolio.service.interfaces';
import { SortingDbHelper } from '@/common/helper/sorting.helper';
import { PortfolioPageDto } from '@/portfolios/dto/portfolio-page.dto';
import { PortfolioEntity } from '@/portfolios/entities/portfolio.entity';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(PortfolioEntity)
    private portfoliosRepository: Repository<PortfolioEntity>,
    private readonly storage: MinioService,
  ) {}

  async create(data: IPortfolioDataCreation) {
    const portfolio = this.portfoliosRepository.create(data);
    return await this.portfoliosRepository.save(portfolio);
  }

  async update(data: IPortfolioDataUpdate) {
    const { userId, portfolioId, ...updateData } = data;
    await this.findOne({ id: portfolioId, userId });
    await this.portfoliosRepository.update(
      {
        id: portfolioId,
      },
      updateData,
    );
  }

  async getPage(options: PortfolioPageDto) {
    const { limit = 20, page = 1 } = options;
    const sorting = new SortingDbHelper<PortfolioEntity>(options);
    const filter = this.getFilter(options);
    const relations = this.getRelations({ images: true });
    const [portfolios, count] = await this.portfoliosRepository.findAndCount({
      order: sorting.orderBy,
      where: filter,
      take: limit,
      skip: (page - 1) * limit,
      relations,
    });

    const models = portfolios.map((portfolio) => portfolio);

    return { models, count };
  }

  async findOne(options: IGetOnePortfolioOptions) {
    const findOneOptions: FindOneOptions<PortfolioEntity> = {};
    findOneOptions.where = this.getFilter(options);
    if (options.relations) {
      findOneOptions.relations = this.getRelations(options.relations);
    }
    const portfolio = await this.portfoliosRepository.findOne(findOneOptions);
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  async remove(id: number, userId: number) {
    const portfolio = await this.findOne({
      id,
      userId,
      relations: { images: true },
    });

    if (portfolio.images && portfolio.images.length > 0) {
      const fileNames = portfolio.images.map((image) => image.fileName);
      await this.storage.deleteFiles(fileNames);
    }

    await this.portfoliosRepository.delete({ id });
  }

  getFilter(
    options: IGetPortfolioFilterOptions,
  ): FindOptionsWhere<PortfolioEntity> {
    const filter: FindOptionsWhere<PortfolioEntity> = {};

    if (options.id != null) filter.id = options.id;
    if (options.userId != null) filter.userId = options.userId;
    if (options.name != null) filter.name = Like(`%${options.name}%`);

    return filter;
  }

  getRelations(
    options: IGetPortfolioRelationsOptions,
  ): FindOptionsRelations<PortfolioEntity> {
    const relations: FindOptionsRelations<PortfolioEntity> = {};

    if (options.images && options.images === true) {
      relations.images = options.images;
    }

    return relations;
  }
}
