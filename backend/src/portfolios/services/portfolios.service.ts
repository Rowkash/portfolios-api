import {
  FindOptions,
  Includeable,
  InferAttributes,
  Op,
  WhereOptions,
} from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';

import {
  IGetOnePortfolioOptions,
  IPortfolioDataCreation,
  IPortfolioDataUpdate,
  IGetPortfolioFilterOptions,
  IGetPortfolioIncludesOptions,
} from '@/portfolios/interfaces/portfolio.service.interfaces';
import { MinioService } from '@/minio/services/minio.service';
import { SortingDbHelper } from '@/common/helper/sorting.helper';
import { PortfolioModel } from '@/portfolios/models/portfolio.model';
import { PortfolioPageDto } from '@/portfolios/dto/portfolio-page.dto';
import { PortfolioImageModel } from '@/portfolios/models/portfolio-image.model';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectModel(PortfolioModel) private portfolioModel: typeof PortfolioModel,
    private readonly storage: MinioService,
  ) {}

  async create(data: IPortfolioDataCreation) {
    const portfolio = await this.portfolioModel.create<PortfolioModel>(data);
    return portfolio.toJSON();
  }

  async update(data: IPortfolioDataUpdate) {
    const { userId, portfolioId, ...updateData } = data;
    await this.findOne({ id: portfolioId, userId });
    await this.portfolioModel.update(updateData, {
      where: { id: portfolioId },
    });
  }

  async getPage(options: PortfolioPageDto) {
    const { limit = 20, page = 1 } = options;
    const sorting = new SortingDbHelper(options);
    const includes = this.getIncludes({ images: true });
    const filter = this.getFilter(options);
    const { rows, count } = await this.portfolioModel.findAndCountAll({
      where: filter,
      order: sorting.orderBy,
      limit: limit,
      offset: (page - 1) * limit,
      include: includes,
      distinct: true,
    });

    const models = rows.map((row) => row.get({ plain: true }));

    return { models, count };
  }

  async findOne(options: IGetOnePortfolioOptions) {
    const findOneOptions: FindOptions<InferAttributes<PortfolioModel>> = {};
    findOneOptions.where = this.getFilter(options);
    if (options.includes) {
      findOneOptions.include = this.getIncludes(options.includes);
    }
    const portfolio = await this.portfolioModel.findOne(findOneOptions);
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio.get({ plain: true });
  }

  async remove(id: number, userId: number) {
    const portfolio = await this.findOne({
      id,
      userId,
      includes: { images: true },
    });

    if (portfolio.images && portfolio.images.length > 0) {
      const fileNames = portfolio.images.map((image) => image.fileName);
      await this.storage.deleteFiles(fileNames);
    }

    await this.portfolioModel.destroy({ where: { id } });
  }

  getFilter(options: IGetPortfolioFilterOptions): WhereOptions<PortfolioModel> {
    const filter: WhereOptions<PortfolioModel> = {};

    if (options.id != null) filter.id = options.id;
    if (options.userId != null) filter.userId = options.userId;
    if (options.name != null) filter.name = { [Op.like]: `%${options.name}%` };

    return filter;
  }

  getIncludes(options: IGetPortfolioIncludesOptions | undefined): Includeable {
    const includes: Includeable = {};

    if (options?.images) {
      includes.model = PortfolioImageModel;
    }

    return includes;
  }
}
