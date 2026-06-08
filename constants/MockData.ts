export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  vendor: string;
  vendorLocation: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  imageEmoji: string;
  imageUrl?: string;
  badge?: string;
};

export type Worker = {
  id: string;
  name: string;
  trade: string;
  rating: number;
  reviewCount: number;
  location: string;
  dailyRate: number;
  experience: number;
  available: boolean;
  avatar: string;
  skills: string[];
  completedJobs: number;
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  rating: number;
  location: string;
  verified: boolean;
  emoji: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Cement', icon: 'layers', color: '#0d631b', count: 124 },
  { id: '2', name: 'Steel & Iron', icon: 'build', color: '#707a6c', count: 87 },
  { id: '3', name: 'Roofing', icon: 'home', color: '#a83900', count: 96 },
  { id: '4', name: 'Electrical', icon: 'flash-on', color: '#6d5100', count: 143 },
  { id: '5', name: 'Plumbing', icon: 'water', color: '#0d631b', count: 78 },
  { id: '6', name: 'Tiles', icon: 'grid-on', color: '#707a6c', count: 203 },
  { id: '7', name: 'Timber', icon: 'forest', color: '#6d5100', count: 65 },
  { id: '8', name: 'Equipment', icon: 'precision-manufacturing', color: '#0d631b', count: 55 },
  { id: '9', name: 'Glass', icon: 'window', color: '#707a6c', count: 42 },
  { id: '10', name: 'Paint', icon: 'color-lens', color: '#a83900', count: 189 },
  { id: '11', name: 'Blocks', icon: 'view-module', color: '#6d5100', count: 71 },
  { id: '12', name: 'More', icon: 'more-horiz', color: '#0d631b', count: 500 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Dangote Cement 42.5R (50kg)',
    price: 8500,
    unit: 'bag',
    vendor: 'Lagos Building Supplies',
    vendorLocation: 'Ikeja, Lagos',
    category: 'Cement',
    rating: 4.8,
    reviewCount: 312,
    inStock: true,
    imageEmoji: '🏗️',
    imageUrl: 'https://picsum.photos/seed/cement/400/400',
    badge: 'Best Seller',
  },
  {
    id: 'p2',
    name: 'Elephant Cement (50kg)',
    price: 8200,
    unit: 'bag',
    vendor: 'Abuja Materials Hub',
    vendorLocation: 'Garki, Abuja',
    category: 'Cement',
    rating: 4.6,
    reviewCount: 198,
    inStock: true,
    imageEmoji: '🏗️',
  },
  {
    id: 'p3',
    name: 'Aluminum Roofing Sheet (0.5mm)',
    price: 4200,
    unit: 'sheet',
    vendor: 'RoofPro Nigeria',
    vendorLocation: 'Surulere, Lagos',
    category: 'Roofing',
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    imageEmoji: '🏠',
    imageUrl: 'https://picsum.photos/seed/roofing/400/400',
    badge: 'Top Rated',
  },
  {
    id: 'p4',
    name: 'Iron Rod 12mm (6m)',
    price: 6800,
    unit: 'piece',
    vendor: 'Steel Masters Ltd',
    vendorLocation: 'Port Harcourt',
    category: 'Steel & Iron',
    rating: 4.5,
    reviewCount: 89,
    inStock: true,
    imageEmoji: '⚙️',
  },
  {
    id: 'p5',
    name: 'Ceramic Floor Tiles 60x60cm',
    price: 3500,
    unit: 'm²',
    vendor: 'TileWorld Nigeria',
    vendorLocation: 'Victoria Island, Lagos',
    category: 'Tiles',
    rating: 4.9,
    reviewCount: 241,
    inStock: true,
    imageEmoji: '🏛️',
    imageUrl: 'https://picsum.photos/seed/tiles/400/400',
    badge: 'New',
  },
  {
    id: 'p6',
    name: 'PVC Water Pipe 3/4 inch (9m)',
    price: 2800,
    unit: 'piece',
    vendor: 'PlumbShop PH',
    vendorLocation: 'Port Harcourt',
    category: 'Plumbing',
    rating: 4.3,
    reviewCount: 67,
    inStock: false,
    imageEmoji: '🔧',
  },
  {
    id: 'p7',
    name: 'Sandcrete Block (9 inches)',
    price: 400,
    unit: 'piece',
    vendor: 'Kano Block Factory',
    vendorLocation: 'Kano City',
    category: 'Blocks',
    rating: 4.4,
    reviewCount: 423,
    inStock: true,
    imageEmoji: '🧱',
    badge: 'Bulk Available',
  },
  {
    id: 'p8',
    name: 'Emulsion Paint 20L (White)',
    price: 12500,
    unit: 'bucket',
    vendor: 'ColourShop Abuja',
    vendorLocation: 'Wuse, Abuja',
    category: 'Paint',
    rating: 4.6,
    reviewCount: 112,
    inStock: true,
    imageEmoji: '🎨',
    imageUrl: 'https://picsum.photos/seed/paint/400/400',
  },
];

export const WORKERS: Worker[] = [
  {
    id: 'w1',
    name: 'Emeka Okafor',
    trade: 'Master Mason',
    rating: 4.9,
    reviewCount: 87,
    location: 'Lagos Island, Lagos',
    dailyRate: 15000,
    experience: 12,
    available: true,
    avatar: '👷',
    skills: ['Block Laying', 'Plastering', 'Tiling', 'Rendering'],
    completedJobs: 143,
  },
  {
    id: 'w2',
    name: 'Bello Adamu',
    trade: 'Electrician',
    rating: 4.8,
    reviewCount: 64,
    location: 'Surulere, Lagos',
    dailyRate: 18000,
    experience: 8,
    available: true,
    avatar: '⚡',
    skills: ['Wiring', 'Panel Boards', 'Solar Install', 'CCTV'],
    completedJobs: 98,
  },
  {
    id: 'w3',
    name: 'Chukwudi Eze',
    trade: 'Plumber',
    rating: 4.7,
    reviewCount: 52,
    location: 'Ikeja, Lagos',
    dailyRate: 12000,
    experience: 6,
    available: false,
    avatar: '🔧',
    skills: ['Pipe Fitting', 'Bathroom Install', 'Drainage', 'Borehole'],
    completedJobs: 76,
  },
  {
    id: 'w4',
    name: 'Aminu Garba',
    trade: 'Carpenter',
    rating: 4.9,
    reviewCount: 103,
    location: 'Abuja',
    dailyRate: 14000,
    experience: 15,
    available: true,
    avatar: '🪚',
    skills: ['Roofing', 'Formwork', 'Doors & Windows', 'Furniture'],
    completedJobs: 211,
  },
  {
    id: 'w5',
    name: 'Ngozi Obi',
    trade: 'Interior Designer',
    rating: 5.0,
    reviewCount: 38,
    location: 'Victoria Island, Lagos',
    dailyRate: 35000,
    experience: 9,
    available: true,
    avatar: '🎨',
    skills: ['Space Planning', 'Decor', 'Lighting', '3D Rendering'],
    completedJobs: 54,
  },
  {
    id: 'w6',
    name: 'Sule Musa',
    trade: 'Steel Fabricator',
    rating: 4.6,
    reviewCount: 41,
    location: 'Port Harcourt',
    dailyRate: 20000,
    experience: 11,
    available: true,
    avatar: '⚙️',
    skills: ['Welding', 'Gate Fabrication', 'Roofing Trusses', 'Railings'],
    completedJobs: 89,
  },
];

export const VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'Lagos Building Supplies',
    category: 'General Materials',
    rating: 4.8,
    location: 'Ikeja, Lagos',
    verified: true,
    emoji: '🏪',
    description: 'Your one-stop shop for all building materials',
  },
  {
    id: 'v2',
    name: 'RoofPro Nigeria',
    category: 'Roofing',
    rating: 4.7,
    location: 'Surulere, Lagos',
    verified: true,
    emoji: '🏠',
    description: 'Premium roofing solutions across Nigeria',
  },
  {
    id: 'v3',
    name: 'Steel Masters Ltd',
    category: 'Steel & Iron',
    rating: 4.6,
    location: 'Port Harcourt',
    verified: true,
    emoji: '🏭',
    description: 'Iron rods, steel bars & structural materials',
  },
  {
    id: 'v4',
    name: 'TileWorld Nigeria',
    category: 'Tiles & Flooring',
    rating: 4.9,
    location: 'Victoria Island, Lagos',
    verified: true,
    emoji: '🏛️',
    description: 'Imported & local tiles at wholesale prices',
  },
];

export const TRADES = [
  'All',
  'Mason',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Welder',
  'Tiler',
  'Designer',
];
