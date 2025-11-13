import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Farm, Machine, Collaborator, FuelLog, MaintenanceLog, FuelPrice, HourMeterLog, MaintenanceType, WarehouseItem } from '../types';
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
  updateFuelPrices: (prices: FuelPrice[]) => void;
  addWarehouseItem: (item: Omit<WarehouseItem, 'id' | 'createdAt'>) => void;
  updateWarehouseItem: (item: WarehouseItem) => void;
  deleteWarehouseItem: (itemId: string) => void;
  getMachineById: (id: string) => Machine | undefined;
  getCollaboratorById: (id: string) => Collaborator | undefined;
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
    
    // Recalculate the machine's current hour meter based on the latest entry (fueling or maintenance)
    const machineToUpdate = farm.machines.find(m => m.id === updatedLog.machineId);
    if (machineToUpdate) {
        const allLogsForMachine = [
            ...updatedLogs.filter(l => l.machineId === updatedLog.machineId).map(l => ({ date: l.date, value: l.odometer })),
            ...farm.maintenanceLogs.filter(l => l.machineId === updatedLog.machineId).map(l => ({ date: l.date, value: l.hourMeter }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const latestHourMeter = allLogsForMachine.length > 0 ? allLogsForMachine[0].value : 0;

        const updatedMachines = farm.machines.map(m => {
            if (m.id === updatedLog.machineId) {
                // Also update the hour meter history
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

    // 1. Update warehouse stock
    if (log.partsUsed && log.partsUsed.length > 0) {
      const updatedWarehouseItems = tempFarmState.warehouseItems.map(item => {
        const partUsed = log.partsUsed?.find(p => p.itemId === item.id);
        if (partUsed) {
          return { ...item, stockQuantity: item.stockQuantity - partUsed.quantity };
        }
        return item;
      });
      tempFarmState.warehouseItems = updatedWarehouseItems;
    }

    // 2. Update machine hour meter and maintenance history
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

    // 3. Add the new maintenance log
    const updatedFarm = { 
        ...tempFarmState, 
        machines: updatedMachines,
        maintenanceLogs: [...tempFarmState.maintenanceLogs, newLog] 
    };
    updateAndStoreFarm(updatedFarm);
  };

  const updateFuelPrices = (prices: FuelPrice[]) => {
    const updatedFarm = { ...farm, fuelPrices: prices };
    updateAndStoreFarm(updatedFarm);
  };

  const addWarehouseItem = (item: Omit<WarehouseItem, 'id' | 'createdAt'>) => {
    const newItem: WarehouseItem = {
        ...item,
        id: `item_${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    updateAndStoreFarm({ ...farm, warehouseItems: [...farm.warehouseItems, newItem] });
  };

  const updateWarehouseItem = (updatedItem: WarehouseItem) => {
    const updatedItems = farm.warehouseItems.map(item => item.id === updatedItem.id ? updatedItem : item);
    updateAndStoreFarm({ ...farm, warehouseItems: updatedItems });
  };

  const deleteWarehouseItem = (itemId: string) => {
    const updatedItems = farm.warehouseItems.filter(item => item.id !== itemId);
    updateAndStoreFarm({ ...farm, warehouseItems: updatedItems });
  };


  const getMachineById = (id: string) => farm.machines.find(m => m.id === id);
  const getCollaboratorById = (id: string) => farm.collaborators.find(c => c.id === id);


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
    updateFuelPrices,
    addWarehouseItem,
    updateWarehouseItem,
    deleteWarehouseItem,
    getMachineById,
    getCollaboratorById
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
