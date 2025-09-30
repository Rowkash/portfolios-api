import {
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { JobEnum } from '@/bull/enums/job.enum';
import { QueueEnum } from '@/bull/enums/queue.enum';
import { IMinioConfig } from '@/configs/minio.config';
import { MinioService } from '@/minio/services/minio.service';
import {
  IGetOnePortfolioImageOptions,
  IPortfolioImageDataRemoving,
  IGetPortfolioImageFilterOptions,
  IPortfolioImageDataCreation,
  IPortfolioImageDataUpdate,
  IGetPortfolioImageRelationsOptions,
} from '@/portfolios/interfaces/portfolio-images.service.interfaces';
import { PortfoliosService } from '@/portfolios/services/portfolios.service';
import { PortfolioImageEntity } from '@/portfolios/entities/portfolio-image.entity';

@Injectable()
export class PortfolioImagesService {
  constructor(
    @InjectRepository(PortfolioImageEntity)
    private portfolioImagesRepository: Repository<PortfolioImageEntity>,
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
    const image = this.portfolioImagesRepository.create({
      ...createData,
      fileName,
      url,
    });
    await this.mediaProcessingQueue.add(JobEnum.PROCESS_MEDIA_JOB, storageKey, {
      removeOnComplete: true,
      attempts: 2,
      delay: 10000,
    });
    return await this.portfolioImagesRepository.save(image);
  }

  async update(data: IPortfolioImageDataUpdate) {
    const { id, userId, portfolioId, file, ...updateData } = data;
    const image = await this.findOne({ id, userId, portfolioId });
    if (!image) throw new NotFoundException('Portfolio image not found');
    await this.portfolioImagesRepository.update({ id }, updateData);

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
    const findOneOptions: FindOneOptions<PortfolioImageEntity> = {};
    findOneOptions.where = this.getFilter(options);
    if (options.relations) {
      findOneOptions.relations = this.getRelations(options.relations);
    }
    const image = await this.portfolioImagesRepository.findOne(findOneOptions);
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async remove(options: IPortfolioImageDataRemoving) {
    const { portfolioId, imageId } = options;
    const relations = { portfolio: true };
    const image = await this.findOne({ id: imageId, portfolioId, relations });

    if (image.portfolio.userId !== options.userId)
      throw new ForbiddenException('Permissions error');

    await Promise.all([
      this.storage.deleteFile(image.fileName),
      this.portfolioImagesRepository.delete({ id: imageId }),
    ]);
  }

  getFilter(
    options: IGetPortfolioImageFilterOptions,
  ): FindOptionsWhere<PortfolioImageEntity> {
    const filter: FindOptionsWhere<PortfolioImageEntity> = {};

    if (options.id != null) filter.id = options.id;
    if (options.portfolioId != null) filter.portfolioId = options.portfolioId;

    return filter;
  }

  getRelations(
    options: IGetPortfolioImageRelationsOptions,
  ): FindOptionsRelations<PortfolioImageEntity> {
    const relations: FindOptionsRelations<PortfolioImageEntity> = {};

    if (options.portfolio && options.portfolio === true) {
      relations.portfolio = options.portfolio;
    }

    return relations;
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
