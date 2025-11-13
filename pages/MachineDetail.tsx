import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFarmData } from '../context/FarmDataContext';
import Card from '../components/ui/Card';
import { Machine, MachineStatus } from '../types';
import { ArrowLeftIcon, EditIcon, TrashIcon, FuelIcon, WrenchIcon, ChartLineIcon } from '../components/ui/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const getStatusBadge = (status: MachineStatus) => {
    switch(status) {
      case MachineStatus.ACTIVE:
        return <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-200 rounded-full">🟢 Ativo</span>;
      case MachineStatus.INACTIVE:
        return <span className="px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-200 rounded-full">🔴 Inativo</span>;
      case MachineStatus.MAINTENANCE:
        return <span className="px-3 py-1 text-sm font-semibold text-yellow-800 bg-yellow-200 rounded-full">🟠 Em Manutenção</span>;
      default:
        return null;
    }
};

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
    const percent = Math.min(Math.max(value, 0), 100);
    let colorClass = 'bg-green-500';
    if (percent > 95) {
        colorClass = 'bg-red-500';
    } else if (percent > 80) {
        colorClass = 'bg-yellow-500';
    }

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percent}%` }}></div>
        </div>
    );
};

const MaintenancePlanStatus: React.FC<{ machine: Machine }> = ({ machine }) => {
    if (!machine.maintenanceConfig || !machine.lastMaintenance) {
        return (
            <p className="text-gray-500">Plano de manutenção não configurado para esta máquina.</p>
        );
    }

    const { maintenanceConfig, lastMaintenance, hourMeter } = machine;

    const maintenanceItems = [
        { name: 'Óleo do Motor', interval: maintenanceConfig.engineOilHours, lastHour: lastMaintenance.engineOilHour },
        { name: 'Óleo da Transmissão', interval: maintenanceConfig.transmissionOilHours, lastHour: lastMaintenance.transmissionOilHour },
        { name: 'Filtro de Combustível', interval: maintenanceConfig.fuelFilterHours, lastHour: lastMaintenance.fuelFilterHour },
        { name: 'Filtro de Ar', interval: maintenanceConfig.airFilterHours, lastHour: lastMaintenance.airFilterHour },
    ];

    return (
        <div className="space-y-4">
            {maintenanceItems.filter(item => item.interval > 0 && typeof item.lastHour === 'number').map(item => {
                const hoursSinceLast = hourMeter - item.lastHour;
                const progressPercent = (hoursSinceLast / item.interval) * 100;
                const nextDueDate = item.lastHour + item.interval;
                const hoursRemaining = nextDueDate - hourMeter;

                return (
                    <div key={item.name}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <span className="font-semibold text-gray-700">{item.name}</span>
                            <span className="text-gray-500">
                                {hoursRemaining > 0
                                    ? `Próxima em ${Math.round(hoursRemaining)}h`
                                    : <span className="font-bold text-red-600">Atrasada</span>
                                }
                            </span>
                        </div>
                        <ProgressBar value={progressPercent} />
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                            <span>Última: {item.lastHour.toLocaleString('pt-BR')}h</span>
                            <span>Próxima: {nextDueDate.toLocaleString('pt-BR')}h</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const MachineDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { farm, getMachineById, deleteMachine, getCollaboratorById } = useFarmData();
    
    const machine = useMemo(() => id ? getMachineById(id) : undefined, [id, getMachineById]);
    
    const { fuelHistory, maintenanceHistory, costData, totalCosts } = useMemo(() => {
        if (!machine) return { fuelHistory: [], maintenanceHistory: [], costData: [], totalCosts: { fuel: 0, maintenance: 0, total: 0 } };

        const fuelHistory = farm.fuelLogs.filter(log => log.machineId === machine.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const maintenanceHistory = farm.maintenanceLogs.filter(log => log.machineId === machine.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalFuelCost = fuelHistory.reduce((sum, log) => sum + log.totalValue, 0);
        const totalMaintenanceCost = maintenanceHistory.reduce((sum, log) => sum + log.totalCost, 0);

        const combinedLogs = [
            ...fuelHistory.map(l => ({ date: new Date(l.date), fuel: l.totalValue, maintenance: 0 })),
            ...maintenanceHistory.map(l => ({ date: new Date(l.date), fuel: 0, maintenance: l.totalCost }))
        ];

        const monthlyCosts = combinedLogs.reduce((acc, log) => {
            const month = log.date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!acc[month]) {
                acc[month] = { name: month, Abastecimento: 0, Manutenção: 0, date: log.date };
            }
            acc[month].Abastecimento += log.fuel;
            acc[month].Manutenção += log.maintenance;
            return acc;
        }, {} as Record<string, {name: string, Abastecimento: number, Manutenção: number, date: Date}>);
        
        const costData = Object.values(monthlyCosts).sort((a,b) => a.date.getTime() - b.date.getTime());

        return { 
            fuelHistory, 
            maintenanceHistory, 
            costData, 
            totalCosts: { fuel: totalFuelCost, maintenance: totalMaintenanceCost, total: totalFuelCost + totalMaintenanceCost }
        };

    }, [machine, farm.fuelLogs, farm.maintenanceLogs]);

    const handleDelete = () => {
        if (machine && window.confirm('Tem certeza que deseja excluir esta máquina? Todos os históricos de custos associados também serão perdidos.')) {
            deleteMachine(machine.id);
            navigate('/machines');
        }
    }

    if (!machine) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-agro-gray-800">Máquina não encontrada</h2>
                <Link to="/machines" className="text-agro-green hover:underline mt-4 inline-block">Voltar para a lista</Link>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Link to="/machines" className="flex items-center text-agro-green hover:text-green-700">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Voltar para a lista
                </Link>
                <div className="flex items-center space-x-2">
                    {/* Placeholder for edit button functionality */}
                    <button className="flex items-center px-3 py-2 text-sm text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition-colors">
                        <EditIcon size={16} className="mr-1" /> Editar
                    </button>
                    <button onClick={handleDelete} className="flex items-center px-3 py-2 text-sm text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition-colors">
                        <TrashIcon size={16} className="mr-1" /> Excluir
                    </button>
                </div>
            </div>
            
            <Card>
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-agro-gray-800">{machine.name}</h2>
                        <p className="text-lg text-agro-gray-500">{machine.brandModel}</p>
                    </div>
                    {getStatusBadge(machine.status)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 border-t pt-6">
                    <div><p className="text-sm text-gray-500">Tipo</p><p className="font-semibold">{machine.type}</p></div>
                    <div><p className="text-sm text-gray-500">Ano</p><p className="font-semibold">{machine.year}</p></div>
                    <div><p className="text-sm text-gray-500">Horímetro</p><p className="font-semibold">{machine.hourMeter.toLocaleString('pt-BR')}h</p></div>
                    <div><p className="text-sm text-gray-500">Nº de Série</p><p className="font-semibold">{machine.serialNumber || 'N/A'}</p></div>
                    <div><p className="text-sm text-gray-500">Responsável</p><p className="font-semibold">{machine.currentCollaboratorId ? getCollaboratorById(machine.currentCollaboratorId)?.name : 'N/A'}</p></div>
                    <div><p className="text-sm text-gray-500">Combustível Padrão</p><p className="font-semibold">{machine.defaultFuelType || 'N/A'}</p></div>
                    {machine.notes && <div className="col-span-2"><p className="text-sm text-gray-500">Observações</p><p className="font-semibold">{machine.notes}</p></div>}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-agro-gray-800 mb-4 flex items-center"><ChartLineIcon className="mr-2 text-agro-green"/> Evolução de Custos</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={costData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/>
                                    <Legend />
                                    <Bar dataKey="Abastecimento" stackId="a" fill="#3B82F6" />
                                    <Bar dataKey="Manutenção" stackId="a" fill="#F97316" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                 </div>
                 <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Custos Acumulados</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Abastecimentos</span>
                                <span className="font-bold text-blue-600">{totalCosts.fuel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Manutenções</span>
                                <span className="font-bold text-orange-600">{totalCosts.maintenance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-bold text-gray-800">Total</span>
                                <span className="font-bold text-agro-green">{totalCosts.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-agro-gray-800 mb-4 flex items-center"><WrenchIcon className="mr-2 text-orange-500"/> Plano de Manutenção</h3>
                        <MaintenancePlanStatus machine={machine} />
                    </Card>
                 </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-agro-gray-800 mb-4 flex items-center"><FuelIcon className="mr-2 text-blue-500"/> Histórico de Abastecimentos</h3>
                    <div className="overflow-y-auto h-64">
                        <ul className="divide-y">
                            {fuelHistory.map(log => (
                                <li key={log.id} className="py-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{new Date(log.date).toLocaleDateString('pt-BR')} - {log.quantity}L</p>
                                            <p className="text-sm text-gray-500">Responsável: {getCollaboratorById(log.collaboratorId)?.name || 'N/A'}</p>
                                        </div>
                                        <p className="font-bold text-gray-700">{log.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-semibold text-agro-gray-800 mb-4 flex items-center"><WrenchIcon className="mr-2 text-orange-500"/> Histórico de Manutenções</h3>
                     <div className="overflow-y-auto h-64">
                        <ul className="divide-y">
                            {maintenanceHistory.map(log => (
                                <li key={log.id} className="py-3">
                                    <div className="flex justify-between items-center gap-4 flex-wrap">
                                        <div>
                                            <p className="font-semibold">{new Date(log.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - <span className="font-normal">{log.type}</span></p>
                                            <p className="text-sm text-gray-500">Horímetro: {log.hourMeter.toLocaleString('pt-BR')}h</p>
                                        </div>
                                        <div className="flex items-center space-x-4 flex-shrink-0">
                                            <p className="font-bold text-gray-700">{log.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            <Link to={`/maintenance/${log.id}`} className="px-4 py-2 text-sm text-white bg-agro-green rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap">
                                                Visualizar Detalhes
                                            </Link>
                                        </div>
                                    </div>
                                    {log.notes && <p className="text-sm text-gray-600 mt-1 italic truncate">"{log.notes}"</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            </div>

            <Card>
                <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">
                    Histórico de Atualizações do Horímetro
                </h3>
                <div className="overflow-y-auto max-h-72">
                    <ul className="divide-y">
                        {machine.hourMeterHistory && machine.hourMeterHistory.length > 0 ? (
                            [...machine.hourMeterHistory]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(log => (
                                    <li key={log.sourceId} className="py-3">
                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {log.value.toLocaleString('pt-BR')}h
                                                    <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${log.source === 'Abastecimento' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                        {log.source}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Atualizado por: {getCollaboratorById(log.collaboratorId)?.name || 'N/A'}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-600">{new Date(log.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
                                        </div>
                                    </li>
                                ))
                        ) : (
                            <li className="py-3 text-center text-gray-500">
                                Nenhum histórico de atualização encontrado.
                            </li>
                        )}
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default MachineDetail;