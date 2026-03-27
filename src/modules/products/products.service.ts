import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRequest } from './entities/product-request.entity';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import { User } from '../users/entities/user.entity';
import { BaseProvider } from './providers/base.provider';
import { NikeProvider } from './providers/nike.provider';
import { AdidasProvider } from './providers/adidas.provider';

@Injectable()
export class ProductsService {
  private providers: BaseProvider[] = [];

  constructor(
    @InjectRepository(ProductRequest)
    private readonly productRequestRepository: Repository<ProductRequest>,
  ) {
    // Initialize all providers
    this.providers = [new NikeProvider(), new AdidasProvider()];
  }

  private getProvider(url: string): BaseProvider {
    const provider = this.providers.find((p) => p.supports(url));
    if (!provider) {
      throw new BadRequestException(
        'No provider available for the given URL. Supported: nike.com, adidas.com',
      );
    }
    return provider;
  }

  private detectBrand(url: string): string {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('nike')) return 'nike';
    if (urlLower.includes('adidas')) return 'adidas';
    return 'unknown';
  }

  async create(
    createProductRequestDto: CreateProductRequestDto,
    user: User,
  ): Promise<ProductRequest> {
    try {
      // Get the appropriate provider
      const provider = this.getProvider(createProductRequestDto.url);

      // Validate the product using the provider
      const validationResult = await provider.validateProduct(
        createProductRequestDto.url,
        {
          size: createProductRequestDto.size,
          color: createProductRequestDto.color,
        },
      );

      // Detect brand from URL
      const brand = this.detectBrand(createProductRequestDto.url);

      // Create the ProductRequest entity
      const productRequest = this.productRequestRepository.create({
        url: createProductRequestDto.url,
        size: createProductRequestDto.size,
        color: createProductRequestDto.color,
        brand,
        isAvailable: validationResult.isAvailable,
        productName: validationResult.productName,
        price: validationResult.price,
        image: validationResult.image,
        user,
      });

      // Save to database
      return await this.productRequestRepository.save(productRequest);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to process product request',
      );
    }
  }

  async findAll(): Promise<ProductRequest[]> {
    return this.productRequestRepository.find({
      relations: [],
    });
  }

  async findByUser(userId: string): Promise<ProductRequest[]> {
    return this.productRequestRepository.find({
      where: { user: { id: userId } },
      relations: [],
    });
  }

  async findOne(id: string): Promise<ProductRequest> {
    const productRequest = await this.productRequestRepository.findOne({
      where: { id },
      relations: [],
    });

    if (!productRequest) {
      throw new BadRequestException(`Product request with ID ${id} not found`);
    }

    return productRequest;
  }

findMyRequests(userId: string) {
  return this.productRequestRepository.find({
    where: { user: { id: userId } },
    order: { createdAt: 'DESC' },
  });
}
}
