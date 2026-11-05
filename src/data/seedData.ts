import { MenuItem, RestaurantOrder, StaffUser, RestaurantTable } from '../types/restaurant';

export const RESTAURANT_INFO = {
  name: 'Saffron & Spice Bistro',
  tagline: 'Authentic Regional Flavours & Live Tandoor',
  address: '14 Royal Heritage Lane, City Center',
  phone: '+91 98765 43210',
  gstNumber: '07AAAAA0000A1Z5',
  gstRate: 0.05, // 5% GST
  currencySymbol: '₹',
  stampMinSpendPaise: 20000, // ₹200 min spend to earn 1 stamp
  stampTarget: 6,
  stampReward: 'Complimentary Dessert (Gulab Jamun or Rasmalai)',
};

export const STAFF_USERS: StaffUser[] = [
  { id: 'ST-W01', name: 'Rohan Sharma', role: 'waiter', pin: '1111' },
  { id: 'ST-K01', name: 'Chef Sanjeev', role: 'kitchen', pin: '2222' },
  { id: 'ST-C01', name: 'Priya Verma', role: 'cashier', pin: '3333' },
  { id: 'ST-M01', name: 'Vikram Mehta (Owner)', role: 'manager', pin: '4444' },
];

export const RESTAURANT_TABLES: RestaurantTable[] = [
  { id: 'T-01', tableNumber: '01', capacity: 2, section: 'Ground Floor Window', status: 'available' },
  { id: 'T-02', tableNumber: '02', capacity: 4, section: 'Ground Floor Central', status: 'occupied' },
  { id: 'T-03', tableNumber: '03', capacity: 4, section: 'Ground Floor Central', status: 'available' },
  { id: 'T-04', tableNumber: '04', capacity: 6, section: 'Family Alcove', status: 'occupied' },
  { id: 'T-05', tableNumber: '05', capacity: 2, section: 'Courtyard Terrace', status: 'available' },
  { id: 'T-06', tableNumber: '06', capacity: 4, section: 'Courtyard Terrace', status: 'occupied' },
  { id: 'T-07', tableNumber: '07', capacity: 6, section: 'Private Dining Room', status: 'available' },
  { id: 'T-08', tableNumber: '08', capacity: 4, section: 'Main Dining Hall', status: 'occupied' },
  { id: 'T-09', tableNumber: '09', capacity: 2, section: 'Main Dining Hall', status: 'available' },
  { id: 'T-10', tableNumber: '10', capacity: 8, section: 'Banquet Corner', status: 'available' },
  { id: 'T-11', tableNumber: '11', capacity: 4, section: 'Balcony View', status: 'available' },
  { id: 'T-12', tableNumber: '12', capacity: 4, section: 'Balcony View', status: 'available' },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // STARTERS
  {
    id: 'M-STR-01',
    name: 'Paneer Tikka',
    category: 'starters',
    description: 'Charcoal grilled cottage cheese marinated in hung curd, Kashmiri deghi mirch and mustard oil.',
    pricePaise: 22000, // ₹220
    isVeg: true,
    isAvailable: true,
    spicyLevel: 2,
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
    portionOptions: [
      { name: 'Regular (6 pcs)', priceDeltaPaise: 0 },
      { name: 'Large Platter (10 pcs)', priceDeltaPaise: 9000 },
    ],
    addOns: [
      { id: 'add-dip-mint', name: 'Special Mint Coriander Dip', pricePaise: 2000 },
      { id: 'add-lachha-onion', name: 'Spiced Laccha Onion Salad', pricePaise: 2500 },
    ],
  },
  {
    id: 'M-STR-02',
    name: 'Veg Spring Roll',
    category: 'starters',
    description: 'Crispy golden rolls packed with julienned vegetables, glass noodles, and sweet chili glaze.',
    pricePaise: 16000, // ₹160
    isVeg: true,
    isAvailable: true,
    spicyLevel: 1,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    portionOptions: [
      { name: 'Regular (4 rolls)', priceDeltaPaise: 0 },
      { name: 'Family Pack (8 rolls)', priceDeltaPaise: 11000 },
    ],
    addOns: [
      { id: 'add-sweet-chilli', name: 'Extra Sweet Chili Sauce', pricePaise: 1500 },
      { id: 'add-mayo-garlic', name: 'Garlic Aioli Dip', pricePaise: 2000 },
    ],
  },
  {
    id: 'M-STR-03',
    name: 'Crispy Corn Salt & Pepper',
    category: 'starters',
    description: 'Tender sweet corn tossed with crushed black pepper, spring onions, and oriental spices.',
    pricePaise: 18000, // ₹180
    isVeg: true,
    isAvailable: true,
    spicyLevel: 2,
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M-STR-04',
    name: 'Tandoori Soya Chaap',
    category: 'starters',
    description: 'Soy skewers roasted over clay oven coals with tandoori spices, lemon zest, and butter glaze.',
    pricePaise: 21000, // ₹210
    isVeg: true,
    isAvailable: true,
    spicyLevel: 2,
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500&auto=format&fit=crop&q=80',
    portionOptions: [
      { name: 'Regular', priceDeltaPaise: 0 },
      { name: 'Malai Chaap Style', priceDeltaPaise: 3000 },
    ],
  },

  // MAINS
  {
    id: 'M-MAIN-01',
    name: 'Dal Tadka',
    category: 'mains',
    description: 'Yellow lentils slow-simmered with garlic, cumin seeds, whole red chilies, and desi ghee tadka.',
    pricePaise: 19000, // ₹190
    isVeg: true,
    isAvailable: true,
    spicyLevel: 1,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
    addOns: [
      { id: 'add-extra-ghee', name: 'Desi Ghee Float', pricePaise: 2500 },
      { id: 'add-fried-garlic', name: 'Crispy Fried Garlic Topping', pricePaise: 1500 },
    ],
  },
  {
    id: 'M-MAIN-02',
    name: 'Paneer Butter Masala',
    category: 'mains',
    description: 'Fresh cottage cheese cubes folded in a silky, rich tomato and cashew velvet gravy with kasuri methi.',
    pricePaise: 26000, // ₹260
    isVeg: true,
    isAvailable: true,
    spicyLevel: 1,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
    portionOptions: [
      { name: 'Regular (Serves 2)', priceDeltaPaise: 0 },
      { name: 'Jumbo Bowl (Serves 4)', priceDeltaPaise: 15000 },
    ],
    addOns: [
      { id: 'add-extra-butter', name: 'Amul Butter Cube', pricePaise: 2000 },
      { id: 'add-extra-paneer', name: 'Extra Cottage Cheese Cubes', pricePaise: 5000 },
    ],
  },
  {
    id: 'M-MAIN-03',
    name: 'Kadhai Paneer',
    category: 'mains',
    description: 'Wok-tossed paneer with crunchy bell peppers, diced onions, and freshly pounded coriander seeds.',
    pricePaise: 25000, // ₹250
    isVeg: true,
    isAvailable: true,
    spicyLevel: 3,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M-MAIN-04',
    name: 'Dum Aloo Kashmiri',
    category: 'mains',
    description: 'Baby potatoes deep fried and slow cooked in authentic fennel, ginger, and Kashmiri chili gravy.',
    pricePaise: 23000, // ₹230
    isVeg: true,
    isAvailable: true,
    spicyLevel: 2,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  },

  // BREADS & RICE
  {
    id: 'M-BRD-01',
    name: 'Butter Naan',
    category: 'breads',
    description: 'Classic leavened flatbread baked on the walls of clay tandoor and brushed with salted butter.',
    pricePaise: 5000, // ₹50
    isVeg: true,
    isAvailable: true,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M-BRD-02',
    name: 'Garlic Naan',
    category: 'breads',
    description: 'Crisp clay oven naan topped with minced roasted garlic cloves, fresh coriander, and butter.',
    pricePaise: 6500, // ₹65
    isVeg: true,
    isAvailable: true,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M-BRD-03',
    name: 'Jeera Rice',
    category: 'breads',
    description: 'Fragrant aged long-grain basmati rice tempered with royal cumin seeds and clarified butter.',
    pricePaise: 14000, // ₹140
    isVeg: true,
    isAvailable: true,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&auto=format&fit=crop&q=80',
  },

  // BEVERAGES
  {
    id: 'M-BEV-01',
    name: 'Masala Chai',
    category: 'beverages',
    description: 'Slow-brewed Assam CTC tea infused with crushed cardamom, ginger, cloves, and whole buffalo milk.',
    pricePaise: 6000, // ₹60
    isVeg: true,
    isAvailable: true,
    spicyLevel: 1,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M-BEV-02',
    name: 'Mango Lassi',
    category: 'beverages',
    description: 'Thick creamy yogurt blended with Alphonso mango pulp, saffron strands, and crushed pistachios.',
    pricePaise: 11000, // ₹110
    isVeg: true,
    isAvailable: true,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M-BEV-03',
    name: 'Fresh Lime Soda',
    category: 'beverages',
    description: 'Sparkling soda with freshly squeezed lime juice. Choice of sweet, salted, or mixed.',
    pricePaise: 8000, // ₹80
    isVeg: true,
    isAvailable: true,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
  },

  // DESSERTS
  {
    id: 'M-DES-01',
    name: 'Gulab Jamun (2 Pcs)',
    category: 'desserts',
    description: 'Mawa dumplings fried golden brown, steeped in warm saffron and green cardamom sugar syrup.',
    pricePaise: 11000, // ₹110
    isVeg: true,
    isAvailable: true,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1605197154344-979de6235b91?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M-DES-02',
    name: 'Rasmalai (2 Pcs)',
    category: 'desserts',
    description: 'Soft cottage cheese patties immersed in chilled clotted saffron milk, garnished with almond slivers.',
    pricePaise: 13000, // ₹130
    isVeg: true,
    isAvailable: true,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_ORDERS: RestaurantOrder[] = [
  {
    id: 'R1038',
    tableNumber: '04',
    customerPhone: '+91 98201 12345',
    customerName: 'Amit Verma',
    items: [
      {
        itemId: 'M-STR-01',
        name: 'Paneer Tikka',
        quantity: 1,
        selectedPortion: 'Regular (6 pcs)',
        selectedAddOns: ['Special Mint Coriander Dip'],
        itemPricePaise: 24000,
        totalPricePaise: 24000,
        notes: 'Make it extra crisp on the skewers please.',
      },
      {
        itemId: 'M-MAIN-01',
        name: 'Dal Tadka',
        quantity: 1,
        selectedAddOns: ['Desi Ghee Float'],
        itemPricePaise: 21500,
        totalPricePaise: 21500,
        notes: 'Less spicy tadka.',
      },
      {
        itemId: 'M-BRD-01',
        name: 'Butter Naan',
        quantity: 2,
        selectedAddOns: [],
        itemPricePaise: 5000,
        totalPricePaise: 10000,
      },
    ],
    subtotalPaise: 55500,
    taxPaise: 2775,
    totalPaise: 58275,
    orderStatus: 'WAITING_FOR_WAITER', // Needs physical verification
    paymentStatus: 'UNPAID',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    stampAwarded: false,
  },
  {
    id: 'R1039',
    tableNumber: '06',
    customerPhone: '+91 97110 54321',
    customerName: 'Neha Kapoor',
    items: [
      {
        itemId: 'M-MAIN-02',
        name: 'Paneer Butter Masala',
        quantity: 1,
        selectedPortion: 'Regular (Serves 2)',
        selectedAddOns: ['Amul Butter Cube'],
        itemPricePaise: 28000,
        totalPricePaise: 28000,
      },
      {
        itemId: 'M-BRD-02',
        name: 'Garlic Naan',
        quantity: 3,
        selectedAddOns: [],
        itemPricePaise: 6500,
        totalPricePaise: 19500,
      },
      {
        itemId: 'M-BEV-02',
        name: 'Mango Lassi',
        quantity: 2,
        selectedAddOns: [],
        itemPricePaise: 11000,
        totalPricePaise: 22000,
      },
    ],
    subtotalPaise: 69500,
    taxPaise: 3475,
    totalPaise: 72975,
    orderStatus: 'PREPARING', // In kitchen queue
    paymentStatus: 'UNPAID',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    waiterAction: {
      staffId: 'ST-W01',
      staffName: 'Rohan Sharma',
      confirmedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    kitchenAction: {
      startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    stampAwarded: false,
  },
  {
    id: 'R1035',
    tableNumber: '02',
    customerPhone: '+91 99887 76655',
    customerName: 'Kunal Sen',
    items: [
      {
        itemId: 'M-STR-02',
        name: 'Veg Spring Roll',
        quantity: 1,
        selectedAddOns: [],
        itemPricePaise: 16000,
        totalPricePaise: 16000,
      },
      {
        itemId: 'M-MAIN-01',
        name: 'Dal Tadka',
        quantity: 1,
        selectedAddOns: [],
        itemPricePaise: 19000,
        totalPricePaise: 19000,
      },
      {
        itemId: 'M-BRD-03',
        name: 'Jeera Rice',
        quantity: 1,
        selectedAddOns: [],
        itemPricePaise: 14000,
        totalPricePaise: 14000,
      },
      {
        itemId: 'M-DES-01',
        name: 'Gulab Jamun (2 Pcs)',
        quantity: 1,
        selectedAddOns: [],
        itemPricePaise: 11000,
        totalPricePaise: 11000,
      },
    ],
    subtotalPaise: 60000,
    taxPaise: 3000,
    totalPaise: 63000,
    orderStatus: 'SERVED',
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    waiterAction: {
      staffId: 'ST-W01',
      staffName: 'Rohan Sharma',
      confirmedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    kitchenAction: {
      startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      readyAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    cashierAction: {
      cashierId: 'ST-C01',
      cashierName: 'Priya Verma',
      paidAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      tenderMethod: 'UPI',
    },
    stampAwarded: true,
    review: {
      rating: 5,
      comment: 'Paneer was exceptionally fresh, and the waiter confirmed our order within 30 seconds. Brilliant experience!',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  },
];
