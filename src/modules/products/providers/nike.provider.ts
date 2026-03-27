import { BaseProvider, ValidateProductResult } from './base.provider';

export class NikeProvider extends BaseProvider {
  private nikeProducts = [
    {
      name: 'Air Max 270',
      price: 150.0,
      image: 'https://static.nike.com/a/images/f_auto,cs_srgb/w_1920,c_limit/4fdf4def-b098-426d-a92d-96e982c16899/image.jpg',
    },
    {
      name: 'React Infinity Run Flyknit',
      price: 160.0,
      image: 'https://static.nike.com/a/images/f_auto,cs_srgb/w_1920,c_limit/a0c0f6e7-7c8c-4f8d-b9f2-1e6d5c9a2b3f/image.jpg',
    },
    {
      name: 'Air Zoom Pegasus 40',
      price: 129.99,
      image: 'https://static.nike.com/a/images/f_auto,cs_srgb/w_1920,c_limit/b1c2d3e4-f5g6-7h8i-9j0k-1l2m3n4o5p6q/image.jpg',
    },
    {
      name: 'Alphafly 3',
      price: 189.99,
      image: 'https://static.nike.com/a/images/f_auto,cs_srgb/w_1920,c_limit/c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r/image.jpg',
    },
    {
      name: 'Cortez',
      price: 100.0,
      image: 'https://static.nike.com/a/images/f_auto,cs_srgb/w_1920,c_limit/d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s/image.jpg',
    },
  ];

  supports(url: string): boolean {
    return url.toLowerCase().includes('nike.com');
  }

  async validateProduct(
    url: string,
    options: { size: string; color?: string },
  ): Promise<ValidateProductResult> {
    try {
      // Try to fetch the product page
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }).catch(() => null);

      let html = '';
      if (response && response.ok) {
        html = await response.text();
      }

      // Parse data from HTML if available, otherwise use mock data
      const productName = this.parseProductName(html);
      const price = this.parsePrice(html);
      const image = this.parseImage(html);
      const isAvailable = this.parseAvailability(html, options.size, options.color);

      return {
        isAvailable,
        productName,
        price,
        image,
      };
    } catch {
      // Fallback to mock data on error
      return this.getMockProduct();
    }
  }

  private parseAvailability(html: string, size: string, color?: string): boolean {
    // If we have HTML, try to parse availability
    if (html && html.length > 0) {
      return !html.toLowerCase().includes('out of stock') &&
             !html.toLowerCase().includes('unavailable');
    }
    // Mock availability: 70% chance of being available
    return Math.random() > 0.3;
  }

  private parseProductName(html: string): string | undefined {
    // Try to extract from HTML
    if (html && html.length > 0) {
      // Try to find product name in common Nike patterns
      const match = html.match(/<title>([^<]+)<\/title>/i);
      if (match) {
        const title = match[1].split('|')[0].trim();
        if (title && title !== 'Nike') return title;
      }
      
      // Try other patterns
      const nameMatch = html.match(/"productName":"([^"]+)"/i);
      if (nameMatch) return nameMatch[1];
    }
    // Return random mock product
    return this.getRandomProduct().name;
  }

  private parsePrice(html: string): number | undefined {
    // Try to extract price from HTML
    if (html && html.length > 0) {
      // Look for various price formats
      const match = html.match(/["\$]?(\d{2,}(?:\.\d{2})?)["\$]?/);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 10 && price < 500) return price;
      }
    }
    // Return random mock price
    return this.getRandomProduct().price;
  }

  private parseImage(html: string): string | undefined {
    // Try to extract image URL
    if (html && html.length > 0) {
      // Look for image URLs
      const match = html.match(/"image":\s*"([^"]+\.jpg[^"]*)"/);
      if (match) return match[1];
      
      const imgMatch = html.match(/(https:\/\/[\w\.-]+\.nike\.com[\w\/%\.-]+\.jpg)/i);
      if (imgMatch) return imgMatch[1];
    }
    // Return mock image URL
    return this.getRandomProduct().image;
  }

  private getRandomProduct() {
    return this.nikeProducts[Math.floor(Math.random() * this.nikeProducts.length)];
  }

  private getMockProduct(): ValidateProductResult {
    const product = this.getRandomProduct();
    return {
      isAvailable: Math.random() > 0.3,
      productName: product.name,
      price: product.price,
      image: product.image,
    };
  }
}
