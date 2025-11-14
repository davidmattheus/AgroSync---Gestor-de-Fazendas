import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import { useFarmData } from '../context/FarmDataContext';
import { PlusIcon, XCircleIcon, FileTextIcon, EditIcon } from '../components/ui/Icons';
import { FuelType, FuelLog } from '../types';

declare const jspdf: any;

const initialLogState: Omit<FuelLog, 'id'> = {
    date: new Date().toISOString(),
    machineId: '',
    collaboratorId: '',
    fuelType: FuelType.DIESEL_S10,
    quantity: 0,
    totalValue: 0,
    odometer: 0,
    observations: '',
};

// Modal Component
const FuelingFormModal: React.FC<{ logToEdit: FuelLog | null; onClose: () => void; }> = ({ logToEdit, onClose }) => {
    const { farm, addFuelLog, updateFuelLog } = useFarmData();
    const [formData, setFormData] = useState<Omit<FuelLog, 'id' | 'date'> & { date: string }>({ ...initialLogState });
    
    useEffect(() => {
        if (logToEdit) {
            setFormData({
                date: logToEdit.date,
                machineId: logToEdit.machineId,
                collaboratorId: logToEdit.collaboratorId,
                fuelType: logToEdit.fuelType,
                quantity: logToEdit.quantity,
                totalValue: logToEdit.totalValue,
                odometer: logToEdit.odometer,
                observations: logToEdit.observations || '',
            });
        } else {
            // Reset to initial state for new log, with current date
            setFormData({ ...initialLogState, date: new Date().toISOString()});
        }
    }, [logToEdit]);


    const precalculatedValue = useMemo(() => {
        const qty = formData.quantity;
        if (!qty || isNaN(qty)) return null;
        
        const priceInfo = farm.fuelPrices.find(p => p.fuelType === formData.fuelType);
        if (!priceInfo || priceInfo.price <= 0) return null;
        
        return (qty * priceInfo.price).toFixed(2);
    }, [formData.quantity, formData.fuelType, farm.fuelPrices]);

    useEffect(() => {
        if (precalculatedValue !== null) {
            setFormData(prev => ({ ...prev, totalValue: parseFloat(precalculatedValue) }));
        }
    }, [precalculatedValue]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['quantity', 'totalValue', 'odometer'];
        setFormData(prev => ({
            ...prev,
            [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
        }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (dateString) {
            // Create Date object from YYYY-MM-DD string as UTC to avoid timezone shift
            const parts = dateString.split('-').map(Number);
            const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            setFormData(prev => ({ ...prev, date: utcDate.toISOString() }));
        } else {
            // If date is cleared, set it to an empty string to be caught by validation
            setFormData(prev => ({ ...prev, date: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.machineId || !formData.collaboratorId || formData.quantity <= 0 || formData.totalValue <= 0 || formData.odometer <= 0 || !formData.date) {
            alert("Por favor, preencha todos os campos obrigatórios com valores válidos.");
            return;
        }

        const finalData = formData as FuelLog;

        if (logToEdit) {
            updateFuelLog({ ...finalData, id: logToEdit.id });
        } else {
            addFuelLog(finalData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <XCircleIcon size={28}/>
                </button>
                <h3 className="text-xl font-bold text-agro-gray-800 mb-4">{logToEdit ? 'Editar Abastecimento' : 'Registrar Abastecimento'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-bold text-gray-600 block">Data</label>
                            <input type="date" value={formData.date ? formData.date.split('T')[0] : ''} onChange={handleDateChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Máquina</label>
                            <select name="machineId" value={formData.machineId} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green">
                                <option value="" disabled>Selecione...</option>
                                {farm.machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Responsável</label>
                            <select name="collaboratorId" value={formData.collaboratorId} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green">
                                <option value="" disabled>Selecione...</option>
                                {farm.collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="text-sm font-bold text-gray-600 block">Tipo de Combustível</label>
                            <select name="fuelType" value={formData.fuelType} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green">
                                {Object.values(FuelType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Quantidade (Litros)</label>
                            <input type="number" step="0.01" min="0" name="quantity" value={formData.quantity} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Valor Total (R$)</label>
                            <input type="number" step="0.01" min="0" name="totalValue" value={formData.totalValue} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                             {precalculatedValue && <p className="text-xs text-gray-500 mt-1">Valor sugerido: {parseFloat(precalculatedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>}
                        </div>
                         <div>
                            <label className="text-sm font-bold text-gray-600 block">Hodômetro / Horímetro</label>
                            <input type="number" min="0" name="odometer" value={formData.odometer} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-600 block">Observações</label>
                        <textarea name="observations" value={formData.observations} onChange={handleChange} rows={3} className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green"></textarea>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-white bg-agro-green rounded-lg hover:bg-opacity-90">Salvar Registro</button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

const Fueling: React.FC = () => {
  const { farm: { fuelLogs }, getMachineById, getCollaboratorById, loading } = useFarmData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logToEdit, setLogToEdit] = useState<FuelLog | null>(null);

  const handleOpenModal = (log: FuelLog | null = null) => {
    setLogToEdit(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLogToEdit(null);
  };

  const handleExportPDF = () => {
    const doc = new jspdf.jsPDF();
    const tableColumns = ["Data", "Máquina", "Responsável", "Combustível", "Qtd (L)", "Custo/L", "Total (R$)"];
    const tableRows: (string | number)[][] = [];

    const sortedLogs = [...fuelLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedLogs.forEach(log => {
        const machine = getMachineById(log.machineId);
        const collaborator = getCollaboratorById(log.collaboratorId);
        const costPerLiter = log.quantity > 0 ? log.totalValue / log.quantity : 0;

        const logData = [
            new Date(log.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            machine?.name || 'N/A',
            collaborator?.name || 'N/A',
            log.fuelType,
            log.quantity.toFixed(2),
            costPerLiter.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            log.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ];
        tableRows.push(logData);
    });

    doc.setFontSize(18);
    doc.text("Relatório de Abastecimentos", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    doc.autoTable({
        startY: 30,
        head: [tableColumns],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [58, 155, 81] }, // agro-green color
    });

    doc.save('relatorio_abastecimentos.pdf');
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-agro-gray-800">Controle de Abastecimentos</h2>
        <div className="flex items-center space-x-2">
            <button onClick={handleExportPDF} className="flex items-center px-4 py-2 text-agro-green bg-white border border-agro-green rounded-lg hover:bg-agro-light-green transition-colors">
                <FileTextIcon className="w-5 h-5 mr-2" />
                Exportar PDF
            </button>
            <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 text-white bg-agro-green rounded-lg hover:bg-opacity-90 transition-colors">
                <PlusIcon className="w-5 h-5 mr-2" />
                Registrar Abastecimento
            </button>
        </div>
      </div>

      {isModalOpen && <FuelingFormModal logToEdit={logToEdit} onClose={handleCloseModal} />}

      <Card>
        {/* Add filters here */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr className="text-sm text-agro-gray-600">
                <th className="p-4">Data</th>
                <th className="p-4">Máquina</th>
                <th className="p-4">Responsável</th>
                <th className="p-4">Combustível</th>
                <th className="p-4">Quantidade</th>
                <th className="p-4">Custo / Litro</th>
                <th className="p-4">Valor Total</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-4 text-center">Carregando registros...</td></tr>
              ) : (
                fuelLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
                  const machine = getMachineById(log.machineId);
                  const collaborator = getCollaboratorById(log.collaboratorId);
                  const costPerLiter = log.quantity > 0 ? log.totalValue / log.quantity : 0;
                  return (
                    <tr key={log.id} className="border-b hover:bg-agro-light-green">
                      <td className="p-4">{new Date(log.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      <td className="p-4 font-semibold">{machine?.name || 'N/A'}</td>
                      <td className="p-4">{collaborator?.name || 'N/A'}</td>
                      <td className="p-4">{log.fuelType}</td>
                      <td className="p-4">{log.quantity.toFixed(2)} L</td>
                      <td className="p-4">{costPerLiter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="p-4 font-semibold">{log.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="p-4">
                        <button onClick={() => handleOpenModal(log)} className="text-blue-600 hover:text-blue-800" title="Editar"><EditIcon size={20}/></button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Fueling;