import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import { ProductRequest } from './entities/product-request.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

import { User as UserDecorator } from '../../common/decorators/user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductRequestDto: CreateProductRequestDto,
    @UserDecorator() user: User,
  ): Promise<ProductRequest> {
    return this.productsService.create(createProductRequestDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<ProductRequest[]> {
    return this.productsService.findAll();
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async findByUser(@UserDecorator() user: User): Promise<ProductRequest[]> {
    return this.productsService.findByUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<ProductRequest> {
    return this.productsService.findOne(id);
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  async findMyRequests(@UserDecorator() user: User): Promise<ProductRequest[]> {
    return this.productsService.findMyRequests(user.id);
    }
}
