import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFarmData } from '../context/FarmDataContext';
import Card from '../components/ui/Card';
import { ArrowLeftIcon, BoxIcon } from '../components/ui/Icons';

const MaintenanceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { farm, getMachineById, getCollaboratorById } = useFarmData();

    const log = farm.maintenanceLogs.find(l => l.id === id);

    if (!log) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-agro-gray-800">Registro de Manutenção não encontrado</h2>
                <Link to="/maintenance" className="text-agro-green hover:underline mt-4 inline-block">
                    Voltar para o Histórico
                </Link>
            </div>
        );
    }

    const machine = getMachineById(log.machineId);
    const collaborator = getCollaboratorById(log.collaboratorId);
    
    const partsCost = log.partsUsed?.reduce((acc, part) => {
        const item = farm.warehouseItems.find(i => i.id === part.itemId);
        return acc + (item ? item.unitValue * part.quantity : 0);
    }, 0) || 0;

    const laborCost = log.totalCost - partsCost;

    return (
        <div className="space-y-6">
            <Link to={machine ? `/machines/${machine.id}` : '/maintenance'} className="flex items-center text-agro-green hover:text-green-700">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                {machine ? `Voltar para ${machine.name}` : 'Voltar para o Histórico'}
            </Link>
            
            <Card>
                <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b">
                    <div>
                        <h2 className="text-3xl font-bold text-agro-gray-800">{log.type}</h2>
                        <p className="text-lg text-agro-gray-500">
                            Realizada em: {new Date(log.date).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="text-right">
                         <p className="text-sm text-gray-500">Custo Total</p>
                         <p className="text-3xl font-bold text-agro-green">{log.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                    <div><p className="text-sm text-gray-500">Máquina</p><p className="font-semibold">{machine?.name || 'N/A'}</p></div>
                    <div><p className="text-sm text-gray-500">Responsável</p><p className="font-semibold">{collaborator?.name || 'N/A'}</p></div>
                    <div><p className="text-sm text-gray-500">Horímetro</p><p className="font-semibold">{log.hourMeter.toLocaleString('pt-BR')}h</p></div>
                </div>
                 {log.notes && (
                    <div className="mt-6 pt-6 border-t">
                        <p className="text-sm text-gray-500">Observações / Detalhes do Serviço</p>
                        <p className="font-semibold whitespace-pre-wrap">{log.notes}</p>
                    </div>
                 )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                         <h3 className="text-lg font-semibold text-agro-gray-800 mb-4 flex items-center"><BoxIcon className="mr-2 text-agro-green"/> Peças Utilizadas do Almoxarifado</h3>
                         {log.partsUsed && log.partsUsed.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b">
                                        <tr className="text-sm text-agro-gray-600">
                                            <th className="p-2">Peça</th>
                                            <th className="p-2 text-center">Qtd.</th>
                                            <th className="p-2 text-right">Valor Un.</th>
                                            <th className="p-2 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {log.partsUsed.map(part => {
                                            const item = farm.warehouseItems.find(i => i.id === part.itemId);
                                            const subtotal = item ? item.unitValue * part.quantity : 0;
                                            return (
                                                <tr key={part.itemId} className="border-b">
                                                    <td className="p-2">
                                                        <p className="font-semibold">{item?.name || 'Peça não encontrada'}</p>
                                                        <p className="text-xs text-gray-500">{item?.code}</p>
                                                    </td>
                                                    <td className="p-2 text-center">{part.quantity}</td>
                                                    <td className="p-2 text-right">{item?.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                    <td className="p-2 text-right font-semibold">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                         ) : (
                            <p className="text-gray-500">Nenhuma peça do almoxarifado foi utilizada neste serviço.</p>
                         )}
                    </Card>
                </div>
                <div>
                     <Card>
                        <h3 className="text-lg font-semibold text-agro-gray-800 mb-4">Resumo de Custos</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Custo das Peças</span>
                                <span className="font-bold">{partsCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Mão de Obra / Outros</span>
                                <span className="font-bold">{laborCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-bold text-gray-800">Total</span>
                                <span className="font-bold text-agro-green">{log.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        </div>
    );
};

export default MaintenanceDetail;