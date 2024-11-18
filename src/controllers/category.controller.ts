import { Response } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { CategoryService } from '../services';
import Logger from '../config/winston';
import Request from '../types/request';
// import { TYPES } from '../config/inversify.types';
import { CategoryResponse } from '../interfaces/category.interface';
import { TYPES } from '../config/inversify.types';

@injectable()
export class CategoryController {
  private categoryService: CategoryService;
  constructor(@inject(TYPES.CategoryService) categoryService: CategoryService) {
    this.categoryService = categoryService;
  }
  getAllCategories = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get All categories request controller initiated>'
    );
    try {
      const result: CategoryResponse[] = await this.categoryService.getAll();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getAllPaginatedCategories = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get All categories request controller initiated>'
    );
    const pageNo = Number(req.query.pageNo);
    const pageSize = Number(req.query.pageSize || 10);
    const searchQuery = req.query.searchQuery;
    try {
      const result: CategoryResponse[] =
        await this.categoryService.getAllPaginatedCategories(
          pageNo,
          pageSize,
          searchQuery as string
        );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getCategoriesCount = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get All categories request controller initiated>'
    );
    const searchQuery = req.query.searchQuery;
    try {
      const result = await this.categoryService.getCategoriesCount(
        searchQuery as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
  getAllRootCategories = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get All root categories request controller initiated>'
    );
    try {
      const result: CategoryResponse[] =
        await this.categoryService.getAllRootCategories();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getCategoryByCategoryId = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get category request controller initiated>'
    );
    try {
      const categoryId = req.params.categoryId;
      const result = await this.categoryService.getCategoryByCategoryId(
        categoryId as string
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId;
      Logger.info(
        '<Controller>:<CategoryController>:<Delete category request controller initiated>'
      );
      if (!categoryId) {
        throw new Error(` ${categoryId} categoryId required`);
      } else {
        await this.categoryService.deleteCategory(categoryId);
      }
      res.send({
        status: 'in-active',
        deleted: true
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  createCategories = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<CategoryController>:<Delete category request controller initiated>'
      );
      const result = await this.categoryService.createCategories(req.body);
      res.send({
        res: result,
        created: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateCategories = async (req: Request, res: Response) => {
    try {
      Logger.info(
        '<Controller>:<CategoryController>:<edit category request controller initiated>'
      );
      const result = await this.categoryService.updateCategories(req.body);
      res.send({
        res: result,
        updated: 'successful'
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getBrands = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<CategoryController>:<Get All brands request controller initiated>'
    );
    try {
      const result: CategoryResponse[] = await this.categoryService.getBrands();
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadCategoryImages = async (req: Request, res: Response) => {
    const { categoryId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.categoryService.uploadCategoryImages(
        categoryId,
        req
      );
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };
}
