export type CategoryId = 'starters' | 'mains' | 'breads' | 'beverages' | 'desserts';

export interface PortionOption {
  name: string;
  priceDeltaPaise: number;
}

export interface AddOnOption {
  id: string;
  name: string;
  pricePaise: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  pricePaise: number; // Stored in paise (e.g., 22000 = ₹220)
  isVeg: boolean;
  isAvailable: boolean;
  spicyLevel?: 0 | 1 | 2 | 3;
  image: string;
  portionOptions?: PortionOption[];
  addOns?: AddOnOption[];
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  selectedPortion?: string;
  selectedAddOns: string[];
  itemPricePaise: number;
  totalPricePaise: number;
  notes?: string;
}

export type OrderStatus =
  | 'WAITING_FOR_WAITER' // Customer sent request; awaiting physical verification
  | 'CONFIRMED'          // Waiter verified physically; entered kitchen queue
  | 'PREPARING'          // Kitchen chef started preparation
  | 'READY'              // Food prepared and plated at the kitchen pass
  | 'SERVED'             // Delivered to the table
  | 'REJECTED';          // Waiter rejected with stated reason

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

export interface WaiterActionRecord {
  staffId: string;
  staffName: string;
  confirmedAt: string;
  rejectionReason?: string;
}

export interface KitchenActionRecord {
  startedAt?: string;
  readyAt?: string;
}

export interface CashierActionRecord {
  cashierId: string;
  cashierName: string;
  paidAt: string;
  tenderMethod: PaymentMethod;
}

export interface RestaurantOrder {
  id: string;             // e.g., "R1042"
  tableNumber: string;    // e.g., "08"
  customerPhone: string;
  customerName?: string;
  items: OrderItem[];
  subtotalPaise: number;
  taxPaise: number;       // 5% GST
  totalPaise: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  waiterAction?: WaiterActionRecord;
  kitchenAction?: KitchenActionRecord;
  cashierAction?: CashierActionRecord;
  stampAwarded: boolean;
  review?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
}

export interface LoyaltyEvent {
  orderId: string;
  date: string;
  stampsDelta: number;
  note: string;
}

export interface CustomerLoyalty {
  phone: string;
  stampsCount: number;
  threshold: number;
  rewardTitle: string;
  history: LoyaltyEvent[];
}

export interface CustomerSession {
  phone: string;
  name?: string;
  rememberDevice: boolean;
  tableNumber: string;
  sessionStartedAt: string;
}

export type StaffRole = 'waiter' | 'kitchen' | 'cashier' | 'manager';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin?: string;
  token?: string;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved';
}

export type ServiceRequestType = 'waiter' | 'water' | 'bill' | 'cutlery';

export interface ServiceRequest {
  id: string;
  tableNumber: string;
  type: ServiceRequestType;
  requestedAt: string;
  status: 'pending' | 'resolved';
}
