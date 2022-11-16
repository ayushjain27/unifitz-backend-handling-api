import { Response } from 'express';
import { body, validationResult } from 'express-validator';
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

  validate = (method: string) => {
    switch (method) {
      case 'createProduct':
        return [
          body('storeId', 'Store Id does not exist').exists().isString(),

          body('offerType', 'Type ABCD does not exist')
            .exists()
            .isIn(['product', 'service']),

          body('itemName', 'Item Name does not exist').exists().isString(),
          body('unit', 'Units does not exist').exists().isString()
        ];
    }
  };
}
