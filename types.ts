export enum UserRole {
  ADMIN = 'Administrator',
  MANAGER = 'Manager',
  OPERATOR = 'Operator'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum MachineType {
    TRACTOR = 'Trator',
    HARVESTER = 'Colheitadeira',
    PLANTER = 'Plantadeira',
    SPRAYER = 'Pulverizador',
    IMPLEMENT = 'Implemento',
    TRUCK = 'Caminhão',
}

export enum MachineStatus {
    ACTIVE = 'Ativo',
    INACTIVE = 'Inativo',
    MAINTENANCE = 'Em Manutenção',
}

export enum FuelType {
    DIESEL_S10 = 'Diesel S10',
    DIESEL_S500 = 'Diesel S500',
    GASOLINE = 'Gasolina',
}

export interface MaintenanceConfig {
  engineOilHours: number;
  transmissionOilHours: number;
  fuelFilterHours: number;
  airFilterHours: number;
}

export interface LastMaintenance {
  engineOilHour: number;
  transmissionOilHour: number;
  fuelFilterHour: number;
  airFilterHour: number;
}

export interface HourMeterLog {
  date: string; // ISO 8601 format
  value: number;
  collaboratorId: string;
  source: 'Abastecimento' | 'Manutenção' | 'Manual';
  sourceId: string; // ID of the fuel/maintenance log or a timestamp for manual edits
}

export interface Machine {
  id: string;
  name: string; // ex: Trator Massey 4275
  type: MachineType; // Trator, Colheitadeira, etc.
  brandModel: string; // Marca / Modelo
  year: number; // Ano de Fabricação
  serialNumber?: string; // Número de Série / Chassi
  hourMeter: number; // Horímetro Atual
  status: MachineStatus; // Ativo / Inativo
  currentCollaboratorId?: string; // Responsável atual
  notes?: string; // Observações adicionais
  defaultFuelType?: FuelType;
  maintenanceConfig?: MaintenanceConfig;
  lastMaintenance?: LastMaintenance;
  hourMeterHistory?: HourMeterLog[];
}

export interface FuelLog {
  id: string;
  date: string; // ISO 8601 format
  machineId: string;
  collaboratorId: string;
  fuelType: FuelType;
  totalValue: number;
  quantity: number;
  odometer: number;
  observations?: string;
}

export enum MaintenanceType {
    OIL_CHANGE = 'Troca de Óleo',
    FILTER_CHANGE = 'Troca de Filtro',
    OIL_AND_FILTER = 'Troca de Óleo e Filtro',
    PREVENTIVE = 'Preventiva',
    CORRECTIVE = 'Corretiva',
}

export interface MaintenancePart {
    itemId: string;
    quantity: number;
}

export interface MaintenanceLog {
    id: string;
    type: MaintenanceType;
    date: string; // ISO 8601 format
    machineId: string;
    hourMeter: number;
    collaboratorId: string;
    totalCost: number;
    notes?: string;
    partsUsed?: MaintenancePart[];
}

export interface Collaborator {
    id: string;
    name: string;
    role: string;
    contact?: string;
    assignments?: string;
}

export interface FuelPrice {
    fuelType: FuelType;
    price: number;
}

export interface StockHistoryLog {
    date: string; // ISO 8601 format
    quantityChange: number; // e.g., +10 for addition, -2 for deduction
    newStockLevel: number;
    reason: string; // e.g., "Entrada Inicial", "Ajuste Manual", "Saída p/ Manutenção", "Entrada via Compra"
    referenceId?: string; // e.g., maintenanceLogId or purchaseOrderId
    invoiceNumber?: string;
}

export interface WarehouseItem {
    id: string;
    name: string;
    code: string;
    unitValue: number;
    stockQuantity: number;
    createdAt: string; // ISO 8601 format
    stockHistory?: StockHistoryLog[];
}

export enum PurchaseOrderStatus {
    PENDING = 'Pendente',
    APPROVED = 'Aprovado',
    FULFILLED = 'Atendido',
    CANCELLED = 'Cancelado',
}

export interface PurchaseOrderItem {
    itemId: string; // Links to WarehouseItem ID
    quantity: number;
    notes?: string;
}

export interface PurchaseOrder {
    id: string;
    code: string; // e.g., PED-000001
    items: PurchaseOrderItem[];
    status: PurchaseOrderStatus;
    requestDate: string; // ISO 8601
    requesterId: string; // Links to User ID or Collaborator ID
    approvalDate?: string;
    approvedById?: string;
    fulfilledDate?: string;
    fulfilledById?: string;
    notes?: string;
    cancellationDate?: string;
    cancelledById?: string;
    cancellationReason?: string;
}


export interface Farm {
    name: string | null;
    machines: Machine[];
    collaborators: Collaborator[];
    fuelLogs: FuelLog[];
    maintenanceLogs: MaintenanceLog[];
    fuelPrices: FuelPrice[];
    warehouseItems: WarehouseItem[];
    purchaseOrders: PurchaseOrder[];
}