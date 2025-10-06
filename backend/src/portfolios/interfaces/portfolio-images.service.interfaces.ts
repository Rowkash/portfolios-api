export interface IPortfolioImageDataCreation {
  name: string;
  description: string;
  userId: number;
  portfolioId: number;
  file: Express.Multer.File;
}

export interface IPortfolioImageDataUpdate {
  id: number;
  userId: number;
  portfolioId: number;
  name?: string;
  description?: string;
  file?: Express.Multer.File;
}

export interface IGetPortfolioImageFilterOptions {
  id?: number;
  portfolioId?: number;
}

export interface IGetPortfolioImageIncludesOptions {
  portfolio?: boolean;
}

export interface IGetOnePortfolioImageOptions {
  id?: number;
  name?: string;
  portfolioId?: number;
  userId?: number;
  include?: IGetPortfolioImageIncludesOptions;
}

export interface IPortfolioImageDataRemoving {
  imageId: number;
  userId: number;
  portfolioId: number;
}
