
export type DiscountType = 'amount' | 'percent';

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  spec: string;
  color: string;
  price: number;
  quantity: number;
  description: string;
  imageUrl: string;
  isDeleted: boolean;
};

export type SaleItem = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  discountType?: DiscountType;
};

export type Sale = {
  id?: string;
  customerName: string;
  paymentMethod: 'Cash' | 'Paylah' | 'PayNow';
  discount: number;
  discountType?: DiscountType;
  total: number;
  items: SaleItem[];
  timestamp: string;
  isDeleted: boolean;
};
