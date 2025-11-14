import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import { useFarmData } from '../context/FarmDataContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PurchaseOrderStatus } from '../types';

// Helper to get the start and end of the current month
const getMonthDateRange = (date = new Date()) => {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

// Helper to calculate percentage change
const calculatePercentageChange = (oldValue: number, newValue: number): number | null => {
    if (oldValue === 0 && newValue === 0) return 0;
    if (oldValue === 0) return null; // Infinite change
    return ((newValue - oldValue) / oldValue) * 100;
};

const PIE_CHART_COLORS = { 'Abastecimento': '#3B82F6', 'Manutenção': '#F97316', 'Compras': '#10B981' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="label font-bold">{`${label}`}</p>
        {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
                {`${pld.name}: ${pld.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard: React.FC<{ title: string; valueA: number; valueB?: number; isComparing: boolean; }> = ({ title, valueA, valueB, isComparing }) => {
    const change = isComparing && typeof valueB === 'number' ? calculatePercentageChange(valueB, valueA) : null;
    
    return (
        <Card className="text-center">
            <p className="text-sm font-medium text-agro-gray-500 mb-1">{title}</p>
            <p className="text-xl font-bold text-agro-gray-800">{valueA.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            {isComparing && (
                <>
                    <p className="text-xs text-agro-gray-500">vs. {valueB?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    {change !== null && (
                        <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${change >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                        </span>
                    )}
                </>
            )}
        </Card>
    );
};


// Main Component
const Reports: React.FC = () => {
    const { farm, loading, getWarehouseItemById } = useFarmData();

    // --- STATE FOR FILTERS ---
    const [periodA, setPeriodA] = useState(getMonthDateRange());
    const [periodB, setPeriodB] = useState({ start: '', end: '' });
    const [isComparing, setIsComparing] = useState(false);
    const [selectedCostTypes, setSelectedCostTypes] = useState<string[]>(['Abastecimento', 'Manutenção', 'Compras']);
    const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
    
    const allMachineOptions = useMemo(() => farm.machines.map(m => ({ id: m.id, name: m.name })), [farm.machines]);

    useEffect(() => {
        if (isComparing && !periodB.start) {
            const startA = new Date(periodA.start + 'T00:00:00Z');
            const prevMonthDate = new Date(startA.getFullYear(), startA.getMonth() -1, 15);
            setPeriodB(getMonthDateRange(prevMonthDate));
        }
    }, [isComparing, periodA.start]);

    // --- DATA PROCESSING LOGIC ---
    const processedData = useMemo(() => {
        const calculateMetricsForPeriod = (start: string, end: string) => {
            if (!start || !end) {
                return { totalCost: 0, fuelCost: 0, maintenanceCost: 0, purchaseCost: 0, costsByMachine: {}, costTrend: [] };
            }
            const startDate = new Date(start + 'T00:00:00Z');
            const endDate = new Date(end + 'T23:59:59Z');
            const machineIdsSet = new Set(selectedMachineIds.length > 0 ? selectedMachineIds : allMachineOptions.map(m => m.id));
            let allLogs: { date: Date; cost: number; type: string; machineId: string }[] = [];
            
            if (selectedCostTypes.includes('Abastecimento')) {
                farm.fuelLogs.forEach(log => {
                    const logDate = new Date(log.date);
                    if (!isNaN(logDate.getTime()) && logDate >= startDate && logDate <= endDate && machineIdsSet.has(log.machineId)) allLogs.push({ date: logDate, cost: log.totalValue, type: 'Abastecimento', machineId: log.machineId });
                });
            }
            if (selectedCostTypes.includes('Manutenção')) {
                 farm.maintenanceLogs.forEach(log => {
                    const logDate = new Date(log.date);
                    if (!isNaN(logDate.getTime()) && logDate >= startDate && logDate <= endDate && machineIdsSet.has(log.machineId)) allLogs.push({ date: logDate, cost: log.totalCost, type: 'Manutenção', machineId: log.machineId });
                });
            }
            if (selectedCostTypes.includes('Compras')) {
                farm.purchaseOrders.forEach(order => {
                    if (order.status === PurchaseOrderStatus.FULFILLED && order.fulfilledDate) {
                        const fulfilledDate = new Date(order.fulfilledDate);
                        if (!isNaN(fulfilledDate.getTime()) && fulfilledDate >= startDate && fulfilledDate <= endDate) {
                             const orderCost = order.items.reduce((acc, item) => acc + ((getWarehouseItemById(item.itemId)?.unitValue || 0) * item.quantity), 0);
                            allLogs.push({ date: fulfilledDate, cost: orderCost, type: 'Compras', machineId: 'general' });
                        }
                    }
                });
            }
            allLogs.sort((a, b) => a.date.getTime() - b.date.getTime());
            let cumulativeCost = 0;
            const costTrend = allLogs.map(log => ({ date: log.date.toISOString().split('T')[0], cost: cumulativeCost += log.cost }));
            const metrics = allLogs.reduce((acc, log) => {
                acc.totalCost += log.cost;
                if (log.type === 'Abastecimento') acc.fuelCost += log.cost;
                if (log.type === 'Manutenção') acc.maintenanceCost += log.cost;
                if (log.type === 'Compras') acc.purchaseCost += log.cost;
                if (log.machineId !== 'general') acc.costsByMachine[log.machineId] = (acc.costsByMachine[log.machineId] || 0) + log.cost;
                return acc;
            }, { totalCost: 0, fuelCost: 0, maintenanceCost: 0, purchaseCost: 0, costsByMachine: {} as Record<string, number> });
            return { ...metrics, costTrend };
        };

        const dataA = calculateMetricsForPeriod(periodA.start, periodA.end);
        const dataB = isComparing ? calculateMetricsForPeriod(periodB.start, periodB.end) : null;
        
        const pieDataA = Object.entries({ 'Abastecimento': dataA.fuelCost, 'Manutenção': dataA.maintenanceCost, 'Compras': dataA.purchaseCost }).map(([k, v]) => ({ name: k, value: v })).filter(d => d.value > 0);
        const pieDataB = dataB ? Object.entries({ 'Abastecimento': dataB.fuelCost, 'Manutenção': dataB.maintenanceCost, 'Compras': dataB.purchaseCost }).map(([k, v]) => ({ name: k, value: v })).filter(d => d.value > 0) : [];
        
        const allMachineIdsInvolved = new Set([...Object.keys(dataA.costsByMachine), ...(dataB ? Object.keys(dataB.costsByMachine) : [])]);
        const machineCostChartData = Array.from(allMachineIdsInvolved).map(id => ({
            name: farm.machines.find(m => m.id === id)?.name || 'Desconhecida',
            'Período A': dataA.costsByMachine[id] || 0,
            'Período B': dataB?.costsByMachine[id] || 0,
        })).sort((a,b) => (b['Período A'] + b['Período B']) - (a['Período A'] + a['Período B'])).slice(0, 10);

        const normalizeTrend = (trend: {date: string, cost: number}[], startDateStr: string) => {
            if (!trend.length || !startDateStr) return [];
            const start = new Date(startDateStr+'T00:00:00Z').getTime();
            return trend.map(d => {
               const day = Math.round((new Date(d.date+'T00:00:00Z').getTime() - start) / (1000 * 3600 * 24)) + 1;
               return { day, cost: d.cost };
            });
        };
        const trendA = normalizeTrend(dataA.costTrend, periodA.start);
        const trendB = dataB ? normalizeTrend(dataB.costTrend, periodB.start) : [];
        const maxDay = Math.max(trendA[trendA.length - 1]?.day || 0, trendB[trendB.length - 1]?.day || 0);
        let lastCostA = 0, lastCostB = 0;
        const combinedTrend = Array.from({length: maxDay}, (_, i) => {
            const day = i + 1;
            const pointA = trendA.find(p => p.day === day);
            const pointB = trendB.find(p => p.day === day);
            if (pointA) lastCostA = pointA.cost;
            if (pointB) lastCostB = pointB.cost;
            return { name: `Dia ${day}`, 'Período A': lastCostA, ...(isComparing && { 'Período B': lastCostB }) };
        });

        return { dataA, dataB, pieDataA, pieDataB, machineCostChartData, trendData: combinedTrend };

    }, [farm, getWarehouseItemById, periodA, periodB, isComparing, selectedCostTypes, selectedMachineIds, allMachineOptions]);

    const handleCostTypeChange = (type: string) => setSelectedCostTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const handleMachineSelectionChange = (id: string) => setSelectedMachineIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

    if (loading) return <div>Carregando relatórios...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-agro-gray-800">Relatórios e Análises</h2>
            
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Period A */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-2 border-r pr-4">
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Período A (Início)</label>
                            <input type="date" value={periodA.start} onChange={e => setPeriodA(p => ({...p, start: e.target.value}))} className="w-full p-2 mt-1 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Período A (Fim)</label>
                            <input type="date" value={periodA.end} onChange={e => setPeriodA(p => ({...p, end: e.target.value}))} className="w-full p-2 mt-1 border border-gray-300 rounded-md"/>
                        </div>
                    </div>

                    {/* Period B */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                         <div className="col-span-2 flex items-center mb-2">
                            <input type="checkbox" id="compare" checked={isComparing} onChange={e => setIsComparing(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-agro-green focus:ring-agro-green"/>
                            <label htmlFor="compare" className="ml-2 block text-sm font-bold text-gray-700">Comparar Períodos</label>
                        </div>
                        {isComparing && <>
                            <div>
                                <label className="text-sm font-bold text-gray-600 block">Período B (Início)</label>
                                <input type="date" value={periodB.start} onChange={e => setPeriodB(p => ({...p, start: e.target.value}))} className="w-full p-2 mt-1 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-600 block">Período B (Fim)</label>
                                <input type="date" value={periodB.end} onChange={e => setPeriodB(p => ({...p, end: e.target.value}))} className="w-full p-2 mt-1 border border-gray-300 rounded-md"/>
                            </div>
                        </>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t">
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-2">Tipos de Custo</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {Object.keys(PIE_CHART_COLORS).map(type => (
                                <div key={type} className="flex items-center">
                                    <input type="checkbox" id={`type-${type}`} checked={selectedCostTypes.includes(type)} onChange={() => handleCostTypeChange(type)} className="h-4 w-4 rounded"/>
                                    <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700">{type}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-600 block">Máquinas</label>
                        <select multiple value={selectedMachineIds} onChange={e => setSelectedMachineIds(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 mt-1 border border-gray-300 rounded-md h-24">
                            {allMachineOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <button onClick={() => setSelectedMachineIds([])} className="text-xs text-blue-600 hover:underline mt-1">Limpar seleção</button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Custo Total" valueA={processedData.dataA.totalCost} valueB={processedData.dataB?.totalCost} isComparing={isComparing}/>
                <StatCard title="Abastecimentos" valueA={processedData.dataA.fuelCost} valueB={processedData.dataB?.fuelCost} isComparing={isComparing}/>
                <StatCard title="Manutenções" valueA={processedData.dataA.maintenanceCost} valueB={processedData.dataB?.maintenanceCost} isComparing={isComparing}/>
                <StatCard title="Compras" valueA={processedData.dataA.purchaseCost} valueB={processedData.dataB?.purchaseCost} isComparing={isComparing}/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Custos por Máquina</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={processedData.machineCostChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={val => `R$${val/1000}k`}/>
                            <Tooltip content={<CustomTooltip />}/>
                            <Legend />
                            <Bar dataKey="Período A" fill="#8884d8" />
                            {isComparing && <Bar dataKey="Período B" fill="#82ca9d" />}
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Tendência de Custos Acumulados</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={processedData.trendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={val => `R$${val/1000}k`}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="Período A" stroke="#8884d8" strokeWidth={2} dot={false} />
                            {isComparing && <Line type="monotone" dataKey="Período B" stroke="#82ca9d" strokeWidth={2} dot={false}/>}
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <Card>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Distribuição de Custos (Período A)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={processedData.pieDataA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                     {processedData.pieDataA.map((entry) => <Cell key={entry.name} fill={PIE_CHART_COLORS[entry.name as keyof typeof PIE_CHART_COLORS]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                     {isComparing && (
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Distribuição de Custos (Período B)</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                     <Pie data={processedData.pieDataB} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                         {processedData.pieDataB.map((entry) => <Cell key={entry.name} fill={PIE_CHART_COLORS[entry.name as keyof typeof PIE_CHART_COLORS]} />)}
                                     </Pie>
                                     <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                     )}
                </div>
            </Card>
        </div>
    );
};

export default Reports;