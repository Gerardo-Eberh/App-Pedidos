import React, { useState, useMemo } from 'react';
import { Search, Upload, Plus, FileSpreadsheet, Trash2, Edit3, Image as ImageIcon, Sparkles, ChevronLeft, ChevronRight, AlertCircle, FileUp, ChevronUp, ChevronDown } from 'lucide-react';
import { Product } from '../types';
import { parseCSV } from '../utils/csvParser';
import { PRESEEDED_PRODUCTS } from '../data/mockProducts';
import ImageEditorModal from './ImageEditorModal';

interface CatalogManagerProps {
  products: Product[];
  productPhotos: { [code: string]: string };
  onImportProducts: (newProducts: Product[]) => void;
  onAddManualProduct: (product: Product) => void;
  onSavePhoto: (code: string, base64Image: string) => void;
  onClearCatalog: () => void;
  onDeleteProducts: (codes: string[]) => void;
}

export default function CatalogManager({
  products,
  productPhotos,
  onImportProducts,
  onAddManualProduct,
  onSavePhoto,
  onClearCatalog,
  onDeleteProducts,
}: CatalogManagerProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Selection states for deletion
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  // Collapsible selection mode state
  const [selectionExpanded, setSelectionExpanded] = useState<boolean>(false);

  // Collapsible state for the whole catalog manager module
  const [isCatalogExpanded, setIsCatalogExpanded] = useState<boolean>(false);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'list' | 'import' | 'manual'>('list');

  // Manual input state
  const [newCode, setNewCode] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newUom, setNewUom] = useState<string>('UN');

  // CSV Import panel state
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);

  // Custom confirmation dialog states
  const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);

  // Active product for image editing
  const [editingImageProduct, setEditingImageProduct] = useState<Product | null>(null);

  // Custom alert overlay state
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Search filter (non-exact, matches multiple words in any order)
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    const words = term.split(/\s+/);
    return products.filter(p => {
      const target = `${p.code} ${p.description}`.toLowerCase();
      return words.every(word => target.includes(word));
    });
  }, [products, searchTerm]);

  // Toggle selection for all filtered products
  const isAllSelected = useMemo(() => {
    return filteredProducts.length > 0 && filteredProducts.every(p => selectedCodes.includes(p.code));
  }, [filteredProducts, selectedCodes]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all filtered products from our selection
      setSelectedCodes(prev => prev.filter(code => !filteredProducts.some(p => p.code === code)));
    } else {
      // Select all filtered products
      const newCodes = filteredProducts.map(p => p.code);
      setSelectedCodes(prev => Array.from(new Set([...prev, ...newCodes])));
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page on new search
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDesc.trim()) return;

    // Check duplicate
    if (products.some(p => p.code.toLowerCase() === newCode.trim().toLowerCase())) {
      setAlertMessage('Ya existe un artículo con este código en el catálogo.');
      return;
    }

    onAddManualProduct({
      code: newCode.trim().toUpperCase(),
      description: newDesc.trim(),
      uom: newUom.toUpperCase(),
      source: 'imported'
    });

    setNewCode('');
    setNewDesc('');
    setNewUom('UN');
    setActiveTab('list');
  };

  // CSV file handlers
  const handleCSVImport = (file: File) => {
    setCsvError(null);
    setCsvSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const result = parseCSV(text);
        if (result.products.length > 0) {
          onImportProducts(result.products);
          setCsvSuccess(`¡Éxito! Se importaron ${result.products.length} artículos al catálogo.`);
          if (result.errors.length > 0) {
            console.warn("Algunas líneas tuvieron errores:", result.errors);
          }
          setTimeout(() => setActiveTab('list'), 2000);
        } else {
          setCsvError('No se pudieron extraer artículos válidos. Verifique el formato.');
        }
      } catch (err: any) {
        setCsvError(`Error al procesar el archivo: ${err.message || err}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCSVImport(e.target.files[0]);
    }
  };

  const handleRemoteURLImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl.trim() || isFetchingUrl) return;

    setCsvError(null);
    setCsvSuccess(null);
    setIsFetchingUrl(true);

    let url = remoteUrl.trim();

    // Check if Google Drive/Docs URL and convert to direct download or CSV export link
    const driveReg = /\/d\/([a-zA-Z0-9-_]+)/;
    const idReg = /[?&]id=([a-zA-Z0-9-_]+)/;
    const match = url.match(driveReg) || url.match(idReg);
    if ((url.includes('drive.google.com') || url.includes('docs.google.com')) && match && match[1]) {
      const docId = match[1];
      if (url.includes('/file/d/') || url.includes('/file/') || url.includes('open?id=')) {
        url = `https://docs.google.com/uc?export=download&id=${docId}`;
      } else {
        url = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      const result = parseCSV(text);
      if (result.products.length > 0) {
        onImportProducts(result.products);
        setCsvSuccess(`¡Éxito! Se importaron ${result.products.length} artículos desde el enlace.`);
        setRemoteUrl('');
        setTimeout(() => setActiveTab('list'), 2000);
      } else {
        setCsvError('No se encontraron artículos válidos en el CSV de la URL. Compruebe el formato.');
      }
    } catch (err: any) {
      console.error(err);
      setCsvError(
        `Error de acceso o descarga del archivo (CORS / Permisos).\n\n` +
        `Para solucionar el error de acceso de Google Drive:\n` +
        `1. Asegúrese de cambiar el acceso general del archivo en Google Drive a "Cualquier persona con el enlace" como Lector.\n` +
        `2. Si es una Hoja de Cálculo de Google, el método óptimo es:\n` +
        `   - Ir a "Archivo" > "Compartir" > "Publicar en la web".\n` +
        `   - Cambiar a "Valores separados por comas (.csv)" en formato de enlace y copiar ese enlace.\n` +
        `3. Si persiste, puede descargar el archivo .csv a su computadora y arrastrarlo aquí abajo para cargarlo directamente.`
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type === "text/csv") {
        handleCSVImport(file);
      } else {
        setCsvError('El archivo debe ser en formato CSV (.csv)');
      }
    }
  };

  return (
    <div className="space-y-4" id="catalog-manager">
      
      {/* Tab Selector & Header */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-2xs p-3 space-y-3">
        <div
          onClick={() => setIsCatalogExpanded(!isCatalogExpanded)}
          className="w-full flex justify-between items-center text-left hover:bg-slate-50/40 p-1 rounded-lg transition-all cursor-pointer select-none"
        >
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="text-emerald-600" size={14} />
              Catálogo de Artículos
            </h2>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
              Total en catálogo: <span className="text-slate-700 font-extrabold">{products.length}</span> artículos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {products.length > PRESEEDED_PRODUCTS.length && isCatalogExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Avoid collapsing when clicking reset
                  setShowResetConfirmation(true);
                }}
                className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                id="reset-catalog-btn"
              >
                <Trash2 size={11} /> Restablecer
              </button>
            )}
            <span className="text-slate-400 p-1 hover:bg-slate-100 rounded-md transition-colors">
              {isCatalogExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        </div>

        {isCatalogExpanded && (
          <>
            {/* Tab Buttons */}
            <div className="flex border-b border-slate-100 p-0.5 bg-slate-50 rounded-lg gap-0.5 animate-fadeIn" id="catalog-tabs">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all ${
                  activeTab === 'list'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                Ver Catálogo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all ${
                  activeTab === 'import'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                Importar CSV
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                Nuevo Artículo
              </button>
            </div>

            {/* Collapsible Selection Panel (Moved inside catalog manager's main card) */}
            {activeTab === 'list' && (
              <div className="border-t border-slate-100 pt-3 mt-1" id="collapsible-selection-container">
                <button
                  type="button"
                  onClick={() => setSelectionExpanded(!selectionExpanded)}
                  className="w-full flex justify-between items-center text-[10px] font-bold text-slate-600 hover:text-slate-800 transition-colors py-0.5 animate-fadeIn"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedCodes.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span className="uppercase tracking-wider">Modo Selección / Edición Masiva</span>
                    {selectedCodes.length > 0 && (
                      <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded-full">
                        {selectedCodes.length} sel.
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                    {selectionExpanded ? 'Comprimir' : 'Expandir'}
                    {selectionExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </span>
                </button>

                {selectionExpanded && (
                  <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded-lg space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="select-all-catalog"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                          className="w-3.5 h-3.5 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-1 cursor-pointer accent-emerald-600"
                        />
                        <label htmlFor="select-all-catalog" className="cursor-pointer select-none uppercase tracking-wider text-slate-600">
                          Seleccionar todos en esta vista ({filteredProducts.length})
                        </label>
                      </div>
                      <span className="text-slate-400 font-mono">
                        Mostrando {Math.min(filteredProducts.length, itemsPerPage)} de {filteredProducts.length}
                      </span>
                    </div>

                    {selectedCodes.length > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                        <span className="text-[9px] text-red-600 font-black uppercase tracking-wider">
                          {selectedCodes.length} {selectedCodes.length === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCodes([])}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] font-black uppercase tracking-wider rounded cursor-pointer transition-colors"
                          >
                            Limpiar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirmation(true)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[8px] font-black uppercase tracking-wider rounded flex items-center gap-0.5 cursor-pointer shadow-2xs transition-colors"
                            id="delete-selected-catalog-btn"
                          >
                            <Trash2 size={9} /> Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CSV Import Panel (Separate Tab) */}
      {isCatalogExpanded && activeTab === 'import' && (
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md space-y-3 animate-fadeIn" id="csv-import-panel">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <h3 className="text-xs font-black flex items-center gap-1 text-emerald-400 uppercase tracking-wider">
              <FileUp size={14} /> Importación de Catálogo (CSV)
            </h3>
            <button onClick={() => setActiveTab('list')} className="text-slate-400 hover:text-white text-[9px] uppercase font-bold tracking-wider">Cerrar</button>
          </div>
          
          <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
            Su CSV puede tener miles de registros. Se mapearán automáticamente columnas de <span className="font-bold text-emerald-400">Código</span>, <span className="font-bold text-emerald-400">Descripción</span> y <span className="font-bold text-emerald-400">Medida (UM)</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Drag & Drop File */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col justify-center items-center ${
                dragActive ? 'border-emerald-400 bg-slate-800/50' : 'border-slate-700 hover:border-emerald-400 bg-slate-950/40'
              }`}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <FileSpreadsheet size={20} className="text-emerald-500 mb-1" />
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Arrastre planilla CSV</p>
              <p className="text-[9px] text-slate-400 mt-0.5">O haga clic para buscar archivo</p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleCSVFileChange}
                className="hidden"
              />
            </div>

            {/* Google Drive / Remote URL Form */}
            <form onSubmit={handleRemoteURLImport} className="border border-slate-800 bg-slate-950/50 rounded-lg p-3 flex flex-col justify-between gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Enlace público de Google Drive / CSV</label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/..."
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 text-[10px] rounded text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isFetchingUrl || !remoteUrl.trim()}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-505 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-[10px] uppercase tracking-wider text-white rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {isFetchingUrl ? 'Cargando...' : 'Cargar de Drive'}
              </button>
            </form>
          </div>

          {csvError && (
            <div className="p-2.5 bg-red-950/60 text-red-300 border border-red-900 rounded-lg text-[10px] flex flex-col gap-1 whitespace-pre-line leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <AlertCircle size={12} className="shrink-0 text-red-400" />
                <span>Error de Importación</span>
              </div>
              <p className="text-[9px] text-red-200 mt-0.5">{csvError}</p>
            </div>
          )}

          {csvSuccess && (
            <div className="p-2.5 bg-emerald-950/60 text-emerald-300 border border-emerald-900 rounded-lg text-[10px] flex items-center gap-1.5">
              <Sparkles size={12} className="shrink-0 animate-bounce" />
              <span className="font-bold uppercase tracking-wider">{csvSuccess}</span>
            </div>
          )}
        </div>
      )}

      {/* Manual Addition Form (Separate Tab) */}
      {isCatalogExpanded && activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 animate-fadeIn" id="manual-product-form">
          <div className="md:col-span-4 flex justify-between items-center border-b border-slate-100 pb-1.5 mb-0.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Agregar Artículo Individual</h3>
            <button type="button" onClick={() => setActiveTab('list')} className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">Cerrar</button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Código Artículo *</label>
            <input
              type="text"
              required
              placeholder="Ej: TEC-LPT-002"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase bg-slate-50 focus:bg-white focus:outline-emerald-600"
              id="new-product-code"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Descripción Detallada *</label>
            <input
              type="text"
              required
              placeholder="Ej: Laptop Administrativa Ryzen 5..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600"
              id="new-product-desc"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unidad de Medida *</label>
            <select
              value={newUom}
              onChange={(e) => setNewUom(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600"
              id="new-product-uom"
            >
              <option value="UN">UN - Unidades</option>
              <option value="KG">KG - Kilogramos</option>
              <option value="LTS">LTS - Litros</option>
              <option value="MTS">MTS - Metros</option>
              <option value="PAR">PAR - Pares</option>
              <option value="CJA">CJA - Cajas</option>
              <option value="BOB">BOB - Bobinas</option>
              <option value="PAQ">PAQ - Paquetes</option>
              <option value="SET">SET - Juegos/Sets</option>
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
              id="confirm-add-manual-product-btn"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Ver Catálogo (List tab, or always when collapsed) */}
      {(!isCatalogExpanded || activeTab === 'list') && (
        <div className="space-y-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por código o descripción en el catálogo de artículos..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-2xs placeholder:text-slate-400"
              id="catalog-search"
            />
          </div>

          {/* Catalog Grid (With 50% tag and label scale reduction for elegance) */}
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" id="catalog-grid">
              {paginatedProducts.map((p) => {
                const photo = productPhotos[p.code];
                const isSelected = selectedCodes.includes(p.code);
                return (
                  <div 
                    key={p.code} 
                    className={`bg-white border rounded-lg p-2 flex flex-col gap-1.5 justify-between hover:shadow-xs transition-all relative overflow-hidden group ${
                      isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/10 bg-emerald-50/5' : 'border-slate-100'
                    }`}
                  >
                    {/* Category stripe based on code prefix */}
                    <div className="absolute top-0 left-0 w-[1.5px] h-full bg-emerald-500" />
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          {selectionExpanded && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCodes(prev => [...prev, p.code]);
                                } else {
                                  setSelectedCodes(prev => prev.filter(c => c !== p.code));
                                }
                              }}
                              className="w-3 h-3 text-emerald-600 bg-gray-50 border-slate-200 rounded focus:ring-emerald-500/10 cursor-pointer accent-emerald-600 mr-1"
                            />
                          )}
                          {/* 50% scale reduction on Article Labels / Code badges */}
                          <span className="text-[8px] font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                            {p.code}
                          </span>
                        </div>
                        {/* 50% size reduction on UOM badge */}
                        <span className="text-[8px] font-semibold text-slate-400 font-mono">
                          UM: {p.uom}
                        </span>
                      </div>

                      {/* 50% size reduction on Descriptions */}
                      <h4 className="text-[10px] font-bold text-slate-600 line-clamp-2 h-6 leading-normal">
                        {p.description}
                      </h4>
                    </div>

                    {/* Delicate Edit Actions */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
                      <div className="w-6 h-6 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 relative">
                        {photo ? (
                          <img src={photo} alt={p.code} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={10} className="text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="text-[8px] text-slate-400 font-medium truncate">
                          {photo ? 'Con foto' : 'Sin foto'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingImageProduct(p)}
                          className="text-left text-[8px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                          id={`edit-photo-btn-${p.code}`}
                        >
                          <Edit3 size={8} /> {photo ? 'Cambiar' : 'Añadir'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center border border-slate-100 max-w-xs mx-auto space-y-2.5">
              <AlertCircle className="mx-auto text-slate-300" size={24} />
              <h3 className="text-xs font-bold text-slate-700">Sin coincidencias</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                No se encontraron artículos con "<span className="font-semibold">{searchTerm}</span>". Intente con otra palabra o agregue un artículo manual.
              </p>
            </div>
          )}

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2" id="catalog-pagination">
              <span className="text-xs text-slate-500 font-medium">
                Página <span className="font-semibold text-slate-800">{currentPage}</span> de <span className="font-semibold text-slate-800">{totalPages}</span> ({filteredProducts.length} filtrados)
              </span>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-white cursor-pointer'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-white cursor-pointer'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Photo Editor Overlay Trigger */}
      {editingImageProduct && (
        <ImageEditorModal
          productCode={editingImageProduct.code}
          productDescription={editingImageProduct.description}
          currentImage={productPhotos[editingImageProduct.code]}
          onSave={(base64Image) => onSavePhoto(editingImageProduct.code, base64Image)}
          onClose={() => setEditingImageProduct(null)}
        />
      )}

      {/* Custom Confirmation Modals (for Iframe compatibility) */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="reset-catalog-modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle size={24} className="shrink-0" />
              <h3 className="text-xs font-black uppercase tracking-wider">¿Restablecer Catálogo?</h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              ¿Está seguro de que desea borrar todos los artículos importados y restablecer el catálogo por defecto? Esta acción eliminará los cambios permanentes.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirmation(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearCatalog();
                  setShowResetConfirmation(false);
                  setActiveTab('list');
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="bulk-delete-catalog-modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 size={24} className="shrink-0" />
              <h3 className="text-xs font-black uppercase tracking-wider">¿Eliminar Artículos?</h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              ¿Está seguro de que desea eliminar permanentemente los <span className="text-slate-800 font-black">{selectedCodes.length}</span> artículos seleccionados de su catálogo?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProducts(selectedCodes);
                  setSelectedCodes([]);
                  setShowDeleteConfirmation(false);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-wider rounded cursor-pointer"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal overlay */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn" id="catalog-custom-alert-modal">
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
