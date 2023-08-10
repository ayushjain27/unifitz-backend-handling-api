import { Types } from 'mongoose';
import { ICategory } from '../models/Category';

export interface CategoryResponse extends ICategory {
  docsResponse?: unknown;
}
