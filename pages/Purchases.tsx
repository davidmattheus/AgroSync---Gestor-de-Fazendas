import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import { useFarmData } from '../context/FarmDataContext';
import { useAuth } from '../context/AuthContext';
import { PurchaseOrderStatus, PurchaseOrder, UserRole, WarehouseItem, PurchaseOrderItem } from '../types';
import { PlusIcon, XCircleIcon, TrashIcon } from '../components/ui/Icons';

const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch(status) {
      case PurchaseOrderStatus.PENDING:
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Pendente</span>;
      case PurchaseOrderStatus.APPROVED:
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Aprovado</span>;
      case PurchaseOrderStatus.FULFILLED:
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Atendido</span>;
       case PurchaseOrderStatus.CANCELLED:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Cancelado</span>;
      default:
        return null;
    }
};

// --- MODAL PARA CRIAR NOVO PEDIDO ---
const PurchaseOrderFormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { farm, addPurchaseOrder } = useFarmData();
    const [requesterId, setRequesterId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    
    // States for adding a new item
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<WarehouseItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }
        const availableItems = farm.warehouseItems.filter(p => !items.some(ip => ip.itemId === p.id));
        const results = availableItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(results);
    }, [searchTerm, farm.warehouseItems, items]);

    const handleSelectItem = (item: WarehouseItem) => {
        setSelectedItem(item);
        setSearchTerm(`${item.name} (${item.code})`);
        setSearchResults([]);
    };
    
    const handleAddItem = () => {
        if (!selectedItem || quantity <= 0) {
            alert("Selecione uma peça e informe uma quantidade válida.");
            return;
        }
        setItems([...items, { itemId: selectedItem.id, quantity }]);
        setSelectedItem(null);
        setSearchTerm('');
        setQuantity(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(items.filter(i => i.itemId !== itemId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0 || !requesterId) {
            alert("Adicione pelo menos um item ao pedido e selecione o solicitante.");
            return;
        }
        addPurchaseOrder({ items, requesterId, notes });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-3xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <XCircleIcon size={28}/>
                </button>
                <h3 className="text-xl font-bold text-agro-gray-800 mb-6">Nova Solicitação de Compra</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {/* Item addition section */}
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-bold text-gray-700 mb-2">Adicionar Item ao Pedido</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
                            <div className="md:col-span-3 relative">
                                <label className="text-sm font-bold text-gray-600 block">Buscar Peça *</label>
                                <input type="text" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSelectedItem(null); }} placeholder="Nome ou código..." className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                                {searchResults.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {searchResults.map(item => (
                                            <li key={item.id} onClick={() => handleSelectItem(item)} className="p-2 hover:bg-agro-light-green cursor-pointer">
                                                {item.name} ({item.code})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-sm font-bold text-gray-600 block">Qtd. *</label>
                                <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-2 mt-1 border border-gray-300 rounded-md" />
                            </div>
                            <div className="md:col-span-1 self-end">
                                <button type="button" onClick={handleAddItem} disabled={!selectedItem} className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50">Adicionar</button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Items list */}
                    <div className="space-y-2">
                        {items.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum item adicionado ao pedido.</p>}
                        {items.map(item => {
                            const itemInfo = farm.warehouseItems.find(i => i.id === item.itemId);
                            return (
                                <div key={item.itemId} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                    <div>
                                        <p className="font-semibold">{itemInfo?.name}</p>
                                        <p className="text-sm text-gray-500">{itemInfo?.code}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-4">Qtd: {item.quantity}</span>
                                        <button type="button" onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 hover:text-red-700"><TrashIcon size={18} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                             <label className="text-sm font-bold text-gray-600 block">Nome do Solicitante *</label>
                            <select value={requesterId} onChange={e => setRequesterId(e.target.value)} required className="w-full p-2 mt-1 border border-gray-300 rounded-md">
                                <option value="" disabled>Selecione...</option>
                                {farm.collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">Observações Gerais do Pedido</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full p-2 mt-1 border border-gray-300 rounded-md"></textarea>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-white bg-agro-green rounded-lg hover:bg-opacity-90">Enviar Solicitação</button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

const PurchaseOrderCancelModal: React.FC<{
    order: PurchaseOrder;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}> = ({ order, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-lg relative">
                <h3 className="text-xl font-bold text-red-700 mb-4">Cancelar Pedido {order.code}</h3>
                <p className="text-gray-600 mb-4">Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.</p>
                <div>
                    <label className="text-sm font-bold text-gray-600 block">Motivo do Cancelamento (Opcional)</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green"
                        placeholder="Ex: Item não mais necessário, compra duplicada..."
                    />
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Voltar</button>
                    <button type="button" onClick={handleConfirm} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Confirmar Cancelamento</button>
                </div>
            </Card>
        </div>
    );
};


// --- MODAL PARA VER DETALHES DO PEDIDO ---
const PurchaseOrderDetailModal: React.FC<{ order: PurchaseOrder; onClose: () => void; }> = ({ order, onClose }) => {
    const { getWarehouseItemById, getCollaboratorById, updatePurchaseOrderStatus, cancelPurchaseOrder } = useFarmData();
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const approximateTotalValue = useMemo(() => {
        return order.items.reduce((total, item) => {
            const itemInfo = getWarehouseItemById(item.itemId);
            return total + ((itemInfo?.unitValue || 0) * item.quantity);
        }, 0);
    }, [order.items, getWarehouseItemById]);

    const handleStatusChange = (newStatus: PurchaseOrderStatus) => {
        if (!user) return;
        const confirmText = newStatus === PurchaseOrderStatus.FULFILLED 
            ? `Deseja marcar este pedido como ATENDIDO? O estoque de TODOS os itens será atualizado.`
            : `Tem certeza que deseja alterar o status deste pedido para "${newStatus}"?`;

        if (window.confirm(confirmText)) {
            updatePurchaseOrderStatus(order.id, newStatus, user.id);
            onClose(); // Close modal after action
        }
    };

    const handleConfirmCancel = (reason: string) => {
        if (!user) return;
        cancelPurchaseOrder(order.id, user.id, reason);
        setIsCancelModalOpen(false);
        onClose();
    };

    const requester = getCollaboratorById(order.requesterId);
    const approver = order.approvedById ? (getCollaboratorById(order.approvedById) || {name: 'Admin'}) : null;
    const fulfiller = order.fulfilledById ? (getCollaboratorById(order.fulfilledById) || {name: 'Admin'}) : null;
    const canceller = order.cancelledById ? (getCollaboratorById(order.cancelledById) || {name: 'Admin'}) : null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
             {isCancelModalOpen && (
                <PurchaseOrderCancelModal
                    order={order}
                    onClose={() => setIsCancelModalOpen(false)}
                    onConfirm={handleConfirmCancel}
                />
            )}
            <Card className="w-full max-w-3xl relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <XCircleIcon size={28}/>
                </button>
                <div className="flex justify-between items-start mb-4 pb-4 border-b">
                    <div>
                        <h3 className="text-xl font-bold text-agro-gray-800">Detalhes do Pedido: {order.code}</h3>
                        <p className="text-sm text-gray-500">Solicitado por: {requester?.name}</p>
                    </div>
                    {getStatusBadge(order.status)}
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    <h4 className="font-bold text-gray-700">Itens do Pedido:</h4>
                     {order.items.map(item => {
                        const itemInfo = getWarehouseItemById(item.itemId);
                        return (
                             <div key={item.itemId} className="grid grid-cols-4 gap-4 items-center bg-gray-100 p-2 rounded-md">
                                <div>
                                    <p className="font-semibold">{itemInfo?.name}</p>
                                    <p className="text-sm text-gray-500">{itemInfo?.code}</p>
                                </div>
                                <div className="text-center">Qtd: {item.quantity}</div>
                                <div className="text-center">Valor Un: {(itemInfo?.unitValue || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>
                                <div className="text-right font-semibold">Subtotal: {(item.quantity * (itemInfo?.unitValue || 0)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 text-sm text-gray-600 space-y-1">
                    <p><strong>Data da Solicitação:</strong> {new Date(order.requestDate).toLocaleDateString('pt-BR')}</p>
                    {order.approvalDate && <p><strong>Aprovado por {approver?.name} em:</strong> {new Date(order.approvalDate).toLocaleDateString('pt-BR')}</p>}
                    {order.fulfilledDate && <p><strong>Atendido por {fulfiller?.name} em:</strong> {new Date(order.fulfilledDate).toLocaleDateString('pt-BR')}</p>}
                    {order.cancellationDate && <p><strong>Cancelado por {canceller?.name} em:</strong> {new Date(order.cancellationDate).toLocaleDateString('pt-BR')}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                        {(order.notes || order.cancellationReason) && (
                            <>
                                <h4 className="font-bold text-gray-700">Observações:</h4>
                                {order.notes && <p className="text-gray-600 italic">"{order.notes}"</p>}
                                {order.cancellationReason && <p className="text-red-600 mt-2"><strong>Motivo do Cancelamento:</strong> {order.cancellationReason}</p>}
                            </>
                        )}
                    </div>
                    <div className="md:text-right self-center">
                         <h4 className="font-bold text-gray-700">Valor Aproximado do Pedido:</h4>
                         <p className="text-xl font-bold text-agro-green">{approximateTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>


                <div className="flex justify-between items-center pt-4 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Fechar</button>
                     {isAdmin && (
                        <div className="flex items-center space-x-2">
                            {order.status === PurchaseOrderStatus.PENDING && (
                                <button onClick={() => handleStatusChange(PurchaseOrderStatus.APPROVED)} className="px-3 py-2 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600">Aprovar Pedido</button>
                            )}
                            {order.status === PurchaseOrderStatus.APPROVED && (
                                <button onClick={() => handleStatusChange(PurchaseOrderStatus.FULFILLED)} className="px-3 py-2 text-sm text-white bg-green-500 rounded hover:bg-green-600">Marcar como Atendido</button>
                            )}
                            {(order.status === PurchaseOrderStatus.PENDING || order.status === PurchaseOrderStatus.APPROVED) && (
                                <button onClick={() => setIsCancelModalOpen(true)} className="px-3 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600">Cancelar Pedido</button>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}

// --- PÁGINA PRINCIPAL ---
const Purchases: React.FC = () => {
    const { farm, getCollaboratorById, loading, updatePurchaseOrderStatus } = useFarmData();
    const { user } = useAuth();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [detailModalOrder, setDetailModalOrder] = useState<PurchaseOrder | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === UserRole.ADMIN;
    
    const handleQuickStatusChange = (order: PurchaseOrder, newStatus: PurchaseOrderStatus) => {
        if (!user) return;
        
        let confirmText = `Tem certeza que deseja alterar o status do pedido ${order.code} para "${newStatus}"?`;
        
        if (newStatus === PurchaseOrderStatus.FULFILLED) {
            confirmText = `Deseja marcar este pedido como ATENDIDO? O estoque de TODOS os itens será atualizado.`;
        } else if (newStatus === PurchaseOrderStatus.APPROVED) {
            confirmText = `Deseja APROVAR o pedido ${order.code}?`;
        }

        if (window.confirm(confirmText)) {
            updatePurchaseOrderStatus(order.id, newStatus, user.id);
        }
    };

    const filteredOrders = useMemo(() => {
        return farm.purchaseOrders
            .filter(order =>
                (statusFilter ? order.status === statusFilter : true) &&
                (searchTerm ?
                    order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    getCollaboratorById(order.requesterId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
                : true)
            ).sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [farm.purchaseOrders, statusFilter, searchTerm, getCollaboratorById]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-agro-gray-800">Solicitações de Compra</h2>
                <button onClick={() => setIsFormModalOpen(true)} className="flex items-center px-4 py-2 text-white bg-agro-green rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nova Solicitação de Compra
                </button>
            </div>
            
            {isFormModalOpen && <PurchaseOrderFormModal onClose={() => setIsFormModalOpen(false)} />}
            {detailModalOrder && <PurchaseOrderDetailModal order={detailModalOrder} onClose={() => setDetailModalOrder(null)} />}


            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-agro-gray-100 rounded-lg">
                    <input 
                        type="text" 
                        placeholder="Buscar por código ou solicitante..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green"
                    />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agro-green">
                        <option value="">Todos os Status</option>
                        {Object.values(PurchaseOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b">
                            <tr className="text-sm text-agro-gray-600">
                                <th className="p-4">Código do Pedido</th>
                                <th className="p-4">Data</th>
                                <th className="p-4">Solicitante</th>
                                <th className="p-4">Qtd. Itens</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-4 text-center">Carregando pedidos...</td></tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="border-b hover:bg-agro-light-green transition-colors">
                                        <td className="p-4 font-semibold text-agro-green">{order.code}</td>
                                        <td className="p-4">{new Date(order.requestDate).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4">{getCollaboratorById(order.requesterId)?.name || order.requesterId}</td>
                                        <td className="p-4 font-bold text-center">{order.items.length}</td>
                                        <td className="p-4">{getStatusBadge(order.status)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                {isAdmin && order.status === PurchaseOrderStatus.PENDING && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(order, PurchaseOrderStatus.APPROVED); }}
                                                        className="px-3 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600 whitespace-nowrap"
                                                    >
                                                        Aprovar
                                                    </button>
                                                )}
                                                {isAdmin && order.status === PurchaseOrderStatus.APPROVED && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleQuickStatusChange(order, PurchaseOrderStatus.FULFILLED); }}
                                                        className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 whitespace-nowrap"
                                                    >
                                                        Atender Pedido
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setDetailModalOrder(order)}
                                                    className="px-3 py-1 text-xs font-semibold text-agro-green bg-agro-light-green rounded-md hover:bg-agro-green hover:text-white whitespace-nowrap"
                                                >
                                                    Detalhes
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Purchases;