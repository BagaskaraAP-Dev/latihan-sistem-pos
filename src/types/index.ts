export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TransactionItem {
  id?: number;
  transaction_id?: number;
  product_id: number;
  product_name: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  invoice_no: string;
  total_amount: number;
  payment_method: 'CASH' | 'QRIS';
  cash_received: number;
  change_amount: number;
  created_at: string;
  items?: TransactionItem[];
}

export interface ReportSummary {
  totalRevenue: number;
  totalTransactions: number;
  estimatedProfit: number;
}
