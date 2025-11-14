import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Farm, Machine, Collaborator, FuelLog, MaintenanceLog, FuelPrice, HourMeterLog, MaintenanceType, WarehouseItem, StockHistoryLog, PurchaseOrder, PurchaseOrderStatus } from '../types';
import { MOCK_FARM_DATA } from '../data/mock';
import { useAuth } from './AuthContext';

interface FarmDataContextType {
  farm: Farm;
  loading: boolean;
  setFarmName: (name: string) => void;
  addMachine: (machine: Omit<Machine, 'id'>) => void;
  updateMachine: (machine: Machine) => void;
  deleteMachine: (machineId: string) => void;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => void;
  addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  updateFuelLog: (log: FuelLog) => void;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  updateMaintenanceLog: (log: MaintenanceLog) => void;
  updateFuelPrices: (prices: FuelPrice[]) => void;
  addWarehouseItem: (item: Omit<WarehouseItem, 'id' | 'createdAt' | 'stockHistory'>) => void;
  updateWarehouseItem: (item: WarehouseItem) => void;
  deleteWarehouseItem: (itemId: string) => void;
  addStockToWarehouseItem: (itemId: string, quantityToAdd: number, invoiceNumber: string) => void;
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'code' | 'status' | 'requestDate'>) => void;
  updatePurchaseOrderStatus: (orderId: string, status: PurchaseOrderStatus, responsibleId: string) => void;
  cancelPurchaseOrder: (orderId: string, responsibleId: string, reason?: string) => void;
  getMachineById: (id: string) => Machine | undefined;
  getCollaboratorById: (id: string) => Collaborator | undefined;
  getWarehouseItemById: (id: string) => WarehouseItem | undefined;
}

const FarmDataContext = createContext<FarmDataContextType | undefined>(undefined);

const initialFarmState: Farm = {
    name: null,
    machines: [],
    collaborators: [],
    fuelLogs: [],
    maintenanceLogs: [],
    fuelPrices: [],
    warehouseItems: [],
    purchaseOrders: [],
};

export const FarmDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [farm, setFarm] = useState<Farm>(initialFarmState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        const storedFarm = localStorage.getItem('agrosync_farm');
        if (storedFarm) {
          const parsedFarm = JSON.parse(storedFarm);
          setFarm({ ...initialFarmState, ...parsedFarm });
        } else {
          setFarm({ ...MOCK_FARM_DATA, name: null });
        }
        setLoading(false);
      }, 500);
    } else {
      setFarm(initialFarmState);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateAndStoreFarm = (updatedFarm: Farm) => {
    setFarm(updatedFarm);
    localStorage.setItem('agrosync_farm', JSON.stringify(updatedFarm));
  }

  const setFarmName = useCallback((name: string) => {
    const updatedFarm = { ...farm, name };
    updateAndStoreFarm(updatedFarm);
  }, [farm]);

  const addMachine = (machine: Omit<Machine, 'id'>) => {
    const newMachine = { ...machine, id: `machine_${Date.now()}` };
    const updatedFarm = { ...farm, machines: [...farm.machines, newMachine] };
    updateAndStoreFarm(updatedFarm);
  };
  
  const updateMachine = (updatedMachine: Machine) => {
    const updatedMachines = farm.machines.map(m => m.id === updatedMachine.id ? updatedMachine : m);
    updateAndStoreFarm({ ...farm, machines: updatedMachines });
  };

  const deleteMachine = (machineId: string) => {
    const updatedMachines = farm.machines.filter(m => m.id !== machineId);
    updateAndStoreFarm({ ...farm, machines: updatedMachines });
  };

  const addCollaborator = (collaborator: Omit<Collaborator, 'id'>) => {
    const newCollaborator = { ...collaborator, id: `collab_${Date.now()}` };
    const updatedFarm = { ...farm, collaborators: [...farm.collaborators, newCollaborator] };
    updateAndStoreFarm(updatedFarm);
  };

  const addFuelLog = (log: Omit<FuelLog, 'id'>) => {
    const newLog = { ...log, id: `fuel_${Date.now()}` };
    
    const updatedMachines = farm.machines.map(machine => {
      if (machine.id === log.machineId) {
        if (log.odometer > machine.hourMeter) {
           const newHistoryEntry: HourMeterLog = {
            date: newLog.date,
            value: log.odometer,
            collaboratorId: log.collaboratorId,
            source: 'Abastecimento',
            sourceId: newLog.id,
          };
          return { 
            ...machine, 
            hourMeter: log.odometer,
            hourMeterHistory: [...(machine.hourMeterHistory || []), newHistoryEntry]
          };
        }
      }
      return machine;
    });

    const updatedFarm = { 
        ...farm, 
        machines: updatedMachines,
        fuelLogs: [...farm.fuelLogs, newLog] 
    };
    updateAndStoreFarm(updatedFarm);
  };

  const updateFuelLog = (updatedLog: FuelLog) => {
    const updatedLogs = farm.fuelLogs.map(log => log.id === updatedLog.id ? updatedLog : log);
    
    const machineToUpdate = farm.machines.find(m => m.id === updatedLog.machineId);
    if (machineToUpdate) {
        const allLogsForMachine = [
            ...updatedLogs.filter(l => l.machineId === updatedLog.machineId).map(l => ({ date: l.date, value: l.odometer })),
            ...farm.maintenanceLogs.filter(l => l.machineId === updatedLog.machineId).map(l => ({ date: l.date, value: l.hourMeter }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const latestHourMeter = allLogsForMachine.length > 0 ? allLogsForMachine[0].value : 0;

        const updatedMachines = farm.machines.map(m => {
            if (m.id === updatedLog.machineId) {
                const updatedHistory = (m.hourMeterHistory || []).map(h => {
                    if (h.source === 'Abastecimento' && h.sourceId === updatedLog.id) {
                        return { ...h, value: updatedLog.odometer, date: updatedLog.date };
                    }
                    return h;
                });
                return { ...m, hourMeter: latestHourMeter, hourMeterHistory: updatedHistory };
            }
            return m;
        });

        updateAndStoreFarm({ ...farm, fuelLogs: updatedLogs, machines: updatedMachines });
    } else {
        updateAndStoreFarm({ ...farm, fuelLogs: updatedLogs });
    }
  };
  
  const addMaintenanceLog = (log: Omit<MaintenanceLog, 'id'>) => {
    const newLog = { ...log, id: `maint_${Date.now()}` };
    let tempFarmState = { ...farm };

    if (log.partsUsed && log.partsUsed.length > 0) {
      const updatedWarehouseItems = tempFarmState.warehouseItems.map(item => {
        const partUsed = log.partsUsed?.find(p => p.itemId === item.id);
        if (partUsed) {
          const newStockQuantity = item.stockQuantity - partUsed.quantity;
          const newHistoryEntry: StockHistoryLog = {
              date: newLog.date,
              quantityChange: -partUsed.quantity,
              newStockLevel: newStockQuantity,
              reason: 'Saída Manutenção',
              referenceId: newLog.id
          };
          return { 
            ...item, 
            stockQuantity: newStockQuantity,
            stockHistory: [...(item.stockHistory || []), newHistoryEntry]
          };
        }
        return item;
      });
      tempFarmState.warehouseItems = updatedWarehouseItems;
    }

    const updatedMachines = tempFarmState.machines.map(machine => {
      if (machine.id === log.machineId) {
        const updatedMachine = { ...machine };
        
        if (log.hourMeter > machine.hourMeter) {
           const newHistoryEntry: HourMeterLog = {
            date: newLog.date,
            value: log.hourMeter,
            collaboratorId: log.collaboratorId,
            source: 'Manutenção',
            sourceId: newLog.id,
          };
          updatedMachine.hourMeter = log.hourMeter;
          updatedMachine.hourMeterHistory = [...(machine.hourMeterHistory || []), newHistoryEntry];
        }

        const updatedLastMaintenance = { ...(machine.lastMaintenance || { engineOilHour: 0, transmissionOilHour: 0, fuelFilterHour: 0, airFilterHour: 0 }) };
        
        const updateCounter = (key: keyof typeof updatedLastMaintenance) => {
            if (log.hourMeter > updatedLastMaintenance[key]) {
                updatedLastMaintenance[key] = log.hourMeter;
            }
        };

        switch (log.type) {
            case MaintenanceType.OIL_CHANGE: updateCounter('engineOilHour'); break;
            case MaintenanceType.FILTER_CHANGE: updateCounter('fuelFilterHour'); updateCounter('airFilterHour'); break;
            case MaintenanceType.OIL_AND_FILTER: updateCounter('engineOilHour'); updateCounter('fuelFilterHour'); updateCounter('airFilterHour'); break;
            case MaintenanceType.PREVENTIVE:
                updateCounter('engineOilHour');
                updateCounter('transmissionOilHour');
                updateCounter('fuelFilterHour');
                updateCounter('airFilterHour');
                break;
            case MaintenanceType.CORRECTIVE: break;
        }
        
        updatedMachine.lastMaintenance = updatedLastMaintenance;
        return updatedMachine;
      }
      return machine;
    });

    const updatedFarm = { 
        ...tempFarmState, 
        machines: updatedMachines,
        maintenanceLogs: [...tempFarmState.maintenanceLogs, newLog] 
    };
    updateAndStoreFarm(updatedFarm);
  };

  const updateMaintenanceLog = (updatedLog: MaintenanceLog) => {
    const originalLog = farm.maintenanceLogs.find(l => l.id === updatedLog.id);
    if (!originalLog) return;

    let tempFarmState = { ...farm };

    const stockChanges = new Map<string, number>();
    originalLog.partsUsed?.forEach(p => stockChanges.set(p.itemId, (stockChanges.get(p.itemId) || 0) + p.quantity));
    updatedLog.partsUsed?.forEach(p => stockChanges.set(p.itemId, (stockChanges.get(p.itemId) || 0) - p.quantity));

    tempFarmState.warehouseItems = tempFarmState.warehouseItems.map(item => {
        if (stockChanges.has(item.id)) {
            const change = stockChanges.get(item.id)!;
            if (change !== 0) {
                const newStockQuantity = item.stockQuantity + change;
                const newHistoryEntry: StockHistoryLog = {
                    date: new Date().toISOString(),
                    quantityChange: change,
                    newStockLevel: newStockQuantity,
                    reason: 'Ajuste Edição Manutenção',
                    referenceId: updatedLog.id,
                };
                return {
                    ...item,
                    stockQuantity: newStockQuantity,
                    stockHistory: [...(item.stockHistory || []), newHistoryEntry],
                };
            }
        }
        return item;
    });

    tempFarmState.maintenanceLogs = farm.maintenanceLogs.map(log => log.id === updatedLog.id ? updatedLog : log);
    
    const affectedMachineIds = new Set<string>([originalLog.machineId, updatedLog.machineId]);

    tempFarmState.machines = tempFarmState.machines.map(machine => {
        if (affectedMachineIds.has(machine.id)) {
            const allLogsForHistory = [
                ...tempFarmState.fuelLogs.filter(l => l.machineId === machine.id).map(l => ({ date: l.date, value: l.odometer, collaboratorId: l.collaboratorId, source: 'Abastecimento', sourceId: l.id }) as HourMeterLog),
                ...tempFarmState.maintenanceLogs.filter(l => l.machineId === machine.id).map(l => ({ date: l.date, value: l.hourMeter, collaboratorId: l.collaboratorId, source: 'Manutenção', sourceId: l.id }) as HourMeterLog)
            ];

            allLogsForHistory.sort((a, b) => {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateDiff !== 0) return dateDiff;
                return b.value - a.value;
            });
            const latestHourMeter = allLogsForHistory.length > 0 ? allLogsForHistory[0].value : 0;
            
            const machineMaintLogs = tempFarmState.maintenanceLogs.filter(l => l.machineId === machine.id);
            const newLastMaintenance = { engineOilHour: 0, transmissionOilHour: 0, fuelFilterHour: 0, airFilterHour: 0 };
            
            machineMaintLogs.forEach(log => {
                const updateCounter = (key: keyof typeof newLastMaintenance) => {
                    if (log.hourMeter > newLastMaintenance[key]) {
                        newLastMaintenance[key] = log.hourMeter;
                    }
                };
                switch (log.type) {
                    case MaintenanceType.OIL_CHANGE: updateCounter('engineOilHour'); break;
                    case MaintenanceType.FILTER_CHANGE: updateCounter('fuelFilterHour'); updateCounter('airFilterHour'); break;
                    case MaintenanceType.OIL_AND_FILTER: updateCounter('engineOilHour'); updateCounter('fuelFilterHour'); updateCounter('airFilterHour'); break;
                    case MaintenanceType.PREVENTIVE:
                        updateCounter('engineOilHour');
                        updateCounter('transmissionOilHour');
                        updateCounter('fuelFilterHour');
                        updateCounter('airFilterHour');
                        break;
                    default: break;
                }
            });

            return {
                ...machine,
                hourMeter: latestHourMeter,
                hourMeterHistory: allLogsForHistory,
                lastMaintenance: newLastMaintenance,
            };
        }
        return machine;
    });

    updateAndStoreFarm(tempFarmState);
  };

  const updateFuelPrices = (prices: FuelPrice[]) => {
    const updatedFarm = { ...farm, fuelPrices: prices };
    updateAndStoreFarm(updatedFarm);
  };

  const addWarehouseItem = (item: Omit<WarehouseItem, 'id' | 'createdAt' | 'stockHistory'>) => {
    const newItem: WarehouseItem = {
        ...item,
        id: `item_${Date.now()}`,
        createdAt: new Date().toISOString(),
        stockHistory: [{
            date: new Date().toISOString(),
            quantityChange: item.stockQuantity,
            newStockLevel: item.stockQuantity,
            reason: 'Entrada Inicial',
        }]
    };
    updateAndStoreFarm({ ...farm, warehouseItems: [...farm.warehouseItems, newItem] });
  };

  const updateWarehouseItem = (updatedItem: WarehouseItem) => {
    const updatedItems = farm.warehouseItems.map(item => {
        if (item.id === updatedItem.id) {
            const originalItem = farm.warehouseItems.find(i => i.id === updatedItem.id);
            if (!originalItem) return updatedItem;

            const quantityChange = updatedItem.stockQuantity - originalItem.stockQuantity;
            
            let updatedHistory = item.stockHistory || [];
            if (quantityChange !== 0) {
                const newHistoryEntry: StockHistoryLog = {
                    date: new Date().toISOString(),
                    quantityChange: quantityChange,
                    newStockLevel: updatedItem.stockQuantity,
                    reason: 'Ajuste Manual de Estoque',
                };
                updatedHistory = [...updatedHistory, newHistoryEntry];
            }

            return { ...updatedItem, stockHistory: updatedHistory };
        }
        return item;
    });
    updateAndStoreFarm({ ...farm, warehouseItems: updatedItems });
  };

  const deleteWarehouseItem = (itemId: string) => {
    const updatedItems = farm.warehouseItems.filter(item => item.id !== itemId);
    updateAndStoreFarm({ ...farm, warehouseItems: updatedItems });
  };

  const addStockToWarehouseItem = (itemId: string, quantityToAdd: number, invoiceNumber: string) => {
    const updatedItems = farm.warehouseItems.map(item => {
        if (item.id === itemId) {
            const newStockLevel = item.stockQuantity + quantityToAdd;
            const newHistoryEntry: StockHistoryLog = {
                date: new Date().toISOString(),
                quantityChange: quantityToAdd,
                newStockLevel: newStockLevel,
                reason: 'Entrada via Nota Fiscal',
                invoiceNumber: invoiceNumber,
            };
            const updatedHistory = [...(item.stockHistory || []), newHistoryEntry];
            return { ...item, stockQuantity: newStockLevel, stockHistory: updatedHistory };
        }
        return item;
    });
    updateAndStoreFarm({ ...farm, warehouseItems: updatedItems });
  };
  
  const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id' | 'code' | 'status' | 'requestDate'>) => {
    const lastOrderCode = farm.purchaseOrders
        .map(o => parseInt(o.code.replace('PED-', ''), 10))
        .reduce((max, current) => Math.max(max, current), 0);
    
    const newCode = `PED-${String(lastOrderCode + 1).padStart(6, '0')}`;

    const newOrder: PurchaseOrder = {
        ...order,
        id: `po_${Date.now()}`,
        code: newCode,
        status: PurchaseOrderStatus.PENDING,
        requestDate: new Date().toISOString(),
    };
    updateAndStoreFarm({ ...farm, purchaseOrders: [...farm.purchaseOrders, newOrder] });
  };
  
  const updatePurchaseOrderStatus = (orderId: string, status: PurchaseOrderStatus, responsibleId: string) => {
    const now = new Date().toISOString();

    setFarm(currentFarm => {
        const orderToUpdate = currentFarm.purchaseOrders.find(o => o.id === orderId);
        if (!orderToUpdate) {
            console.error("Purchase order not found!");
            return currentFarm;
        }

        let updatedWarehouseItems = currentFarm.warehouseItems;

        if (status === PurchaseOrderStatus.FULFILLED && orderToUpdate.status !== PurchaseOrderStatus.FULFILLED) {
            const itemsToFulfill = new Map<string, number>();
            orderToUpdate.items.forEach(item => itemsToFulfill.set(item.itemId, item.quantity));

            updatedWarehouseItems = currentFarm.warehouseItems.map(whItem => {
                if (itemsToFulfill.has(whItem.id)) {
                    const quantityToAdd = itemsToFulfill.get(whItem.id)!;
                    const newStockLevel = whItem.stockQuantity + quantityToAdd;
                    const newHistoryEntry: StockHistoryLog = {
                        date: now,
                        quantityChange: quantityToAdd,
                        newStockLevel: newStockLevel,
                        reason: `Entrada Compra ${orderToUpdate.code}`,
                        referenceId: orderToUpdate.id,
                    };
                    return {
                        ...whItem,
                        stockQuantity: newStockLevel,
                        stockHistory: [...(whItem.stockHistory || []), newHistoryEntry],
                    };
                }
                return whItem;
            });
        }

        const updatedOrders = currentFarm.purchaseOrders.map(order => {
            if (order.id === orderId) {
                const updatedOrder = { ...order, status };
                if (status === PurchaseOrderStatus.APPROVED) {
                    updatedOrder.approvalDate = now;
                    updatedOrder.approvedById = responsibleId;
                } else if (status === PurchaseOrderStatus.FULFILLED) {
                    if (!order.approvalDate) {
                        updatedOrder.approvalDate = now;
                        updatedOrder.approvedById = responsibleId;
                    }
                    updatedOrder.fulfilledDate = now;
                    updatedOrder.fulfilledById = responsibleId;
                }
                return updatedOrder;
            }
            return order;
        });

        const newFarmState = {
            ...currentFarm,
            purchaseOrders: updatedOrders,
            warehouseItems: updatedWarehouseItems,
        };

        localStorage.setItem('agrosync_farm', JSON.stringify(newFarmState));
        return newFarmState;
    });
};

 const cancelPurchaseOrder = (orderId: string, responsibleId: string, reason?: string) => {
    const now = new Date().toISOString();
    const updatedOrders = farm.purchaseOrders.map(order => {
        if (order.id === orderId) {
            return {
                ...order,
                status: PurchaseOrderStatus.CANCELLED,
                cancellationDate: now,
                cancelledById: responsibleId,
                cancellationReason: reason,
            };
        }
        return order;
    });
    updateAndStoreFarm({ ...farm, purchaseOrders: updatedOrders });
  };


  const getMachineById = (id: string) => farm.machines.find(m => m.id === id);
  const getCollaboratorById = (id: string) => farm.collaborators.find(c => c.id === id);
  const getWarehouseItemById = (id: string) => farm.warehouseItems.find(i => i.id === id);

  const value = { 
    farm, 
    loading,
    setFarmName,
    addMachine,
    updateMachine,
    deleteMachine,
    addCollaborator,
    addFuelLog,
    updateFuelLog,
    addMaintenanceLog,
    updateMaintenanceLog,
    updateFuelPrices,
    addWarehouseItem,
    updateWarehouseItem,
    deleteWarehouseItem,
    addStockToWarehouseItem,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    cancelPurchaseOrder,
    getMachineById,
    getCollaboratorById,
    getWarehouseItemById
  };

  return <FarmDataContext.Provider value={value}>{children}</FarmDataContext.Provider>;
};

export const useFarmData = (): FarmDataContextType => {
  const context = useContext(FarmDataContext);
  if (context === undefined) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return context;
};