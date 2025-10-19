/**
 * Strapi CMS Service
 * Handles all CMS data fetching for products, builds, blog posts, etc.
 */

import strapiClient, { formatStrapiResponse, getStrapiImageUrl, strapiEndpoints } from '../config/strapi';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  featured?: boolean;
  specs?: Record<string, any>;
  images?: any[];
}

export interface PCBuild {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  featured?: boolean;
  components: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    motherboard?: string;
    psu?: string;
    case?: string;
    cooling?: string;
  };
  images?: any[];
}

export interface Component {
  id: number;
  name: string;
  type: string;
  manufacturer: string;
  price: number;
  stock: number;
  specs?: Record<string, any>;
}

/**
 * Fetch all products
 */
export const fetchProducts = async (params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> => {
  try {
    let url = strapiEndpoints.products;
    
    // Build query parameters
    const queryParams: string[] = [];
    if (params?.category) {
      queryParams.push(`filters[category][$eq]=${params.category}`);
    }
    if (params?.featured) {
      queryParams.push(`filters[featured][$eq]=true`);
    }
    if (params?.limit) {
      queryParams.push(`pagination[limit]=${params.limit}`);
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    const response = await strapiClient.get(url + '&populate=*');
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error('Fetch products error:', error);
    // Return mock data for development
    return getMockProducts();
  }
};

/**
 * Fetch single product by ID
 */
export const fetchProduct = async (id: number): Promise<Product | null> => {
  try {
    const response = await strapiClient.get(`${strapiEndpoints.products}/${id}?populate=*`);
    return formatStrapiResponse(response.data);
  } catch (error: any) {
    console.error('Fetch product error:', error);
    return null;
  }
};

/**
 * Fetch all PC builds
 */
export const fetchPCBuilds = async (params?: {
  category?: string;
  featured?: boolean;
}): Promise<PCBuild[]> => {
  try {
    let url = strapiEndpoints.pcBuilds;
    
    const queryParams: string[] = [];
    if (params?.category) {
      queryParams.push(`filters[category][$eq]=${params.category}`);
    }
    if (params?.featured) {
      queryParams.push(`filters[featured][$eq]=true`);
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    const response = await strapiClient.get(url + '&populate=*');
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error('Fetch PC builds error:', error);
    // Return mock data for development
    return getMockPCBuilds();
  }
};

/**
 * Fetch components by type
 */
export const fetchComponents = async (type?: string): Promise<Component[]> => {
  try {
    let url = strapiEndpoints.components;
    
    if (type) {
      url += `?filters[type][$eq]=${type}&populate=*`;
    } else {
      url += '?populate=*';
    }
    
    const response = await strapiClient.get(url);
    return formatStrapiResponse(response.data) || [];
  } catch (error: any) {
    console.error('Fetch components error:', error);
    return getMockComponents(type);
  }
};

/**
 * Search products and builds
 */
export const searchContent = async (query: string): Promise<{
  products: Product[];
  builds: PCBuild[];
}> => {
  try {
    const [productsRes, buildsRes] = await Promise.all([
      strapiClient.get(`${strapiEndpoints.products}?filters[name][$contains]=${query}&populate=*`),
      strapiClient.get(`${strapiEndpoints.pcBuilds}?filters[name][$contains]=${query}&populate=*`),
    ]);
    
    return {
      products: formatStrapiResponse(productsRes.data) || [],
      builds: formatStrapiResponse(buildsRes.data) || [],
    };
  } catch (error: any) {
    console.error('Search content error:', error);
    return { products: [], builds: [] };
  }
};

/**
 * Mock data for development (when Strapi is not connected)
 */

function getMockProducts(): Product[] {
  return [
    {
      id: 1,
      name: 'AMD Ryzen 9 7950X',
      description: 'High-performance 16-core processor',
      price: 549,
      category: 'CPU',
      stock: 15,
      featured: true,
      specs: { cores: 16, threads: 32, baseClock: '4.5 GHz' },
    },
    {
      id: 2,
      name: 'NVIDIA RTX 4090',
      description: 'Ultimate gaming graphics card',
      price: 1599,
      category: 'GPU',
      stock: 5,
      featured: true,
      specs: { vram: '24GB GDDR6X', boost: '2.52 GHz' },
    },
    {
      id: 3,
      name: 'G.Skill Trident Z5 RGB 32GB',
      description: 'DDR5-6000 RGB memory kit',
      price: 189,
      category: 'RAM',
      stock: 25,
      specs: { capacity: '32GB', speed: 'DDR5-6000' },
    },
  ];
}

function getMockPCBuilds(): PCBuild[] {
  return [
    {
      id: 1,
      name: 'Vortex Gaming Beast',
      description: 'Ultimate 4K gaming powerhouse',
      price: 3499,
      category: 'Gaming',
      featured: true,
      components: {
        cpu: 'AMD Ryzen 9 7950X3D',
        gpu: 'NVIDIA RTX 4090',
        ram: '64GB DDR5-6000',
        storage: '2TB NVMe Gen5',
        motherboard: 'ASUS ROG Crosshair X670E',
        psu: 'Corsair HX1000i',
        case: 'Lian Li O11 Dynamic',
        cooling: '360mm AIO RGB',
      },
    },
    {
      id: 2,
      name: 'Vortex Creator Pro',
      description: 'Professional content creation workstation',
      price: 2899,
      category: 'Workstation',
      featured: true,
      components: {
        cpu: 'AMD Ryzen 9 7950X',
        gpu: 'NVIDIA RTX 4080',
        ram: '64GB DDR5-5600',
        storage: '2TB NVMe + 4TB HDD',
        motherboard: 'ASUS ProArt X670E',
        psu: 'Corsair RM850x',
        case: 'Fractal Design Define 7',
        cooling: '280mm AIO',
      },
    },
  ];
}

function getMockComponents(type?: string): Component[] {
  const allComponents: Component[] = [
    { id: 1, name: 'AMD Ryzen 9 7950X', type: 'CPU', manufacturer: 'AMD', price: 549, stock: 15 },
    { id: 2, name: 'Intel Core i9-14900K', type: 'CPU', manufacturer: 'Intel', price: 589, stock: 12 },
    { id: 3, name: 'NVIDIA RTX 4090', type: 'GPU', manufacturer: 'NVIDIA', price: 1599, stock: 5 },
    { id: 4, name: 'NVIDIA RTX 4080', type: 'GPU', manufacturer: 'NVIDIA', price: 1199, stock: 8 },
    { id: 5, name: 'G.Skill Trident Z5 32GB', type: 'RAM', manufacturer: 'G.Skill', price: 189, stock: 25 },
    { id: 6, name: 'Samsung 990 Pro 2TB', type: 'Storage', manufacturer: 'Samsung', price: 199, stock: 30 },
  ];
  
  if (type) {
    return allComponents.filter(c => c.type === type);
  }
  
  return allComponents;
}

export { getStrapiImageUrl };
