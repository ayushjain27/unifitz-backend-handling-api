import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Request from '../types/request';
import { ProductService } from './../services/product.service';

@injectable()
export class ProductController {
  private productService: ProductService;
  constructor(@inject(TYPES.ProductService) productService: ProductService) {
    this.productService = productService;
  }

  createProduct = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const prodRequest = req.body;
    Logger.info(
      '<Controller>:<ProductController>:<Create product controller initiated>'
    );
    try {
      const result = await this.productService.create(prodRequest);
      res.send({
        message: 'Product Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  uploadProductImages = async (req: Request, res: Response) => {
    const { productId } = req.body;
    Logger.info(
      '<Controller>:<VehicleInfoController>:<Upload Vehicle request initiated>'
    );
    try {
      const result = await this.productService.updateProductImages(
        productId,
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

  getAll = async (req: Request, res: Response) => {
    Logger.info(
      '<Controller>:<ProductController>:<Get All request controller initiated>'
    );
    try {
      const userName = req?.userId;
      const role = req?.role;
      // const role = req?.role;
      // if (role !== AdminRole.ADMIN) {
      //   throw new Error('User not allowed');
      // }
      const result = await this.productService.getAll(userName, role);
      res.send({
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getProductByProductId = async (req: Request, res: Response) => {
    const productId = req.params.productId;

    if (!productId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Product Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<ProductController>:<Get products by product id controller initiated>'
    );
    try {
      const result = await this.productService.getProductByProductId(productId);
      res.send({
        message: 'Product Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getAllProductsByStoreId = async (req: Request, res: Response) => {
    const storeId = req.params.storeId;

    if (!storeId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Store Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<ProductController>:<Get All products by store id controller initiated>'
    );

    try {
      const result = await this.productService.getAllProductsByStoreId(storeId);
      res.send({
        message: 'Products Fetch Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  updateProduct = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const productId = req.params.productId;
    if (!productId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Product Id is not present' } });
      return;
    }
    const prodRequest = req.body;
    Logger.info(
      '<Controller>:<ProductController>:<Update product controller initiated>'
    );

    try {
      const result = await this.productService.update(prodRequest, productId);
      res.send({
        message: 'Product Update Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  delete = async (req: Request, res: Response) => {
    const productId = req.params.productId;

    if (!productId) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: { message: 'Product Id is not present' } });
      return;
    }
    Logger.info(
      '<Controller>:<ProductController>:<Delete Product controller initiated>'
    );

    try {
      const result = await this.productService.deleteProduct(productId);
      res.send({
        message: 'Products Deleted Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  addProductReview = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }
    const prodReviewRequest = req.body;
    const custPhoneNumber = req.userId;

    Logger.info(
      '<Controller>:<ProductController>:<Product adding review and rating controller initiated>'
    );

    try {
      const result = await this.productService.addProductReview(
        prodReviewRequest,
        custPhoneNumber
      );
      res.send({
        message: 'Product Review Creation Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  getProductReviews = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      return;
    }

    Logger.info(
      '<Controller>:<ProductController>:<Product getting review and rating controller initiated>'
    );
    const productId: string = req.query.productId as string;
    const pageNo = Number(req.query.pageNo);
    const pageSize = Number(req.query.pageSize || 10);

    try {
      const result = await this.productService.getProductReviews(
        productId,
        pageNo,
        pageSize
      );
      res.send({
        message: 'Product Reviews Fetched Successful',
        result
      });
    } catch (err) {
      Logger.error(err.message);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  };

  validate = (method: string) => {
    switch (method) {
      case 'createProduct':
        return [
          body('storeId', 'Store Id does not exist').exists().isString(),

          body('offerType', 'Type ABCD does not exist')
            .exists()
            .isIn(['product', 'service']),

          body('itemName', 'Item Name does not exist').exists().isString(),
          body('mrp', 'MRP does not exist').exists().isNumeric()
        ];
      case 'reviewProduct':
        return [
          body('productId', 'Product Id does not exist').exists().isString(),
          body('rating', 'Rating does not exist').exists().isNumeric()
        ];

      case 'getReviews':
        return [
          query('productId')
            .isString()
            .exists()
            .withMessage('Product Id does not exist'),
          query('pageNo').isString(),
          query('pageSize').isString()
        ];
    }
  };
}
