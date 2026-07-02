import React, { useState, useMemo } from 'react';
import { ClipboardList, Search, Eye, Trash2, Edit, FileText, AlertCircle, ShoppingBag, FolderArchive, HelpCircle } from 'lucide-react';
import { Order } from '../types';
import { generateOrderPDF } from '../utils/pdfGenerator';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onNavigateToCreate: () => void;
}

export default function OrderList({
  orders,
  onEditOrder,
  onDeleteOrder,
  onNavigateToCreate,
}: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return orders;
    const words = term.split(/\s+/);
    return orders.filter(o => {
      const target = `${o.code} ${o.title} ${o.requestedBy}`.toLowerCase();
      return words.every(word => target.includes(word));
    });
  }, [orders, searchTerm]);

  // Aggregate metrics
  const totalItemsCount = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0), 0);
  }, [orders]);

  return (
    <div className="space-y-6" id="order-list">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-2">
        
        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs flex flex-col items-center justify-center text-center">
          <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600 mb-1">
            <ClipboardList size={16} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase leading-tight">Pedidos</span>
            <span className="text-sm font-black text-slate-800 leading-none">{orders.length}</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-1.5 rounded-lg text-slate-600 mb-1">
            <ShoppingBag size={16} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase leading-tight">Artículos</span>
            <span className="text-sm font-black text-slate-800 leading-none">{totalItemsCount}</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs flex flex-col items-center justify-center text-center">
          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 mb-1">
            <FolderArchive size={16} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase leading-tight">Estado</span>
            <span className="text-xs font-black text-indigo-600 leading-none">Activo</span>
          </div>
        </div>

      </div>

      {/* Main Listing Section */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-3 space-y-3">
        
        {/* Search and Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="Buscar por código, proyecto o solicitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600 focus:ring-0 focus:border-emerald-600 placeholder:text-slate-400"
            id="order-search"
          />
        </div>

        {/* Requisition Mobile Cards */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-2.5" id="orders-list-cards">
            {filteredOrders.map((o) => {
              const itemsCount = o.items.reduce((acc, curr) => acc + curr.quantity, 0);
              const itemsTypeCount = o.items.length;
              return (
                <div key={o.id} className="border border-slate-100 bg-slate-50/40 rounded-lg p-3 space-y-2.5 hover:border-emerald-200/50 transition-all">
                  
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {o.code}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {new Date(o.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Title and details */}
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-slate-700 leading-snug">{o.title}</h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Solicitado por:</span>
                      <span className="font-bold text-slate-600">{o.requestedBy}</span>
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded">
                        {itemsTypeCount} {itemsTypeCount === 1 ? 'ítem' : 'ítems'}
                      </span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-mono font-bold px-1.5 py-0.5 rounded">
                        {itemsCount} unidades
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                    <div className="text-[9px] text-slate-400 font-mono">
                      {new Date(o.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => generateOrderPDF(o)}
                        title="Descargar Reporte PDF"
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded transition-colors cursor-pointer flex items-center justify-center"
                        id={`pdf-btn-${o.code}`}
                      >
                        <FileText size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditOrder(o)}
                        title="Editar Requerimiento"
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded transition-colors cursor-pointer flex items-center justify-center"
                        id={`edit-btn-${o.code}`}
                      >
                        <Edit size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingOrderId(o.id)}
                        title="Eliminar Requerimiento"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent rounded transition-colors cursor-pointer flex items-center justify-center"
                        id={`delete-btn-${o.code}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center max-w-sm mx-auto space-y-4">
            <FolderArchive className="mx-auto text-slate-300" size={36} />
            <div>
              <h4 className="text-xs font-bold text-slate-700">Sin requerimientos guardados</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                {searchTerm 
                  ? `Ninguna solicitud coincide con el filtro "${searchTerm}".` 
                  : 'Aún no se han guardado solicitudes de compra. Diríjase al Creador para registrar la primera.'}
              </p>
            </div>
            {!searchTerm && (
              <button
                type="button"
                onClick={onNavigateToCreate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                id="create-first-order-btn"
              >
                Crear Primer Requerimiento
              </button>
            )}
          </div>
        )}

      </div>

      {/* Reusable confirmation modal for deletion */}
      {deletingOrderId && (() => {
        const orderToDelete = orders.find(o => o.id === deletingOrderId);
        return (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="delete-order-modal">
            <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <Trash2 size={24} className="shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider">¿Eliminar Requisición?</h3>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                ¿Está seguro de eliminar la requisición <span className="text-slate-800 font-black">{orderToDelete?.code || ''}</span>? Esta acción es totalmente irreversible.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingOrderId(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteOrder(deletingOrderId);
                    setDeletingOrderId(null);
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold uppercase tracking-wider rounded cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
