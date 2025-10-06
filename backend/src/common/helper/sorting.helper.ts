import { Order } from 'sequelize';

import { PageDto } from '@/common/dto/page.dto';

export class SortingDbHelper {
  readonly sortBy: string;
  readonly orderSort: string;

  constructor(partial: Partial<PageDto>) {
    Object.assign(this, partial);
  }

  get orderBy(): Order {
    const allowedFields = ['created_at', 'userId'];
    const sortField = allowedFields.includes(this.sortBy)
      ? this.sortBy
      : 'created_at';
    return [[sortField, this.orderSort]];
  }
}
