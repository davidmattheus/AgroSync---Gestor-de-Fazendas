import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { useFarmData } from '../context/FarmDataContext';
import { useAuth } from '../context/AuthContext';
import { WarehouseItem, UserRole } from '../types';
import { PlusIcon, EditIcon, TrashIcon, XCircleIcon, FileTextIcon, AlertTriangleIcon } from '../components/ui/Icons';

const initialItemState: Omit<WarehouseItem, 'id' | 'createdAt' | 'stockHistory'> = {
    name: '',
    code: '',
    unitValue: 0,
    stockQuantity: 0,
};

// Modal Component
const WarehouseItemFormModal: React.FC<{ item: WarehouseItem | null; onClose: () => void; }> = ({ item, onClose }) => {
    const { addWarehouseItem, updateWarehouseItem } = useFarmData();
    const [formData, setFormData] = useState(initialItemState);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                code: item.code,
                unitValue: item.unitValue,
                stockQuantity: item.stockQuantity,
            });
        } else {
            setFormData(initialItemState);
        }
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.code) {
            alert('Por favor, preencha nome e código da peça.');
            return;
        }
        if (item) {
            updateWarehouseItem({ ...formData, id: item.id, createdAt: item.createdAt, stockHistory: item.stockHistory });
        } else {
            addWarehouseItem(formData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <XCircleIcon size={28}/>
                </button>
                <h3 className="text-xl font-bold text-agro-gray-800 mb-6">{item ? 'Editar Peça' : 'Adicionar Nova Peça'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">Nome da Peça *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">Código da Peça *</label>
                        <input type="text" name="code" value={formData.code} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Valor Unitário (R$)</label>
                            <input type="number" step="0.01" name="unitValue" value={formData.unitValue} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-600 block">Quantidade em Estoque</label>
                            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-white bg-agro-green rounded-lg hover:bg-opacity-90">Salvar Peça</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const AddStockModal: React.FC<{ item: WarehouseItem; onClose: () => void; }> = ({ item, onClose }) => {
    const { addStockToWarehouseItem } = useFarmData();
    const [quantity, setQuantity] = useState(1);
    const [invoiceNumber, setInvoiceNumber] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) {
            alert('A quantidade deve ser maior que zero.');
            return;
        }
        addStockToWarehouseItem(item.id, quantity, invoiceNumber);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <XCircleIcon size={28}/>
                </button>
                <h3 className="text-xl font-bold text-agro-gray-800 mb-2">Adicionar Estoque</h3>
                <p className="text-agro-gray-600 mb-6">{item.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">Quantidade a Adicionar*</label>
                        <input 
                            type="number" 
                            min="1"
                            value={quantity} 
                            onChange={e => setQuantity(Number(e.target.value))} 
                            required 
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green" 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">Número da Nota Fiscal</label>
                        <input 
                            type="text" 
                            value={invoiceNumber} 
                            onChange={e => setInvoiceNumber(e.target.value)} 
                            className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green"
                            placeholder="Opcional"
                        />
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-white bg-agro-green rounded-lg hover:bg-opacity-90">Adicionar</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const WarehouseItemHistoryModal: React.FC<{ item: WarehouseItem; onClose: () => void; }> = ({ item, onClose }) => {
    const sortedHistory = useMemo(() => {
        return item.stockHistory ? [...item.stockHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
    }, [item.stockHistory]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 pt-16">
            <Card className="w-full max-w-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <XCircleIcon size={28}/>
                </button>
                <h3 className="text-xl font-bold text-agro-gray-800 mb-2">Histórico de Estoque</h3>
                <p className="text-agro-gray-600 mb-6">{item.name} ({item.code})</p>
                
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="border-b sticky top-0 bg-white">
                            <tr className="text-sm text-agro-gray-600">
                                <th className="p-2">Data</th>
                                <th className="p-2">Motivo</th>
                                <th className="p-2 text-center">Alteração</th>
                                <th className="p-2 text-center">Estoque Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHistory.length > 0 ? sortedHistory.map((log, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{new Date(log.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className="p-2">
                                        {log.referenceId && log.referenceId.startsWith('maint_') ? (
                                            <Link to={`/maintenance/${log.referenceId}`} className="text-blue-600 hover:underline">{log.reason}</Link>
                                        ) : (
                                            log.reason
                                        )}
                                        {log.invoiceNumber && (
                                            <span className="block text-xs text-gray-500 italic">NF: {log.invoiceNumber}</span>
                                        )}
                                    </td>
                                    <td className={`p-2 text-center font-semibold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                                    </td>
                                    <td className="p-2 text-center font-bold">{log.newStockLevel}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">Nenhum histórico encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Fechar</button>
                </div>
            </Card>
        </div>
    );
};

const Warehouse: React.FC = () => {
  const { farm: { warehouseItems }, loading, deleteWarehouseItem } = useFarmData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyModalItem, setHistoryModalItem] = useState<WarehouseItem | null>(null);
  const [addStockItem, setAddStockItem] = useState<WarehouseItem | null>(null);

  const canManage = user?.role === UserRole.ADMIN;

  const handleOpenModal = (item: WarehouseItem | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita.')) {
      deleteWarehouseItem(itemId);
    }
  };

  const filteredItems = useMemo(() => {
    return warehouseItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [warehouseItems, searchTerm]);

  const handleExportCSV = () => {
    const headers = "Nome;Codigo;Valor Unitario;Quantidade em Estoque";
    const csvContent = [
      headers,
      ...filteredItems.map(item =>
        `${item.name};${item.code};${item.unitValue.toFixed(2)};${item.stockQuantity}`
      )
    ].join("\n");
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "relatorio_almoxarifado.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-agro-gray-800">Almoxarifado</h2>
        <div className="flex items-center space-x-2">
           <button onClick={handleExportCSV} className="flex items-center px-4 py-2 text-agro-green bg-white border border-agro-green rounded-lg hover:bg-agro-light-green transition-colors">
                <FileTextIcon className="w-5 h-5 mr-2" />
                Exportar CSV
            </button>
            {canManage && (
              <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 text-white bg-agro-green rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Adicionar Peça
              </button>
            )}
        </div>
      </div>
      
      {isModalOpen && canManage && <WarehouseItemFormModal item={editingItem} onClose={() => setIsModalOpen(false)} />}
      {historyModalItem && <WarehouseItemHistoryModal item={historyModalItem} onClose={() => setHistoryModalItem(null)} />}
      {addStockItem && canManage && <AddStockModal item={addStockItem} onClose={() => setAddStockItem(null)} />}


      <Card>
        <div className="mb-4">
            <input 
                type="text" 
                placeholder="Buscar por nome ou código..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full max-w-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green"
            />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr className="text-sm text-agro-gray-600">
                <th className="p-4">Nome da Peça</th>
                <th className="p-4">Código</th>
                <th className="p-4">Valor Unitário</th>
                <th className="p-4">Estoque</th>
                {canManage && <th className="p-4">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canManage ? 5 : 4} className="p-4 text-center">Carregando itens...</td></tr>
              ) : (
                filteredItems.map(item => {
                  const isLowStock = item.stockQuantity < 5;
                  const isOutOfStock = item.stockQuantity === 0;

                  let rowClassName = 'border-b hover:bg-agro-light-green transition-colors';
                  if (isOutOfStock) {
                      rowClassName += ' bg-red-100';
                  } else if (isLowStock) {
                      rowClassName += ' bg-yellow-100';
                  }

                  let stockClassName = 'p-4 font-bold';
                  if (isOutOfStock) {
                    stockClassName += ' text-red-700';
                  } else if (isLowStock) {
                    stockClassName += ' text-yellow-700';
                  } else {
                    stockClassName += ' text-gray-700';
                  }

                  return (
                    <tr key={item.id} className={rowClassName}>
                      <td className="p-4 font-semibold text-agro-gray-800">{item.name}</td>
                      <td className="p-4">{item.code}</td>
                      <td className="p-4">{item.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className={stockClassName}>
                        <div className="flex items-center">
                          {item.stockQuantity}
                          {isLowStock && <AlertTriangleIcon className={`w-4 h-4 ml-2 ${isOutOfStock ? 'text-red-600' : 'text-yellow-600'}`} />}
                        </div>
                      </td>
                      {canManage && (
                        <td className="p-4">
                          <div className="flex items-center space-x-4">
                            <button onClick={() => setHistoryModalItem(item)} className="text-green-600 hover:text-green-800" title="Ver Histórico"><FileTextIcon size={20}/></button>
                            <button onClick={() => setAddStockItem(item)} className="text-gray-600 hover:text-gray-800" title="Adicionar Estoque"><PlusIcon size={20}/></button>
                            <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-800" title="Editar"><EditIcon size={20}/></button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800" title="Excluir"><TrashIcon size={20}/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Warehouse;