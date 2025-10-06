import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';

import {
  IGetPortfolioFilterOptions,
  IGetPortfolioIncludesOptions,
} from '@/portfolios/interfaces/portfolio.service.interfaces';
import { MinioService } from '@/minio/services/minio.service';
import { PortfolioModel } from '@/portfolios/models/portfolio.model';
import { PortfoliosService } from '@/portfolios/services/portfolios.service';
import { PortfolioImageModel } from '@/portfolios/models/portfolio-image.model';

describe('PortfoliosService', () => {
  let portfoliosService: PortfoliosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfoliosService,
        {
          provide: getModelToken(PortfolioModel),
          useValue: {},
        },
        {
          provide: MinioService,
          useValue: {},
        },
      ],
    }).compile();

    portfoliosService = module.get(PortfoliosService);
  });

  it('should be defined', () => {
    expect(PortfoliosService).toBeDefined();
  });

  describe('getFilter()', () => {
    it.each`
      payload                     | expectedResult
      ${{}}                       | ${{}}
      ${{ id: 123 }}              | ${{ id: 123 }}
      ${{ userId: 222 }}          | ${{ userId: 222 }}
      ${{ id: 123, userId: 444 }} | ${{ id: 123, userId: 444 }}
    `(
      'should return correct filter $payload',
      ({ payload, expectedResult }) => {
        const result = portfoliosService.getFilter(
          payload as IGetPortfolioFilterOptions,
        );
        expect(result).toEqual(expectedResult);
      },
    );
  });

  describe('getIncludes()', () => {
    it.each`
      payload             | expectedResult
      ${{}}               | ${{}}
      ${{ images: true }} | ${{ model: PortfolioImageModel }}
    `(
      'should return correct filter $payload',
      ({ payload, expectedResult }) => {
        const result = portfoliosService.getIncludes(
          payload as IGetPortfolioIncludesOptions,
        );
        expect(result).toEqual(expectedResult);
      },
    );
  });
});
