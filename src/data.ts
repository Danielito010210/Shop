import { Product, User, Order, SecurityLog } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Reloj Minimalista Chronos',
    description: 'Reloj de pulsera con correa de cuero italiano, dial cepillado y movimiento de cuarzo suizo.',
    price: 189.99,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    category: 'Accesorios',
    stock: 12
  },
  {
    id: 'prod-2',
    name: 'Auriculares Premium ANC',
    description: 'Cancelación activa de ruido híbrida, audio de alta resolución y 40 horas de batería continua.',
    price: 249.50,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    category: 'Audio',
    stock: 24
  },
  {
    id: 'prod-3',
    name: 'Mochila Urbana Impermeable',
    description: 'Diseño ultra delgado con compartimento acolchado para laptop de 16", puerto USB de carga integrado y bolsillos ocultos.',
    price: 79.95,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    category: 'Viaje',
    stock: 15
  },
  {
    id: 'prod-4',
    name: 'Teclado Mecánico Alquimia',
    description: 'Teclado mecánico premium layout 75% con switches amarillos pre-lubricados, teclas PBT de doble inyección y luz ámbar cálida.',
    price: 135.00,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    category: 'Periféricos',
    stock: 8
  },
  {
    id: 'prod-5',
    name: 'Taza Térmica Inteligente',
    description: 'Mantiene tus bebidas a la temperatura exacta seleccionada mediante app. Diseño cerámico minimalista con base de carga.',
    price: 99.00,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    category: 'Hogar',
    stock: 30
  },
  {
    id: 'prod-6',
    name: 'Lámpara de Lectura Halógena',
    description: 'Brazo articulado de latón envejecido, regulador táctil de intensidad y espectro de luz natural anti-fatiga visual.',
    price: 65.00,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    category: 'Hogar',
    stock: 6
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Administrador Principal',
    role: 'admin',
    password: 'admin' // Simple password for demo
  },
  {
    id: 'user-emp1',
    username: 'sofia.r',
    fullName: 'Sofía Rodríguez',
    role: 'employee',
    password: 'sofia'
  },
  {
    id: 'user-emp2',
    username: 'carlos.m',
    fullName: 'Carlos Mendoza',
    role: 'employee',
    password: 'carlos'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    invoiceNumber: 'FAC-2026-0001',
    clientDetails: {
      name: 'Alejandro G. Pérez',
      phone: '+34 612 345 678',
      address: 'Calle Mayor 45, Piso 3B, Madrid',
      nickname: 'Alex',
      reference: 'Frente al supermercado Mercadona'
    },
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
      { product: INITIAL_PRODUCTS[2], quantity: 1 }
    ],
    total: 269.94,
    status: 'confirmed',
    date: '2026-06-12T14:32:00Z',
    processedBy: 'Sofía Rodríguez'
  },
  {
    id: 'ord-2',
    invoiceNumber: 'FAC-2026-0002',
    clientDetails: {
      name: 'María Alejandra López',
      phone: '+34 699 888 777',
      address: 'Avenida Diagonal 120, Barcelona',
      nickname: 'Mari',
      reference: 'Portal de reja verde'
    },
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 2 }
    ],
    total: 499.00,
    status: 'pending',
    date: '2026-06-15T10:15:00Z'
  },
  {
    id: 'ord-3',
    invoiceNumber: 'FAC-2026-0003',
    clientDetails: {
      name: 'José Ignacio Ruiz',
      phone: '+34 600 111 222',
      address: 'Paseo de la Palmera S/N, Sevilla',
      nickname: 'Nacho',
      reference: 'Junto a la Farmacia 24h'
    },
    items: [
      { product: INITIAL_PRODUCTS[4], quantity: 1 },
      { product: INITIAL_PRODUCTS[5], quantity: 1 }
    ],
    total: 164.00,
    status: 'canceled',
    date: '2026-06-14T16:45:00Z',
    processedBy: 'Carlos Mendoza'
  }
];

export const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  {
    id: 'sec-1',
    username: 'admin',
    timestamp: '2026-06-15T20:45:12Z',
    ipAddress: '192.168.1.45',
    device: 'Windows OS • Chrome Browser',
    failureReason: 'Contraseña incorrecta'
  },
  {
    id: 'sec-2',
    username: 'marta.p',
    timestamp: '2026-06-15T18:12:05Z',
    ipAddress: '185.45.112.5',
    device: 'iOS • Safari Mobile',
    failureReason: 'Nombre de usuario no registrado'
  },
  {
    id: 'sec-3',
    username: 'carlos.m',
    timestamp: '2026-06-14T09:30:18Z',
    ipAddress: '90.165.4.19',
    device: 'macOS • Firefox Browser',
    failureReason: 'Contraseña obsoleta / incorrecta'
  }
];
