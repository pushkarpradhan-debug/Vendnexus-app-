export enum MachineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  LOW_STOCK = 'LOW_STOCK'
}

export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card',
  UPI = 'UPI',
  WALLET = 'Wallet',
  CASH = 'Cash',
  QR_CODE = 'QR Code'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  min_quantity: number;
  image: string;
  machineId: string;
}

export interface Machine {
  id: string;
  name: string;
  location: string;
  status: MachineStatus;
}

export interface SaleRecord {
  id: string;
  productId: string;
  productName: string; // Denormalized for easier display
  machineId: string;
  quantity: number;
  revenue: number;
  profit: number;
  timestamp: number;
  paymentMethod: PaymentMethod;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}