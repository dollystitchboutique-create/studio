
import { Product, Sale } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'NK-GLD-001',
    name: 'Gilded Sun Necklace',
    category: 'Necklace',
    spec: '18k Gold Plated',
    color: 'Gold',
    price: 89.00,
    description: 'A radiant sun pendant on a delicate chain.',
    imageUrl: 'https://picsum.photos/seed/necklace1/600/400',
    isDeleted: false,
  },
  {
    id: '2',
    sku: 'ER-PRL-002',
    name: 'Ocean Pearl Drops',
    category: 'Earrings',
    spec: 'Freshwater Pearl',
    color: 'White',
    price: 45.00,
    description: 'Elegant drop earrings featuring natural pearls.',
    imageUrl: 'https://picsum.photos/seed/earrings1/600/400',
    isDeleted: false,
  },
  {
    id: '3',
    sku: 'BR-RGD-003',
    name: 'Eternal Rose Bracelet',
    category: 'Bracelet',
    spec: 'Rose Gold Finish',
    color: 'Rose Gold',
    price: 65.00,
    description: 'A minimalist bangle with a rose gold hue.',
    imageUrl: 'https://picsum.photos/seed/bracelet1/600/400',
    isDeleted: false,
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'S001',
    customerName: 'Alice Tan',
    paymentMethod: 'PayNow',
    discount: 5,
    total: 84.00,
    timestamp: '2024-05-15T10:30:00Z',
    isDeleted: false,
    items: [
      { sku: 'NK-GLD-001', name: 'Gilded Sun Necklace', price: 89.00, quantity: 1 }
    ]
  },
  {
    id: 'S002',
    customerName: 'Ben Lim',
    paymentMethod: 'Cash',
    discount: 0,
    total: 45.00,
    timestamp: '2024-05-15T14:20:00Z',
    isDeleted: false,
    items: [
      { sku: 'ER-PRL-002', name: 'Ocean Pearl Drops', price: 45.00, quantity: 1 }
    ]
  }
];
