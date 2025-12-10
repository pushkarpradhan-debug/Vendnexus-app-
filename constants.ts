import { Machine, MachineStatus, Product, SaleRecord, PaymentMethod } from './types';

export const MACHINES: Machine[] = [
  { id: 'm1', name: 'Nexus Prime', location: 'Downtown Metro Station', status: MachineStatus.ONLINE },
  { id: 'm2', name: 'Corp Tower A', location: 'Tech Park Lobby', status: MachineStatus.LOW_STOCK },
  { id: 'm3', name: 'Uni Campus West', location: 'Student Union Building', status: MachineStatus.MAINTENANCE },
];

const NOW = Date.now();
const DAY = 86400000;

export const INITIAL_PRODUCTS: Product[] = [
  // Machine 1
  { id: 'p1', machineId: 'm1', name: 'Sparkle Water', category: 'Beverage', price: 2.50, cost: 0.80, quantity: 45, min_quantity: 10, image: 'https://picsum.photos/id/400/200/200', expiryDate: NOW + 30 * DAY },
  { id: 'p2', machineId: 'm1', name: 'Energy Blast', category: 'Beverage', price: 3.50, cost: 1.20, quantity: 8, min_quantity: 15, image: 'https://picsum.photos/id/401/200/200', expiryDate: NOW + 60 * DAY },
  { id: 'p3', machineId: 'm1', name: 'Protein Bar', category: 'Snack', price: 4.00, cost: 2.00, quantity: 20, min_quantity: 10, image: 'https://picsum.photos/id/402/200/200', expiryDate: NOW + 120 * DAY },
  { id: 'p4', machineId: 'm1', name: 'Cheese Crisps', category: 'Snack', price: 1.75, cost: 0.50, quantity: 30, min_quantity: 10, image: 'https://picsum.photos/id/403/200/200', expiryDate: NOW - 2 * DAY }, // Expired
  
  // Machine 2
  { id: 'p5', machineId: 'm2', name: 'Sparkle Water', category: 'Beverage', price: 2.75, cost: 0.80, quantity: 5, min_quantity: 10, image: 'https://picsum.photos/id/400/200/200', expiryDate: NOW + 25 * DAY }, // Higher price at Tech Park
  { id: 'p6', machineId: 'm2', name: 'Cold Brew Coffee', category: 'Beverage', price: 5.00, cost: 2.50, quantity: 12, min_quantity: 8, image: 'https://picsum.photos/id/404/200/200', expiryDate: NOW + 4 * DAY }, // Near Expiry
  { id: 'p7', machineId: 'm2', name: 'Vegan Cookie', category: 'Snack', price: 3.50, cost: 1.50, quantity: 15, min_quantity: 5, image: 'https://picsum.photos/id/405/200/200', expiryDate: NOW + 15 * DAY },

  // Machine 3
  { id: 'p8', machineId: 'm3', name: 'Cola Classic', category: 'Beverage', price: 1.50, cost: 0.60, quantity: 0, min_quantity: 20, image: 'https://picsum.photos/id/406/200/200', expiryDate: NOW + 90 * DAY },
];

const generateMockSales = (): SaleRecord[] => {
  const sales: SaleRecord[] = [];
  
  // Generate 50 mock sales over the last 7 days
  for (let i = 0; i < 50; i++) {
    const randomProduct = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
    const timeOffset = Math.floor(Math.random() * 7 * DAY);
    const qty = Math.floor(Math.random() * 3) + 1;
    
    sales.push({
      id: `s-${i}`,
      productId: randomProduct.id,
      productName: randomProduct.name,
      machineId: randomProduct.machineId,
      quantity: qty,
      revenue: randomProduct.price * qty,
      profit: (randomProduct.price - randomProduct.cost) * qty,
      timestamp: NOW - timeOffset,
      paymentMethod: Object.values(PaymentMethod)[Math.floor(Math.random() * 5)]
    });
  }
  return sales.sort((a, b) => b.timestamp - a.timestamp);
};

export const INITIAL_SALES = generateMockSales();