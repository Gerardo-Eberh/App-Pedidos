import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Save, FileText, Sparkles, User, FileEdit, AlertCircle, ShoppingBag, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { Product, Order, OrderItem, User as UserType } from '../types';
import { generateOrderPDF } from '../utils/pdfGenerator';
import ImageEditorModal from './ImageEditorModal';

interface OrderCreatorProps {
  products: Product[];
  productPhotos: { [code: string]: string };
  editingOrder: Order | null;
  currentUser: UserType;
  onSaveOrder: (order: Order) => void;
  onCancelEdit: () => void;
  onSavePhoto?: (code: string, base64Image: string) => void;
}

export default function OrderCreator({
  products,
  productPhotos,
  editingOrder,
  currentUser,
  onSaveOrder,
  onCancelEdit,
  onSavePhoto,
}: OrderCreatorProps) {
  // Order metadata
  const [requestedBy, setRequestedBy] = useState<string>('');
  const [orderTitle, setOrderTitle] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Product Search & Selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [observations, setObservations] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [editingImageItem, setEditingImageItem] = useState<{ code: string; description: string } | null>(null);

  // Collapsible section states
  const [reqInfoExpanded, setReqInfoExpanded] = useState<boolean>(true);
  const [itemPickerExpanded, setItemPickerExpanded] = useState<boolean>(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load editing order state if available
  useEffect(() => {
    if (editingOrder) {
      setRequestedBy(editingOrder.requestedBy);
      setOrderTitle(editingOrder.title);
      setGeneralNotes(editingOrder.notes || '');
      setOrderItems(editingOrder.items);
    } else {
      setRequestedBy(currentUser.fullName);
      setOrderTitle('');
      setGeneralNotes('');
      setOrderItems([]);
    }
    setSelectedProduct(null);
    setSearchQuery('');
  }, [editingOrder, currentUser]);

  // Handle autocomplete search (non-exact, matches words split by spaces)
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || selectedProduct) {
      setSearchResults([]);
      return;
    }

    const words = query.split(/\s+/);
    // Limit to 8 results for performance
    const filtered = products
      .filter(p => {
        const target = `${p.code} ${p.description}`.toLowerCase();
        return words.every(word => target.includes(word));
      })
      .slice(0, 8);
    
    setSearchResults(filtered);
  }, [searchQuery, products, selectedProduct]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(`${product.code} - ${product.description}`);
    setShowDropdown(false);
    setQuantity(1);
    setObservations('');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity <= 0) {
      setAlertMessage('La cantidad debe ser mayor que cero.');
      return;
    }

    // Check if product already exists in current list
    const existingIndex = orderItems.findIndex(item => item.productCode === selectedProduct.code);
    
    // Auto-resolve current photo snapshot
    const itemPhoto = productPhotos[selectedProduct.code] || '';

    if (existingIndex !== -1) {
      // Update existing item
      const updated = [...orderItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
        observations: observations.trim() 
          ? `${updated[existingIndex].observations} | ${observations.trim()}`
          : updated[existingIndex].observations,
        imageUrl: itemPhoto || updated[existingIndex].imageUrl
      };
      setOrderItems(updated);
    } else {
      // Add new item
      const newItem: OrderItem = {
        productCode: selectedProduct.code,
        description: selectedProduct.description,
        uom: selectedProduct.uom,
        quantity: quantity,
        observations: observations.trim(),
        imageUrl: itemPhoto
      };
      setOrderItems([newItem, ...orderItems]);
    }

    // Reset picker
    setSelectedProduct(null);
    setSearchQuery('');
    setQuantity(1);
    setObservations('');
    searchInputRef.current?.focus();
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    if (!requestedBy.trim()) {
      setAlertMessage('Por favor, ingrese el nombre del Solicitante.');
      return;
    }
    if (!orderTitle.trim()) {
      setAlertMessage('Por favor, ingrese un Título o Proyecto para el requerimiento.');
      return;
    }
    if (orderItems.length === 0) {
      setAlertMessage('Debe agregar al menos un artículo para guardar la solicitud.');
      return;
    }

    const orderData: Order = {
      id: editingOrder?.id || crypto.randomUUID(),
      code: editingOrder?.code || `RQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: orderTitle.trim(),
      status: 'draft',
      items: orderItems,
      notes: generalNotes.trim(),
      requestedBy: requestedBy.trim(),
      createdById: editingOrder?.createdById || currentUser.id,
      sector: editingOrder?.sector || currentUser.sector,
      createdAt: editingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveOrder(orderData);
  };

  const handleGeneratePDF = () => {
    if (!requestedBy.trim() || !orderTitle.trim() || orderItems.length === 0) {
      setAlertMessage('Complete los datos del Solicitante, Título y agregue artículos para poder generar el reporte PDF.');
      return;
    }

    const draftOrder: Order = {
      id: editingOrder?.id || 'temp-preview',
      code: editingOrder?.code || `RQ-${new Date().getFullYear()}-TEMP`,
      title: orderTitle.trim(),
      status: 'submitted',
      items: orderItems,
      notes: generalNotes.trim(),
      requestedBy: requestedBy.trim(),
      createdById: editingOrder?.createdById || currentUser.id,
      sector: editingOrder?.sector || currentUser.sector,
      createdAt: editingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    generateOrderPDF(draftOrder);
  };

  return (
    <div className="grid grid-cols-1 gap-5 animate-fadeIn" id="order-creator">
      
      {/* Configuration, Metadata & Item Picker */}
      <div className="space-y-5">
        
        {/* Requisition Header Info */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setReqInfoExpanded(!reqInfoExpanded)}
            className="w-full p-3 flex justify-between items-center bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors text-left"
          >
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="text-emerald-600" size={13} />
              Datos de Requerimiento
            </h3>
            <span className="text-slate-400">
              {reqInfoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {reqInfoExpanded && (
            <div className="p-3 space-y-2.5 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Solicitante (Nombre y Cargo) *</label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Jesica Martinez - Sistemas"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-emerald-600"
                  id="solicitante-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Título / Proyecto / Área *</label>
                <input
                  type="text"
                  placeholder="Ej: Servidores Planta Norte"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-emerald-600"
                  id="titulo-proyecto-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Observaciones Generales</label>
                <textarea
                  placeholder="Instrucciones de entrega, plazos o prioridades..."
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-emerald-600 resize-none"
                  id="observaciones-generales-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Item Picker from Catalog */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs relative overflow-hidden">
          <button
            type="button"
            onClick={() => setItemPickerExpanded(!itemPickerExpanded)}
            className="w-full p-3 flex justify-between items-center bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors text-left"
          >
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <ShoppingBag className="text-emerald-600" size={13} />
              Selector de Artículos
            </h3>
            <span className="text-slate-400">
              {itemPickerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {itemPickerExpanded && (
            <form onSubmit={handleAddItem} className="p-3 space-y-2.5 animate-fadeIn">
              
              {/* Search Autocomplete */}
              <div className="space-y-1 relative" ref={dropdownRef}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Buscar Artículo en Catálogo *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Escriba código o descripción..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedProduct) setSelectedProduct(null); // Clear active choice if editing query
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-8 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-emerald-600 placeholder:text-slate-400"
                    id="picker-search-input"
                  />
                  {selectedProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setSearchQuery('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded text-slate-600 font-bold"
                    >
                      Borrar
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-50" id="picker-dropdown">
                    {searchResults.map((p) => {
                      const photo = productPhotos[p.code];
                      return (
                        <div
                          key={p.code}
                          onClick={() => handleSelectProduct(p)}
                          className="p-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 transition-colors"
                        >
                          <div className="w-7 h-7 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                            {photo ? (
                              <img src={photo} alt={p.code} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag size={12} className="text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono font-black text-emerald-600 truncate">{p.code}</p>
                            <p className="text-[10px] text-slate-700 truncate font-semibold">{p.description}</p>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">UM: {p.uom}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quantity and Observations */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={!selectedProduct}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 disabled:text-slate-400 font-black focus:bg-white focus:outline-emerald-600 text-center font-mono"
                    id="picker-quantity"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">UM Catálogo</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="-"
                    value={selectedProduct ? selectedProduct.uom : ''}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-100 font-black text-slate-700 font-mono text-center cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Observaciones de Línea</label>
                <input
                  type="text"
                  disabled={!selectedProduct}
                  placeholder="Ej: Prioridad urgente, etc."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 disabled:text-slate-400 font-medium focus:bg-white focus:outline-emerald-600 placeholder:text-slate-400"
                  id="picker-observations"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedProduct}
                className={`w-full py-2 rounded-lg text-white text-[11px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                  selectedProduct 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
                id="add-to-list-btn"
              >
                <Plus size={13} /> Agregar al Pedido
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Active List details & Controls */}
      <div className="space-y-5">
        
        {/* Active Order Items List */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between overflow-hidden">
          
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="text-emerald-600" size={13} />
                Artículos en Pedido
              </h3>
              <p className="text-[9px] text-slate-400 font-bold">
                {editingOrder ? `Editando Requisición: ${editingOrder.code}` : 'Borrador de solicitud'}
              </p>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5 text-center shrink-0">
              <span className="text-[8px] font-bold text-emerald-800 font-mono block">TOTAL</span>
              <span className="text-xs font-black text-emerald-600 font-mono leading-none">{orderItems.length}</span>
            </div>
          </div>

          {/* List Content */}
          <div className="p-3 max-h-[300px] overflow-y-auto">
            {orderItems.length > 0 ? (
              <div className="space-y-2.5" id="active-order-list-cards">
                {orderItems.map((item, index) => {
                  const currentLivePhoto = productPhotos[item.productCode];
                  const photoToShow = currentLivePhoto || item.imageUrl;
                  
                  return (
                    <div key={item.productCode} className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/30 flex gap-2.5 items-center relative">
                      
                      {/* Image Preview (Interactive button to assign/change photo) */}
                      <button
                        type="button"
                        onClick={() => setEditingImageItem({ code: item.productCode, description: item.description })}
                        className="w-10 h-10 rounded border border-slate-200 bg-white hover:border-emerald-500 flex items-center justify-center overflow-hidden shrink-0 transition-all relative group/photo cursor-pointer focus:outline-none"
                        title="Asignar o cambiar foto del artículo para el catálogo"
                      >
                        {photoToShow ? (
                          <img src={photoToShow} alt={item.productCode} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={14} className="text-slate-300 group-hover/photo:text-emerald-600 transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                          <Camera size={11} className="text-white" />
                        </div>
                      </button>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-[10px] text-emerald-600">{item.productCode}</span>
                          <span className="text-[10px] font-mono text-slate-400">({item.uom})</span>
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-700 truncate leading-tight mt-0.5">
                          {item.description}
                        </h4>
                        
                        <button
                          type="button"
                          onClick={() => setEditingImageItem({ code: item.productCode, description: item.description })}
                          className="text-[8px] text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 mt-1 shrink-0 cursor-pointer hover:underline"
                        >
                          <Camera size={9} />
                          {photoToShow ? 'Cambiar foto' : 'Asignar foto'}
                        </button>

                        {item.observations && (
                          <p className="text-[10px] text-amber-600 italic truncate mt-1 border-t border-slate-100 pt-1">
                            Obs: {item.observations}
                          </p>
                        )}
                      </div>

                      {/* Quantity & Delete button absolute on right */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          x{item.quantity}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                          id={`remove-item-btn-${item.productCode}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center max-w-xs mx-auto space-y-3">
                <AlertCircle className="mx-auto text-slate-300" size={28} />
                <h4 className="text-xs font-bold text-slate-700">La lista está vacía</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Busque un artículo, configure su cantidad y agréguelo para construir el pedido de compra.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between gap-2.5 items-center">
            {editingOrder && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            )}

            <div className="flex gap-2 ml-auto w-full justify-end">
              <button
                type="button"
                disabled={orderItems.length === 0}
                onClick={handleGeneratePDF}
                className={`px-3 py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                  orderItems.length === 0
                    ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                }`}
                id="generate-pdf-btn"
              >
                <FileText size={12} /> PDF
              </button>

              <button
                type="button"
                disabled={orderItems.length === 0}
                onClick={handleSaveDraft}
                className={`px-3 py-2 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderItems.length === 0
                    ? 'bg-emerald-400 cursor-not-allowed opacity-70'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                }`}
                id="save-requisition-btn"
              >
                <Save size={12} /> Guardar Pedido
              </button>
            </div>
          </div>

        </div>

      </div>

      {editingImageItem && onSavePhoto && (
        <ImageEditorModal
          productCode={editingImageItem.code}
          productDescription={editingImageItem.description}
          currentImage={productPhotos[editingImageItem.code] || ''}
          onSave={(base64Image) => {
            onSavePhoto(editingImageItem.code, base64Image);
            // Update immediately inside active draft order list so it reflects in the UI/PDF generator
            setOrderItems(prev => prev.map(o => o.productCode === editingImageItem.code ? { ...o, imageUrl: base64Image } : o));
          }}
          onClose={() => setEditingImageItem(null)}
        />
      )}

      {/* Custom Alert Modal overlay */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn" id="custom-alert-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Atención</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold">{alertMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl tracking-wide uppercase transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
