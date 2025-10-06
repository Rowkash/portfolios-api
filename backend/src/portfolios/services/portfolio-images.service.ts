import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import {
  FindOptions,
  Includeable,
  InferAttributes,
  WhereOptions,
} from 'sequelize';

import { JobEnum } from '@/bull/enums/job.enum';
import { QueueEnum } from '@/bull/enums/queue.enum';
import { IMinioConfig } from '@/configs/minio.config';
import { MinioService } from '@/minio/services/minio.service';
import { PortfolioModel } from '@/portfolios/models/portfolio.model';
import {
  IGetOnePortfolioImageOptions,
  IPortfolioImageDataRemoving,
  IGetPortfolioImageFilterOptions,
  IGetPortfolioImageIncludesOptions,
  IPortfolioImageDataCreation,
  IPortfolioImageDataUpdate,
} from '@/portfolios/interfaces/portfolio-images.service.interfaces';
import { PortfoliosService } from '@/portfolios/services/portfolios.service';
import { PortfolioImageModel } from '@/portfolios/models/portfolio-image.model';

@Injectable()
export class PortfolioImagesService {
  constructor(
    @InjectModel(PortfolioImageModel)
    private portfolioImageModel: typeof PortfolioImageModel,
    private readonly portfoliosService: PortfoliosService,
    private readonly storage: MinioService,
    private readonly configService: ConfigService,
    @InjectQueue(QueueEnum.MEDIA_PROCESSING_QUEUE)
    private readonly mediaProcessingQueue: Queue,
  ) {}

  async create(data: IPortfolioImageDataCreation) {
    const { file, ...createData } = data;
    await this.portfoliosService.findOne({
      id: createData.portfolioId,
      userId: createData.userId,
    });
    const fileName = uuidv4();
    const storageKey = `${createData.userId}/${fileName}`;
    await this.storage.uploadFile({ file, key: storageKey });
    const url = this.getImagePathFromS3(storageKey);
    const image = await this.portfolioImageModel.create<PortfolioImageModel>({
      ...createData,
      fileName,
      url,
    });
    await this.mediaProcessingQueue.add(JobEnum.PROCESS_MEDIA_JOB, storageKey, {
      removeOnComplete: true,
      attempts: 2,
      delay: 10000,
    });
    return image.toJSON();
  }

  async update(data: IPortfolioImageDataUpdate) {
    const { id, userId, portfolioId, file, ...updateData } = data;
    const image = await this.findOne({ id, userId, portfolioId });
    if (!image) throw new NotFoundException('Portfolio image not found');
    await this.portfolioImageModel.update(updateData, { where: { id } });

    if (file) {
      const storageKey = `${userId}/${image.fileName}`;
      await this.storage.uploadFile({ key: storageKey, file });
      await this.mediaProcessingQueue.add(
        JobEnum.PROCESS_MEDIA_JOB,
        storageKey,
        {
          removeOnComplete: true,
          attempts: 2,
          delay: 10000,
        },
      );
    }
  }

  async findOne(options: IGetOnePortfolioImageOptions) {
    const findOneOptions: FindOptions<InferAttributes<PortfolioImageModel>> =
      {};
    findOneOptions.where = this.getFilter(options);
    if (options.include) {
      findOneOptions.include = this.getIncludes(options.include);
    }
    const image = await this.portfolioImageModel.findOne(findOneOptions);
    if (!image) throw new NotFoundException('Image not found');
    return image.get({ plain: true });
  }

  async remove(options: IPortfolioImageDataRemoving) {
    const { portfolioId, imageId } = options;
    const include = { portfolio: true };
    const image = await this.findOne({ id: imageId, portfolioId, include });

    if (image.portfolio.userId !== options.userId)
      throw new ForbiddenException('Permissions error');

    await Promise.all([
      this.storage.deleteFile(image.fileName),
      this.portfolioImageModel.destroy({ where: { id: imageId } }),
    ]);
  }

  getFilter(
    options: IGetPortfolioImageFilterOptions,
  ): WhereOptions<PortfolioImageModel> {
    const filter: WhereOptions<PortfolioImageModel> = {};

    if (options.id != null) filter.id = options.id;
    if (options.portfolioId != null) filter.portfolioId = options.portfolioId;

    return filter;
  }

  getIncludes(options: IGetPortfolioImageIncludesOptions): Includeable {
    const includes: Includeable = {};

    if (options.portfolio && options.portfolio === true) {
      includes.model = PortfolioModel;
    }

    return includes;
  }

  getImagePathFromS3(key: string) {
    const minioConfig: IMinioConfig = this.configService.get<IMinioConfig>(
      'minio',
      {
        infer: true,
      },
    );

    return `${minioConfig.endpoint}/${minioConfig.bucketName}/${key}`;
  }
}
