export interface ValidateProductResult {
  isAvailable: boolean;
  productName?: string;
  price?: number;
  image?: string;
}

export abstract class BaseProvider {
  abstract supports(url: string): boolean;
  
  abstract validateProduct(
    url: string,
    options: { size: string; color?: string },
  ): Promise<ValidateProductResult>;
}
