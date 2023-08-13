import { Types } from 'mongoose';
import { ICategory } from '../models/Category';

export interface CategoryResponse extends ICategory {
  docsResponse?: unknown;
}

export interface CategoryRequest {
  catalogName?: string;
  catalogType?: string;
  parent?: string;
  tree?: string;
}
