export interface Product {
  code: string;
  description: string;
  uom: string; // Unidad de Medida (e.g., "UN", "KG", "LTS", "MTS")
  imageUrl?: string; // Optimized base64 image
  source: 'default' | 'imported';
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  sector: string;
  createdAt: string;
}

export interface OrderItem {
  productCode: string;
  description: string;
  uom: string;
  quantity: number;
  observations: string;
  imageUrl?: string; // Snapshot of the image associated at the time of purchase
}

export interface Order {
  id: string;
  code: string; // e.g., "RQ-2026-0001"
  title: string;
  status: 'draft' | 'submitted';
  items: OrderItem[];
  notes?: string;
  requestedBy: string;
  createdById: string; // User who generated the request
  sector: string; // Sector to isolate orders
  createdAt: string;
  updatedAt: string;
}
