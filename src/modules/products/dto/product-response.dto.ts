class ProductResponseDto {
  id: string;
  url: string;
  brand: string;
  size: string;
  color?: string;
  isAvailable: boolean;
  productName?: string;
  price?: number;
  image?: string;
  createdAt: Date;
}