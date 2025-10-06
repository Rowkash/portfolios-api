import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BullQueueModule } from '@/bull/bull-queue.module';

import { MinioModule } from '@/minio/minio.module';
import { MediaModule } from '@/media/media.module';
import { PortfolioModel } from '@/portfolios/models/portfolio.model';
import { PortfoliosService } from '@/portfolios/services/portfolios.service';
import { PortfolioImageModel } from '@/portfolios/models/portfolio-image.model';
import { PortfoliosController } from '@/portfolios/controllers/portfolios.controller';
import { PortfolioImagesService } from '@/portfolios/services/portfolio-images.service';
import { PortfolioImagesController } from '@/portfolios/controllers/portfolio-images.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([PortfolioModel, PortfolioImageModel]),
    MinioModule,
    MediaModule,
    BullQueueModule,
  ],
  controllers: [PortfoliosController, PortfolioImagesController],
  providers: [PortfoliosService, PortfolioImagesService],
  exports: [PortfoliosService, PortfolioImagesService],
})
export class PortfoliosModule {}
