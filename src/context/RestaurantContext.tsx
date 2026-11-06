import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MenuItem,
  RestaurantOrder,
  CustomerSession,
  CustomerLoyalty,
  StaffUser,
  StaffRole,
  OrderItem,
  PaymentMethod,
  ServiceRequest,
  ServiceRequestType,
} from '../types/restaurant';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  STAFF_USERS,
  RESTAURANT_INFO,
} from '../data/seedData';

// Web Audio synthesizer for tactile auditory alerts (no external audio assets required)
export const playNotificationSound = (type: 'alert' | 'success' | 'ready') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'alert') {
      // Crisp 2-tone chime for incoming waiter floor requests
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);
    } else if (type === 'ready') {
      // Pleasant kitchen pass chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Quick confirmation tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Ignore audio permission or autoplay errors silently
  }
};

interface RestaurantContextType {
  // Navigation & Session
  currentTable: string;
  setCurrentTable: (table: string) => void;
  customerSession: CustomerSession | null;
  loginCustomer: (phone: string, name?: string, rememberDevice?: boolean) => void;
  logoutCustomer: () => void;

  // Staff Authentication
  activeStaff: StaffUser | null;
  loginStaffWithPin: (pin: string, preferredRole?: StaffRole) => Promise<{ success: boolean; message: string }>;
  switchStaffRole: (role: StaffRole) => void;
  logoutStaff: () => void;
  isStaffPortalOpen: boolean;
  setIsStaffPortalOpen: (open: boolean) => void;

  // Authoritative Synced State
  menuItems: MenuItem[];
  orders: RestaurantOrder[];
  loyaltyAccounts: Record<string, CustomerLoyalty>;
  serviceRequests: ServiceRequest[];

  // Cart for Customer
  cartItems: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  cartSubtotalPaise: number;
  cartTaxPaise: number;
  cartTotalPaise: number;

  // Real-Time Workflow Actions
  submitOrderRequest: (specialNotes?: string) => Promise<RestaurantOrder | null>;
  confirmOrder: (orderId: string, staffId?: string) => Promise<void>;
  rejectOrder: (orderId: string, staffId: string, reason: string) => Promise<void>;
  startPreparingOrder: (orderId: string) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  markOrderServed: (orderId: string) => Promise<void>;
  recordPayment: (orderId: string, method: PaymentMethod, cashierId?: string) => Promise<void>;
  submitReview: (orderId: string, rating: number, comment: string) => Promise<void>;

  // Customer Service Calls
  requestService: (type: ServiceRequestType) => Promise<boolean>;
  resolveServiceRequest: (id: string) => Promise<void>;

  // Manager & Kitchen Inventory
  toggleMenuItemAvailability: (id: string, isAvailable: boolean) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<boolean>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;

  // Queries & Utilities
  getActiveOrderByTable: (table: string) => RestaurantOrder | undefined;
  getCustomerActiveOrder: () => RestaurantOrder | undefined;
  getLoyaltyForPhone: (phone: string) => CustomerLoyalty;
  resetDemoData: () => Promise<void>;
  isRealTimeConnected: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CUSTOMER: 'qr_dine_customer_session_v3',
  STAFF: 'qr_dine_active_staff_v3',
};

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial table from URL query (?table=08) or fallback to '08'
  const [currentTable, setCurrentTableState] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramTable = params.get('table');
      return paramTable ? paramTable.padStart(2, '0') : '08';
    } catch {
      return '08';
    }
  });

  const setCurrentTable = (table: string) => {
    const formatted = table.padStart(2, '0');
    setCurrentTableState(formatted);
    setCustomerSession(curr => (curr ? { ...curr, tableNumber: formatted } : null));
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('table', formatted);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Customer session - null by default for first-time visitors
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return null;
  });

  // Staff session
  const [activeStaff, setActiveStaff] = useState<StaffUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return null;
  });

  const [isStaffPortalOpen, setIsStaffPortalOpen] = useState(false);

  // Authoritative State
  const [orders, setOrders] = useState<RestaurantOrder[]>(INITIAL_ORDERS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<Record<string, CustomerLoyalty>>({});
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  // Cart for active diner
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  // 1. Initial State Bootstrap from Express Server + Real-time SSE Connection
  useEffect(() => {
    let isMounted = true;

    // Fetch initial snapshot from server with automatic retry for cloud cold-starts
    const fetchBootstrapState = () => {
      fetch('/api/bootstrap')
        .then(res => res.json())
        .then(data => {
          if (!isMounted) return;
          if (data.orders) setOrders(data.orders);
          if (data.menuItems) setMenuItems(data.menuItems);
          if (data.serviceRequests) setServiceRequests(data.serviceRequests);
          if (data.loyaltyAccounts) setLoyaltyAccounts(data.loyaltyAccounts);
        })
        .catch(err => {
          console.warn('Bootstrap fetch retry (server might be waking up):', err);
          if (isMounted) {
            setTimeout(fetchBootstrapState, 3500);
          }
        });
    };

    fetchBootstrapState();

    // Connect to Server-Sent Events (SSE) for multi-device real-time sync
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      if (isMounted) {
        setIsRealTimeConnected(true);
        // Refresh state on connection to ensure no events were missed during sleep/reconnect
        fetch('/api/bootstrap')
          .then(res => res.json())
          .then(data => {
            if (!isMounted) return;
            if (data.orders) setOrders(data.orders);
            if (data.menuItems) setMenuItems(data.menuItems);
            if (data.serviceRequests) setServiceRequests(data.serviceRequests);
            if (data.loyaltyAccounts) setLoyaltyAccounts(data.loyaltyAccounts);
          })
          .catch(() => {});
      }
    };

    eventSource.onerror = () => {
      if (isMounted) setIsRealTimeConnected(false);
    };

    // Listen to real-time events broadcast by server
    eventSource.addEventListener('orders_updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.orders) {
          setOrders(payload.orders);
          // Play acoustic cue if a new order request arrived
          if (payload.newOrder) {
            playNotificationSound('alert');
          }
          if (payload.updatedOrder?.orderStatus === 'READY') {
            playNotificationSound('ready');
          }
        }
      } catch {
        // ignore parse error
      }
    });

    eventSource.addEventListener('menu_updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.menuItems) setMenuItems(payload.menuItems);
      } catch {
        // ignore
      }
    });

    eventSource.addEventListener('service_requested', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.serviceRequests) {
          setServiceRequests(payload.serviceRequests);
          if (payload.newCall) {
            playNotificationSound('alert');
          }
        }
      } catch {
        // ignore
      }
    });

    eventSource.addEventListener('loyalty_updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.accounts) setLoyaltyAccounts(payload.accounts);
      } catch {
        // ignore
      }
    });

    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, []);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      if (customerSession?.rememberDevice) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(customerSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CUSTOMER);
      }
    } catch {
      // ignore
    }
  }, [customerSession]);

  useEffect(() => {
    try {
      if (activeStaff) {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(activeStaff));
      } else {
        localStorage.removeItem(STORAGE_KEYS.STAFF);
      }
    } catch {
      // ignore
    }
  }, [activeStaff]);

  // Cart operations
  const addToCart = (item: OrderItem) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(
        p =>
          p.itemId === item.itemId &&
          p.selectedPortion === item.selectedPortion &&
          JSON.stringify((p.selectedAddOns || []).sort()) === JSON.stringify((item.selectedAddOns || []).sort()) &&
          (p.notes || '') === (item.notes || '')
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        const updated = copy[existingIdx];
        const newQty = updated.quantity + item.quantity;
        copy[existingIdx] = {
          ...updated,
          quantity: newQty,
          totalPricePaise: updated.itemPricePaise * newQty,
        };
        return copy;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCartItems(prev =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              quantity,
              totalPricePaise: item.itemPricePaise * quantity,
            }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const cartSubtotalPaise = cartItems.reduce((acc, curr) => acc + curr.totalPricePaise, 0);
  const cartTaxPaise = Math.round(cartSubtotalPaise * RESTAURANT_INFO.gstRate);
  const cartTotalPaise = cartSubtotalPaise + cartTaxPaise;

  // Customer Auth
  const loginCustomer = (phone: string, name?: string, rememberDevice: boolean = true) => {
    const session: CustomerSession = {
      phone,
      name: name || 'Guest Diner',
      rememberDevice,
      tableNumber: currentTable,
      sessionStartedAt: new Date().toISOString(),
    };
    setCustomerSession(session);
  };

  const logoutCustomer = () => {
    setCustomerSession(null);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER);
  };

  // Staff Auth (via Server API)
  const loginStaffWithPin = async (
    pin: string,
    preferredRole?: StaffRole
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, preferredRole }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setActiveStaff(data.user);
        return { success: true, message: `Welcome, ${data.user.name} (${data.user.role.toUpperCase()})` };
      }
      return { success: false, message: data.message || 'Invalid Staff PIN' };
    } catch {
      // Local fallback
      const matched = STAFF_USERS.find(s => s.pin === pin && (!preferredRole || s.role === preferredRole));
      if (matched) {
        setActiveStaff(matched);
        return { success: true, message: `Welcome, ${matched.name} (${matched.role.toUpperCase()})` };
      }
      return { success: false, message: 'Invalid Staff PIN. Try 1111, 2222, 3333, 4444.' };
    }
  };

  const switchStaffRole = (role: StaffRole) => {
    const user = STAFF_USERS.find(u => u.role === role);
    if (user) {
      setActiveStaff(user);
    }
  };

  const logoutStaff = () => {
    setActiveStaff(null);
    setIsStaffPortalOpen(false);
  };

  // Submit Order Request to Server API
  const submitOrderRequest = async (specialNotes?: string): Promise<RestaurantOrder | null> => {
    if (cartItems.length === 0) return null;
    if (!customerSession) return null;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: currentTable,
          customerPhone: customerSession.phone,
          customerName: customerSession.name,
          items: cartItems,
          notes: specialNotes,
        }),
      });

      if (res.ok) {
        const createdOrder: RestaurantOrder = await res.json();
        clearCart();
        return createdOrder;
      }
    } catch (err) {
      console.error('Order submission error, fallback to optimistic', err);
    }

    // Fallback optimistic creation
    const orderNumber = `R${1040 + orders.length + 1}`;
    const newOrder: RestaurantOrder = {
      id: orderNumber,
      tableNumber: currentTable,
      customerPhone: customerSession.phone,
      customerName: customerSession.name,
      items: cartItems.map(item => ({
        ...item,
        notes: specialNotes ? `${item.notes ? item.notes + ' | ' : ''}${specialNotes}` : item.notes,
      })),
      subtotalPaise: cartSubtotalPaise,
      taxPaise: cartTaxPaise,
      totalPaise: cartTotalPaise,
      orderStatus: 'WAITING_FOR_WAITER',
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
      stampAwarded: false,
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  // Helper to build authenticated staff headers
  const getStaffHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (activeStaff?.token) {
      headers['x-staff-token'] = activeStaff.token;
    }
    return headers;
  };

  // Waiter confirms order
  const confirmOrder = async (orderId: string, staffId?: string) => {
    const staff = STAFF_USERS.find(s => s.id === staffId) || activeStaff;
    try {
      await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'PATCH',
        headers: getStaffHeaders(),
        body: JSON.stringify({
          staffId: staff?.id || 'ST-W01',
          staffName: staff?.name || 'Assigned Waiter',
        }),
      });
    } catch {
      // Optimistic local update
      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? {
                ...ord,
                orderStatus: 'CONFIRMED',
                waiterAction: {
                  staffId: staff?.id || 'ST-W01',
                  staffName: staff?.name || 'Assigned Waiter',
                  confirmedAt: new Date().toISOString(),
                },
              }
            : ord
        )
      );
    }
  };

  // Waiter rejects order
  const rejectOrder = async (orderId: string, staffId: string, reason: string) => {
    const staff = STAFF_USERS.find(s => s.id === staffId) || activeStaff;
    try {
      await fetch(`/api/orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: getStaffHeaders(),
        body: JSON.stringify({
          staffId: staff?.id || 'ST-W01',
          staffName: staff?.name || 'Assigned Waiter',
          reason,
        }),
      });
    } catch {
      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? {
                ...ord,
                orderStatus: 'REJECTED',
                waiterAction: {
                  staffId: staff?.id || 'ST-W01',
                  staffName: staff?.name || 'Assigned Waiter',
                  confirmedAt: new Date().toISOString(),
                  rejectionReason: reason,
                },
              }
            : ord
        )
      );
    }
  };

  // Kitchen starts cooking
  const startPreparingOrder = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/prep`, {
        method: 'PATCH',
        headers: getStaffHeaders(),
      });
    } catch {
      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? {
                ...ord,
                orderStatus: 'PREPARING',
                kitchenAction: {
                  ...ord.kitchenAction,
                  startedAt: new Date().toISOString(),
                },
              }
            : ord
        )
      );
    }
  };

  // Kitchen marks ready
  const markOrderReady = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/ready`, {
        method: 'PATCH',
        headers: getStaffHeaders(),
      });
    } catch {
      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? {
                ...ord,
                orderStatus: 'READY',
                kitchenAction: {
                  ...ord.kitchenAction,
                  readyAt: new Date().toISOString(),
                },
              }
            : ord
        )
      );
    }
  };

  // Staff marks served
  const markOrderServed = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/serve`, {
        method: 'PATCH',
        headers: getStaffHeaders(),
      });
    } catch {
      setOrders(prev => prev.map(ord => (ord.id === orderId ? { ...ord, orderStatus: 'SERVED' } : ord)));
    }
  };

  // Cashier records settlement
  const recordPayment = async (orderId: string, method: PaymentMethod, cashierId?: string) => {
    const cashier = STAFF_USERS.find(s => s.id === cashierId) || activeStaff;
    try {
      await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: getStaffHeaders(),
        body: JSON.stringify({
          method,
          cashierId: cashier?.id || 'ST-C01',
          cashierName: cashier?.name || 'Cashier Desk',
        }),
      });
    } catch {
      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? {
                ...ord,
                paymentStatus: 'PAID',
                paymentMethod: method,
                cashierAction: {
                  cashierId: cashier?.id || 'ST-C01',
                  cashierName: cashier?.name || 'Cashier Desk',
                  paidAt: new Date().toISOString(),
                  tenderMethod: method,
                },
              }
            : ord
        )
      );
    }
  };

  // Submit review
  const submitReview = async (orderId: string, rating: number, comment: string) => {
    try {
      await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
    } catch {
      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? {
                ...ord,
                review: { rating, comment, createdAt: new Date().toISOString() },
              }
            : ord
        )
      );
    }
  };

  // Customer requests table assistance
  const requestService = async (type: ServiceRequestType): Promise<boolean> => {
    try {
      const res = await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: currentTable, type }),
      });
      return res.ok;
    } catch {
      const fallbackCall: ServiceRequest = {
        id: `SC-${Date.now().toString().slice(-4)}`,
        tableNumber: currentTable,
        type,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };
      setServiceRequests(prev => [fallbackCall, ...prev]);
      return true;
    }
  };

  // Waiter resolves service request
  const resolveServiceRequest = async (id: string) => {
    try {
      await fetch(`/api/service-calls/${id}/resolve`, {
        method: 'PATCH',
        headers: getStaffHeaders(),
      });
    } catch {
      setServiceRequests(prev => prev.map(s => (s.id === id ? { ...s, status: 'resolved' } : s)));
    }
  };

  // Manager toggles 86 / Out of Stock
  const toggleMenuItemAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await fetch(`/api/menu/${id}/availability`, {
        method: 'PATCH',
        headers: getStaffHeaders(),
        body: JSON.stringify({ isAvailable }),
      });
    } catch {
      setMenuItems(prev => prev.map(m => (m.id === id ? { ...m, isAvailable } : m)));
    }
  };

  // Admin adds new dish to menu
  const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: getStaffHeaders(),
        body: JSON.stringify(item),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // Admin updates existing dish
  const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: getStaffHeaders(),
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // Admin deletes dish from menu
  const deleteMenuItem = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
        headers: getStaffHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const getActiveOrderByTable = (table: string): RestaurantOrder | undefined => {
    const formatted = table.padStart(2, '0');
    return orders.find(
      o => o.tableNumber === formatted && o.orderStatus !== 'SERVED' && o.orderStatus !== 'REJECTED'
    );
  };

  const getCustomerActiveOrder = (): RestaurantOrder | undefined => {
    const tableOrder = getActiveOrderByTable(currentTable);
    if (tableOrder) return tableOrder;

    if (customerSession?.phone) {
      return orders.find(
        o =>
          o.customerPhone === customerSession.phone &&
          o.orderStatus !== 'SERVED' &&
          o.orderStatus !== 'REJECTED'
      );
    }
    return undefined;
  };

  const getLoyaltyForPhone = (phone: string): CustomerLoyalty => {
    const matched = loyaltyAccounts[phone];
    if (matched) return matched;
    return {
      phone,
      stampsCount: 0,
      threshold: RESTAURANT_INFO.stampTarget,
      rewardTitle: RESTAURANT_INFO.stampReward,
      history: [],
    };
  };

  const resetDemoData = async () => {
    try {
      await fetch('/api/admin/reset-demo', {
        method: 'POST',
        headers: getStaffHeaders(),
      });
    } catch {
      setOrders(INITIAL_ORDERS);
      setMenuItems(INITIAL_MENU_ITEMS);
      setServiceRequests([]);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        currentTable,
        setCurrentTable,
        customerSession,
        loginCustomer,
        logoutCustomer,
        activeStaff,
        loginStaffWithPin,
        switchStaffRole,
        logoutStaff,
        isStaffPortalOpen,
        setIsStaffPortalOpen,
        menuItems,
        orders,
        loyaltyAccounts,
        serviceRequests,
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotalPaise,
        cartTaxPaise,
        cartTotalPaise,
        submitOrderRequest,
        confirmOrder,
        rejectOrder,
        startPreparingOrder,
        markOrderReady,
        markOrderServed,
        recordPayment,
        submitReview,
        requestService,
        resolveServiceRequest,
        toggleMenuItemAvailability,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        getActiveOrderByTable,
        getCustomerActiveOrder,
        getLoyaltyForPhone,
        resetDemoData,
        isRealTimeConnected,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
