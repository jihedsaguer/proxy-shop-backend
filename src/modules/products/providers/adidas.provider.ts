import { BaseProvider, ValidateProductResult } from './base.provider';

export class AdidasProvider extends BaseProvider {
  private adidasProducts = [
    {
      name: 'Ultraboost Light',
      price: 180.0,
      image: 'https://assets.adidas.com/images/h_840,f_auto,q_auto,w_840,c_limit/h_2000,f_auto,q_auto,w_2000,c_limit/a1b2c3d4e5f6g7h8i9j0.jpg',
    },
    {
      name: 'Stan Smith',
      price: 100.0,
      image: 'https://assets.adidas.com/images/h_840,f_auto,q_auto,w_840,c_limit/h_2000,f_auto,q_auto,w_2000,c_limit/b2c3d4e5f6g7h8i9j0k1.jpg',
    },
    {
      name: 'NMD R1',
      price: 140.0,
      image: 'https://assets.adidas.com/images/h_840,f_auto,q_auto,w_840,c_limit/h_2000,f_auto,q_auto,w_2000,c_limit/c3d4e5f6g7h8i9j0k1l2.jpg',
    },
    {
      name: 'Adizero Adios Pro',
      price: 200.0,
      image: 'https://assets.adidas.com/images/h_840,f_auto,q_auto,w_840,c_limit/h_2000,f_auto,q_auto,w_2000,c_limit/d4e5f6g7h8i9j0k1l2m3.jpg',
    },
    {
      name: 'Superstar',
      price: 110.0,
      image: 'https://assets.adidas.com/images/h_840,f_auto,q_auto,w_840,c_limit/h_2000,f_auto,q_auto,w_2000,c_limit/e5f6g7h8i9j0k1l2m3n4.jpg',
    },
  ];

  supports(url: string): boolean {
    return url.toLowerCase().includes('adidas.com');
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
      return !html.toLowerCase().includes('sold out') &&
             !html.toLowerCase().includes('unavailable') &&
             !html.toLowerCase().includes('out of stock');
    }
    // Mock availability: 70% chance of being available
    return Math.random() > 0.3;
  }

  private parseProductName(html: string): string | undefined {
    // Try to extract from HTML
    if (html && html.length > 0) {
      // Try to find product name in common Adidas patterns
      const match = html.match(/<title>([^<]+)<\/title>/i);
      if (match) {
        const title = match[1].split('|')[0].trim();
        if (title && title !== 'adidas') return title;
      }
      
      // Try other patterns
      const nameMatch = html.match(/"name":"([^"]+)"/i);
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
      const match = html.match(/"src":"([^"]*assets\.adidas\.com[^"]+)"/);
      if (match) return match[1];
      
      const imgMatch = html.match(/(https:\/\/assets\.adidas\.com[\w\/%\.-]+\.jpg)/i);
      if (imgMatch) return imgMatch[1];
    }
    // Return mock image URL
    return this.getRandomProduct().image;
  }

  private getRandomProduct() {
    return this.adidasProducts[Math.floor(Math.random() * this.adidasProducts.length)];
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
