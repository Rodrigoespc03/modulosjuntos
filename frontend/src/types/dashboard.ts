export interface ProductInventoryDto {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  category: string;
  minStock: number;
  maxStock: number;
  quantity: number;
  totalValue: number;
}

export interface MostUsedProductDto {
  id: string;
  productName: string;
  totalExits: number;
  totalUsage: number;
}

export interface MovementDto {
  id: string;
  productName: string;
  quantity: number;
  type: 'ENTRY' | 'EXIT';
  createdAt: string;
}

export interface CategoryInventoryDto {
  category: string;
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  totalValue: number;
}

export interface ExpirationAlertDto {
  id: string;
  name: string;
  expirationDate: string;
  daysUntilExpiration: number;
  currentStock: number;
  productName: string;
  quantity: number;
  expiryDate: string;
}

export interface ImmobilizedInventoryDto {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reason: string;
  immobilizedDate: string;
  value: number;
  daysWithoutMovement: number;
  productName: string;
  lastMovement: string;
}

export interface DashboardResponseDto {
  totalProducts: number;
  totalCategories: number;
  lowStockAlerts: ProductInventoryDto[];
  expirationAlerts: ExpirationAlertDto[];
  mostUsedProducts: MostUsedProductDto[];
  recentMovements: MovementDto[];
  categoryInventory: CategoryInventoryDto[];
  immobilizedInventory: ImmobilizedInventoryDto[];
} 