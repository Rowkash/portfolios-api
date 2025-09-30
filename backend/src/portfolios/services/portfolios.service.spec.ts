import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import {
  IGetPortfolioFilterOptions,
  IGetPortfolioRelationsOptions,
} from '@/portfolios/interfaces/portfolio.service.interfaces';
import { MinioService } from '@/minio/services/minio.service';
import { PortfolioEntity } from '@/portfolios/entities/portfolio.entity';
import { PortfoliosService } from '@/portfolios/services/portfolios.service';
import { Like } from 'typeorm';

describe('PortfoliosService', () => {
  let portfoliosService: PortfoliosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfoliosService,
        {
          provide: getRepositoryToken(PortfolioEntity),
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
      payload                                        | expectedResult
      ${{}}                                          | ${{}}
      ${{ id: 123 }}                                 | ${{ id: 123 }}
      ${{ userId: 222 }}                             | ${{ userId: 222 }}
      ${{ name: 'Portfolio' }}                       | ${{ name: Like(`%Portfolio%`) }}
      ${{ id: 123, userId: 444, name: 'Portfolio' }} | ${{ id: 123, userId: 444, name: Like(`%Portfolio%`) }}
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

  describe('getRelations()', () => {
    it.each`
      payload             | expectedResult
      ${{}}               | ${{}}
      ${{ images: true }} | ${{ images: true }}
      ${{ images: 123 }}  | ${{}}
    `(
      'should return correct filter $payload',
      ({ payload, expectedResult }) => {
        const result = portfoliosService.getRelations(
          payload as IGetPortfolioRelationsOptions,
        );
        expect(result).toEqual(expectedResult);
      },
    );
  });
});
