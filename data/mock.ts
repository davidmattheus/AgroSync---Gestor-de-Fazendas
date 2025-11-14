import { User, UserRole, Farm, MachineType, MachineStatus, FuelType, MaintenanceType, PurchaseOrderStatus } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'user_1', name: 'Admin User', email: 'admin@agrosync.com', role: UserRole.ADMIN },
  { id: 'user_2', name: 'Manager User', email: 'manager@agrosync.com', role: UserRole.MANAGER },
  { id: 'user_3', name: 'Operator User', email: 'operator@agrosync.com', role: UserRole.OPERATOR },
  { id: 'user_4', name: 'David Mattheus', email: 'davidmattheus2@gmail.com', role: UserRole.ADMIN },
];

export const MOCK_FARM_DATA: Omit<Farm, 'name'> = {
  machines: [
    { 
      id: 'machine_1', name: 'Trator John Deere 8R', brandModel: '8320R', type: MachineType.TRACTOR, year: 2022, serialNumber: 'CH12345JD', hourMeter: 1245, status: MachineStatus.ACTIVE, currentCollaboratorId: 'collab_1', notes: 'Motor revisado em 1000h.', defaultFuelType: FuelType.DIESEL_S10,
      maintenanceConfig: { engineOilHours: 250, transmissionOilHours: 1000, fuelFilterHours: 500, airFilterHours: 500 },
      lastMaintenance: { engineOilHour: 1005, transmissionOilHour: 1005, fuelFilterHour: 1005, airFilterHour: 1005 },
      hourMeterHistory: [
          { date: '2023-09-01T14:00:00Z', value: 1000, collaboratorId: 'collab_2', source: 'Manutenção', sourceId: 'maint_1' },
          { date: '2023-10-24T15:00:00Z', value: 1200, collaboratorId: 'collab_1', source: 'Abastecimento', sourceId: 'fuel_3' },
          { date: '2023-10-26T10:00:00Z', value: 1240, collaboratorId: 'collab_1', source: 'Abastecimento', sourceId: 'fuel_1' },
      ]
    },
    { 
      id: 'machine_2', name: 'Colheitadeira Case', brandModel: 'Axial-Flow 9250', type: MachineType.HARVESTER, year: 2021, serialNumber: 'CA67890IH', hourMeter: 850, status: MachineStatus.ACTIVE, currentCollaboratorId: 'collab_3', notes: 'Plataforma de 45 pés.', defaultFuelType: FuelType.DIESEL_S10,
      maintenanceConfig: { engineOilHours: 200, transmissionOilHours: 800, fuelFilterHours: 400, airFilterHours: 400 },
      lastMaintenance: { engineOilHour: 800, transmissionOilHour: 800, fuelFilterHour: 410, airFilterHour: 800 },
      hourMeterHistory: []
    },
    { 
      id: 'machine_3', name: 'Pulverizador Stara', brandModel: 'Imperador 3.0', type: MachineType.SPRAYER, year: 2023, serialNumber: 'ST24680PV', hourMeter: 430, status: MachineStatus.MAINTENANCE, currentCollaboratorId: 'collab_2', notes: 'Aguardando peça para a barra de pulverização.', defaultFuelType: FuelType.DIESEL_S500,
      maintenanceConfig: { engineOilHours: 150, transmissionOilHours: 600, fuelFilterHours: 300, airFilterHours: 300 },
      lastMaintenance: { engineOilHour: 300, transmissionOilHour: 0, fuelFilterHour: 300, airFilterHour: 300 },
      hourMeterHistory: []
    },
    { id: 'machine_4', name: 'Plantadeira Tatu', brandModel: 'AST-MATIC 9', type: MachineType.PLANTER, year: 2020, serialNumber: 'TA13579PL', hourMeter: 1500, status: MachineStatus.INACTIVE, notes: 'Armazenada para a próxima safra.', hourMeterHistory: [] },
    { id: 'machine_5', name: 'Caminhão Scania R450', brandModel: 'R450', type: MachineType.TRUCK, year: 2019, serialNumber: 'SC98765TR', hourMeter: 250000, status: MachineStatus.ACTIVE, currentCollaboratorId: 'collab_1', notes: 'Utilizado para transporte de grãos.', defaultFuelType: FuelType.DIESEL_S10, hourMeterHistory: [] },
  ],
  collaborators: [
    { id: 'collab_1', name: 'João Silva', role: 'Operador de Máquinas' },
    { id: 'collab_2', name: 'Carlos Pereira', role: 'Mecânico' },
    { id: 'collab_3', name: 'Pedro Alves', role: 'Operador de Máquinas' },
    { id: 'collab_4', name: 'Ana Costa', role: 'Almoxarifado' },
  ],
  fuelLogs: [
    { id: 'fuel_1', date: '2023-10-26T10:00:00Z', machineId: 'machine_1', collaboratorId: 'collab_1', fuelType: FuelType.DIESEL_S10, totalValue: 550.00, quantity: 100, odometer: 1240 },
    { id: 'fuel_2', date: '2023-10-25T09:30:00Z', machineId: 'machine_2', collaboratorId: 'collab_3', fuelType: FuelType.DIESEL_S10, totalValue: 825.00, quantity: 150, odometer: 845 },
    { id: 'fuel_3', date: '2023-10-24T15:00:00Z', machineId: 'machine_1', collaboratorId: 'collab_1', fuelType: FuelType.DIESEL_S10, totalValue: 540.00, quantity: 98, odometer: 1200 },
     { id: 'fuel_4', date: '2023-09-15T11:00:00Z', machineId: 'machine_3', collaboratorId: 'collab_3', fuelType: FuelType.DIESEL_S500, totalValue: 400.00, quantity: 80, odometer: 400 },
  ],
  maintenanceLogs: [
    { id: 'maint_1', type: MaintenanceType.OIL_AND_FILTER, date: '2023-09-01T14:00:00Z', machineId: 'machine_1', hourMeter: 1000, collaboratorId: 'collab_2', totalCost: 1200.00, partsUsed: [{ itemId: 'item_2', quantity: 2 }] },
    { id: 'maint_2', type: MaintenanceType.PREVENTIVE, date: '2023-10-15T08:00:00Z', machineId: 'machine_2', hourMeter: 800, collaboratorId: 'collab_2', totalCost: 2500.00, partsUsed: [{ itemId: 'item_3', quantity: 1 }] },
    { id: 'maint_3', type: MaintenanceType.CORRECTIVE, date: '2023-10-20T11:00:00Z', machineId: 'machine_3', hourMeter: 420, collaboratorId: 'collab_2', totalCost: 850.00, notes: 'Reparo no sistema hidráulico', partsUsed: [{ itemId: 'item_1', quantity: 5 }] },
  ],
  fuelPrices: [
    { fuelType: FuelType.DIESEL_S10, price: 5.50 },
    { fuelType: FuelType.DIESEL_S500, price: 5.30 },
    { fuelType: FuelType.GASOLINE, price: 5.80 },
  ],
  warehouseItems: [
    { id: 'item_1', name: 'Filtro de Óleo LF9009', code: 'FLE-559009', unitValue: 150.75, stockQuantity: 15, createdAt: '2023-10-01T10:00:00Z', stockHistory: [
      { date: '2023-10-01T10:00:00Z', quantityChange: 10, newStockLevel: 10, reason: 'Entrada Inicial' },
      { date: '2023-10-15T09:00:00Z', quantityChange: 10, newStockLevel: 20, reason: 'Entrada via Nota Fiscal', invoiceNumber: 'NF-12345' },
      { date: '2023-10-20T11:00:00Z', quantityChange: -5, newStockLevel: 15, reason: 'Saída Manutenção', referenceId: 'maint_3' }
    ] },
    { id: 'item_2', name: 'Óleo de Motor 15W40 (Balde 20L)', code: 'LUB-15W40-20', unitValue: 450.00, stockQuantity: 8, createdAt: '2023-10-01T10:00:00Z', stockHistory: [
      { date: '2023-10-01T10:00:00Z', quantityChange: 10, newStockLevel: 10, reason: 'Entrada Inicial' },
      { date: '2023-09-01T14:00:00Z', quantityChange: -2, newStockLevel: 8, reason: 'Saída Manutenção', referenceId: 'maint_1' }
    ] },
    { id: 'item_3', name: 'Filtro de Ar Primário 479-8989', code: 'CAT-4798989', unitValue: 280.50, stockQuantity: 4, createdAt: '2023-10-02T11:00:00Z', stockHistory: [
      { date: '2023-10-02T11:00:00Z', quantityChange: 5, newStockLevel: 5, reason: 'Entrada Inicial' },
      { date: '2023-10-15T08:00:00Z', quantityChange: -1, newStockLevel: 4, reason: 'Saída Manutenção', referenceId: 'maint_2' }
    ] },
    { id: 'item_4', name: 'Parafuso Sextavado M12x1.5', code: 'PAR-M12X1.5', unitValue: 2.50, stockQuantity: 250, createdAt: '2023-09-15T09:00:00Z', stockHistory: [
      { date: '2023-09-15T09:00:00Z', quantityChange: 250, newStockLevel: 250, reason: 'Entrada Inicial' }
    ] },
    { id: 'item_5', name: 'Graxa Lítio MP2 (1kg)', code: 'GRA-MP2-1', unitValue: 35.00, stockQuantity: 12, createdAt: '2023-10-05T14:00:00Z', stockHistory: [
      { date: '2023-10-05T14:00:00Z', quantityChange: 12, newStockLevel: 12, reason: 'Entrada Inicial' }
    ] },
  ],
  purchaseOrders: [
    { id: 'po_1', code: 'PED-000001', items: [{ itemId: 'item_1', quantity: 20 }, { itemId: 'item_2', quantity: 5 }], status: PurchaseOrderStatus.PENDING, requestDate: '2023-10-28T10:00:00Z', requesterId: 'collab_4', notes: 'Urgente para a manutenção da frota.' },
    { id: 'po_2', code: 'PED-000002', items: [{ itemId: 'item_3', quantity: 10 }], status: PurchaseOrderStatus.APPROVED, requestDate: '2023-10-27T15:00:00Z', requesterId: 'collab_4', approvalDate: '2023-10-28T09:00:00Z', approvedById: 'user_4' },
    { id: 'po_3', code: 'PED-000003', items: [{ itemId: 'item_4', quantity: 500 }], status: PurchaseOrderStatus.FULFILLED, requestDate: '2023-10-20T11:00:00Z', requesterId: 'collab_4', approvalDate: '2023-10-21T10:00:00Z', approvedById: 'user_4', fulfilledDate: '2023-10-26T14:00:00Z', fulfilledById: 'user_4' },
    { id: 'po_4', code: 'PED-000004', items: [{ itemId: 'item_5', quantity: 5 }], status: PurchaseOrderStatus.CANCELLED, requestDate: '2023-10-25T08:00:00Z', requesterId: 'collab_4' },
  ],
};