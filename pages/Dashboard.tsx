import React, { useMemo } from 'react';
import { useFarmData } from '../context/FarmDataContext';
import Card from '../components/ui/Card';
import { FuelIcon, WrenchIcon, AlertTriangleIcon, ShoppingCartIcon } from '../components/ui/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Machine, MachineStatus, MaintenanceConfig, LastMaintenance, PurchaseOrderStatus, PurchaseOrder } from '../types';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <Card className="flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-agro-gray-500">{title}</p>
            <p className="text-3xl font-bold text-agro-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
    </Card>
);

type MaintenanceAlertInfo = {
    machineId: string;
    machineName: string;
    type: string;
    hoursRemaining: number;
    nextDueDate: number;
    estimatedDueDate?: Date;
}

const MaintenanceAlerts: React.FC<{ machines: Machine[] }> = ({ machines }) => {
    const alertThreshold = 50; // Show alert if maintenance is due in 50 hours or less

    const alerts = useMemo(() => {
        const generatedAlerts: MaintenanceAlertInfo[] = [];

        machines.forEach(machine => {
            if (!machine.maintenanceConfig || !machine.lastMaintenance || machine.status === MachineStatus.INACTIVE) {
                return;
            }

            // Calculate average daily usage for this machine
            let averageDailyUsage = 4; // Default usage in hours/day for active machines
            const history = machine.hourMeterHistory;
            if (history && history.length >= 2) {
                const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const firstEntry = sortedHistory[0];
                const lastEntry = sortedHistory[sortedHistory.length - 1];

                const deltaHours = lastEntry.value - firstEntry.value;
                const deltaDays = (new Date(lastEntry.date).getTime() - new Date(firstEntry.date).getTime()) / (1000 * 3600 * 24);

                if (deltaDays > 1 && deltaHours > 0) { // require at least 1 day of history to be meaningful
                    averageDailyUsage = deltaHours / deltaDays;
                }
            }


            const { maintenanceConfig, lastMaintenance, hourMeter } = machine;

            const maintenanceTypes: { key: keyof MaintenanceConfig; name: string }[] = [
                { key: 'engineOilHours', name: 'Troca de Óleo do Motor' },
                { key: 'transmissionOilHours', name: 'Troca de Óleo da Transmissão' },
                { key: 'fuelFilterHours', name: 'Troca do Filtro de Combustível' },
                { key: 'airFilterHours', name: 'Troca do Filtro de Ar' },
            ];

            maintenanceTypes.forEach(maint => {
                const interval = maintenanceConfig[maint.key];
                const lastHourKey = maint.key.replace('Hours', 'Hour') as keyof LastMaintenance;
                const lastHour = lastMaintenance[lastHourKey];
                
                if (interval > 0 && typeof lastHour === 'number') {
                    const nextDueDate = lastHour + interval;
                    const hoursRemaining = nextDueDate - hourMeter;

                    if (hoursRemaining <= alertThreshold) {
                        let estimatedDueDate: Date | undefined = undefined;
                        if (averageDailyUsage > 0 && hoursRemaining >= 0) {
                            const daysRemaining = hoursRemaining / averageDailyUsage;
                            const dueDate = new Date();
                            dueDate.setDate(dueDate.getDate() + Math.ceil(daysRemaining));
                            estimatedDueDate = dueDate;
                        }
                        
                        generatedAlerts.push({
                            machineId: machine.id,
                            machineName: machine.name,
                            type: maint.name,
                            hoursRemaining,
                            nextDueDate,
                            estimatedDueDate,
                        });
                    }
                }
            });
        });
        return generatedAlerts.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    }, [machines]);
    

    if (alerts.length === 0) {
        return (
            <Card>
                <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Alertas de Manutenção</h3>
                <p className="text-agro-gray-500">Nenhuma manutenção próxima.</p>
            </Card>
        );
    }

    return (
        <Card>
            <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Alertas de Manutenção</h3>
            <ul className="space-y-3">
                {alerts.map((alert, index) => {
                    const isOverdue = alert.hoursRemaining < 0;
                    return (
                        <li key={`${alert.machineId}-${index}`} className={`flex items-start p-3 rounded-lg ${isOverdue ? 'bg-red-100' : 'bg-yellow-100'}`}>
                            <AlertTriangleIcon className={`w-5 h-5 mr-3 flex-shrink-0 mt-1 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
                            <div>
                                <p className={`font-semibold ${isOverdue ? 'text-red-800' : 'text-yellow-800'}`}>{alert.machineName}</p>
                                <p className={`text-sm ${isOverdue ? 'text-red-700' : 'text-yellow-700'}`}>{alert.type}</p>
                                {isOverdue ? (
                                    <p className="text-sm font-bold text-red-700">Manutenção <strong>ATRASADA</strong> em {Math.abs(Math.round(alert.hoursRemaining))}h.</p>
                                ) : (
                                     <p className={`text-sm ${isOverdue ? 'text-red-700' : 'text-yellow-700'}`}>Faltam aprox. <strong>{Math.round(alert.hoursRemaining)}h</strong> (em {alert.nextDueDate.toLocaleString('pt-BR')}h).</p>
                                )}
                                {alert.estimatedDueDate && !isOverdue && (
                                    <p className={`text-sm ${isOverdue ? 'text-red-700' : 'text-yellow-700'}`}>
                                        Data prevista: <strong>{alert.estimatedDueDate.toLocaleDateString('pt-BR')}</strong>
                                    </p>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </Card>
    );
};

const PIE_CHART_COLORS = ['#3B82F6', '#F97316', '#10B981']; // Blue for Fuel, Orange for Maint, Green for Purchases

const Dashboard: React.FC = () => {
    const { farm, loading, getWarehouseItemById } = useFarmData();

    const { totalFuelCost, totalMaintenanceCost, totalPurchaseCost, fuelMonthCost, purchaseMonthCost, chartData, pieData } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const calculateOrderCost = (order: PurchaseOrder): number => {
            return order.items.reduce((orderTotal, item) => {
                const itemInfo = getWarehouseItemById(item.itemId);
                return orderTotal + ((itemInfo?.unitValue || 0) * item.quantity);
            }, 0);
        };

        const totalFuelCost = farm.fuelLogs.reduce((acc, log) => acc + log.totalValue, 0);
        const totalMaintenanceCost = farm.maintenanceLogs.reduce((acc, log) => acc + log.totalCost, 0);
        
        const fuelMonthCost = farm.fuelLogs
            .filter(log => {
                const logDate = new Date(log.date);
                return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
            })
            .reduce((acc, log) => acc + log.totalValue, 0);
        
        const fulfilledOrders = farm.purchaseOrders.filter(o => o.status === PurchaseOrderStatus.FULFILLED);

        const totalPurchaseCost = fulfilledOrders.reduce((total, order) => total + calculateOrderCost(order), 0);
        
        const purchaseMonthCost = fulfilledOrders
            .filter(order => {
                if (!order.fulfilledDate) return false;
                const fulfilledDate = new Date(order.fulfilledDate);
                return fulfilledDate.getMonth() === currentMonth && fulfilledDate.getFullYear() === currentYear;
            })
            .reduce((total, order) => total + calculateOrderCost(order), 0);

        const chartData = farm.machines.map(machine => {
            const fuelCost = farm.fuelLogs
                .filter(log => log.machineId === machine.id)
                .reduce((sum, log) => sum + log.totalValue, 0);
            const maintenanceCost = farm.maintenanceLogs
                .filter(log => log.machineId === machine.id)
                .reduce((sum, log) => sum + log.totalCost, 0);
            return {
                name: machine.name,
                Abastecimento: fuelCost,
                Manutenção: maintenanceCost
            };
        });

        const pieData = [
            { name: 'Abastecimento', value: totalFuelCost },
            { name: 'Manutenção', value: totalMaintenanceCost },
            { name: 'Compras', value: totalPurchaseCost },
        ].filter(d => d.value > 0);

        return { totalFuelCost, totalMaintenanceCost, totalPurchaseCost, fuelMonthCost, purchaseMonthCost, chartData, pieData };

    }, [farm, getWarehouseItemById]);


    if (loading) return <div>Carregando dashboard...</div>

    const totalCost = totalFuelCost + totalMaintenanceCost + totalPurchaseCost;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-agro-gray-800">Dashboard Operacional</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Abastecimentos (Mês)" value={fuelMonthCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<FuelIcon className="text-blue-800" />} color="bg-blue-200" />
                <StatCard title="Compras (Mês)" value={purchaseMonthCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<ShoppingCartIcon className="text-emerald-800" />} color="bg-emerald-200" />
                <StatCard title="Manutenções (Geral)" value={totalMaintenanceCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<WrenchIcon className="text-orange-800" />} color="bg-orange-200" />
                <StatCard title="Custo Total (Geral)" value={totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<span className="text-agro-green font-bold text-xl">R$</span>} color="bg-agro-light-green" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                 <Card>
                    <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Custos por Máquina</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/>
                                <Legend />
                                <Bar dataKey="Abastecimento" fill="#3B82F6" />
                                <Bar dataKey="Manutenção" fill="#F97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Distribuição de Custos Totais</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            
            <MaintenanceAlerts machines={farm.machines} />

        </div>
    );
};

export default Dashboard;