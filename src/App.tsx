/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  ShoppingBag, 
  FileSpreadsheet, 
  Sparkles, 
  Building2, 
  ShieldAlert, 
  User, 
  Users, 
  LogOut, 
  PlusCircle, 
  Lock, 
  Briefcase, 
  Smartphone,
  Wifi,
  Battery,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product, Order, User as UserType } from './types';
import { PRESEEDED_PRODUCTS } from './data/mockProducts';
import CatalogManager from './components/CatalogManager';
import OrderCreator from './components/OrderCreator';
import OrderList from './components/OrderList';

const SECTORS = ['Sistemas', 'Producción', 'Mantenimiento', 'Logística', 'Administración', 'Seguridad', 'Jefe, Administrador'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'catalog' | 'profile'>('create');
  
  // Auth & Multi-user state
  const [users, setUsers] = useState<UserType[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<UserType | null>(null);
  
  // Login / Register Form states
  const [loginUsername, setLoginUsername] = useState<string>('Degesa');
  const [loginPassword, setLoginPassword] = useState<string>('1234');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isProfileRegisterExpanded, setIsProfileRegisterExpanded] = useState<boolean>(false);
  
  // Register Form states
  const [regFullName, setRegFullName] = useState<string>('');
  const [regSector, setRegSector] = useState<string>('Sistemas');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [productPhotos, setProductPhotos] = useState<{ [code: string]: string }>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Live status bar clock simulation
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize data from LocalStorage or pre-seed
  useEffect(() => {
    try {
      // 1. Load users & credentials
      const storedUsersRaw = localStorage.getItem('requisition_users_v2');
      let loadedUsers: any[] = [];
      if (storedUsersRaw) {
        try {
          loadedUsers = JSON.parse(storedUsersRaw);
          // Force update 'degesa' user to Gerardo / Jefe, Administrador
          loadedUsers = loadedUsers.map(u => {
            if (u.username.toLowerCase() === 'degesa') {
              return {
                ...u,
                fullName: 'Gerardo',
                sector: 'Jefe, Administrador'
              };
            }
            return u;
          });
          localStorage.setItem('requisition_users_v2', JSON.stringify(loadedUsers));
          setUsers(loadedUsers);
        } catch (e) {
          loadedUsers = [];
        }
      }
      
      if (!storedUsersRaw || loadedUsers.length === 0) {
        const seedUsers: UserType[] = [
          {
            id: 'degesa-admin',
            username: 'degesa',
            fullName: 'Gerardo',
            sector: 'Jefe, Administrador',
            createdAt: new Date().toISOString()
          }
        ];
        // We store passwords alongside users in this lightweight demo setup
        // Let's attach a password parameter to the saved object
        const seedUsersWithPass = seedUsers.map(u => ({ ...u, password: '1234' }));
        localStorage.setItem('requisition_users_v2', JSON.stringify(seedUsersWithPass));
        setUsers(seedUsersWithPass);
      }

      // 2. Load products
      const storedProducts = localStorage.getItem('requisition_products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(PRESEEDED_PRODUCTS);
        localStorage.setItem('requisition_products', JSON.stringify(PRESEEDED_PRODUCTS));
      }

      // 3. Load product photos
      const storedPhotos = localStorage.getItem('requisition_product_photos');
      if (storedPhotos) {
        setProductPhotos(JSON.parse(storedPhotos));
      }

      // 4. Load orders
      const storedOrders = localStorage.getItem('requisition_orders');
      if (storedOrders) {
        const parsedOrders: Order[] = JSON.parse(storedOrders);
        // Ensure legacy orders get a sector stamp so they don't break UI
        const correctedOrders = parsedOrders.map(o => ({
          ...o,
          sector: o.sector || 'Sistemas',
          createdById: o.createdById || 'degesa-admin'
        }));
        setOrders(correctedOrders);
      }
    } catch (err) {
      console.error("Error reading from localStorage:", err);
    }
  }, []);

  // Sync methods
  const handleImportProducts = (newProducts: Product[]) => {
    const combined = [...newProducts, ...products.filter(p => !newProducts.some(n => n.code === p.code))];
    setProducts(combined);
    localStorage.setItem('requisition_products', JSON.stringify(combined));
  };

  const handleAddManualProduct = (product: Product) => {
    const updated = [product, ...products];
    setProducts(updated);
    localStorage.setItem('requisition_products', JSON.stringify(updated));
  };

  const handleSavePhoto = (code: string, base64Image: string) => {
    const updated = { ...productPhotos, [code]: base64Image };
    setProductPhotos(updated);
    localStorage.setItem('requisition_product_photos', JSON.stringify(updated));
  };

  const handleClearCatalog = () => {
    setProducts(PRESEEDED_PRODUCTS);
    localStorage.setItem('requisition_products', JSON.stringify(PRESEEDED_PRODUCTS));
  };

  const handleDeleteProducts = (codesToDelete: string[]) => {
    const updated = products.filter(p => !codesToDelete.includes(p.code));
    setProducts(updated);
    localStorage.setItem('requisition_products', JSON.stringify(updated));
  };

  const handleSaveOrder = (newOrder: Order) => {
    if (!loggedInUser) return;
    
    // Auto stamp with current user details and current sector
    const stampedOrder: Order = {
      ...newOrder,
      requestedBy: loggedInUser.fullName,
      createdById: loggedInUser.id,
      sector: loggedInUser.sector
    };

    let updatedOrders: Order[];
    
    if (orders.some(o => o.id === stampedOrder.id)) {
      // Edit mode
      updatedOrders = orders.map(o => o.id === stampedOrder.id ? stampedOrder : o);
    } else {
      // New order
      updatedOrders = [stampedOrder, ...orders];
    }

    setOrders(updatedOrders);
    localStorage.setItem('requisition_orders', JSON.stringify(updatedOrders));
    setEditingOrder(null);
    setActiveTab('list'); // Switch to view list
  };

  const handleDeleteOrder = (id: string) => {
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    localStorage.setItem('requisition_orders', JSON.stringify(updated));
  };

  const handleEditOrderRequest = (order: Order) => {
    setEditingOrder(order);
    setActiveTab('create');
  };

  // Auth Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const normUser = loginUsername.trim().toLowerCase();
    const foundUser = users.find(u => u.username.toLowerCase() === normUser);
    
    // Check match against stored credentials
    // Note: seed users have stored password inside the object
    const castedUser = foundUser as any;
    if (castedUser && castedUser.password === loginPassword) {
      setLoggedInUser(foundUser);
      setLoginPassword('');
      setActiveTab('create');
    } else {
      setAuthError('Usuario o contraseña incorrectos. Pruebe Degesa / 1234');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setRegSuccess(null);

    if (!regFullName.trim() || !regUsername.trim() || !regPassword) {
      setAuthError('Por favor, rellene todos los campos del formulario.');
      return;
    }

    const normUsername = regUsername.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === normUsername)) {
      setAuthError('El nombre de usuario ya se encuentra registrado.');
      return;
    }

    const newUser: UserType & { password?: string } = {
      id: crypto.randomUUID(),
      username: regUsername.trim(),
      fullName: regFullName.trim(),
      sector: regSector,
      password: regPassword, // Lightweight persistence model
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('requisition_users_v2', JSON.stringify(updatedUsers));

    setRegSuccess(`¡Usuario registrado con éxito para el sector ${regSector}! Inicie sesión ahora.`);
    setRegFullName('');
    setRegUsername('');
    setRegPassword('');
    setTimeout(() => {
      setIsRegistering(false);
      setRegSuccess(null);
    }, 2000);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setEditingOrder(null);
  };

  // Filter orders by sector
  const sectorOrders = orders.filter(o => o.sector === loggedInUser?.sector);

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans items-center justify-center p-0 md:p-6 text-slate-100 select-none">
      
      {/* PHONE FRAME WORKSPACE */}
      <div className="w-full max-w-md h-screen md:h-[840px] bg-slate-900 border-0 md:border-[10px] md:border-slate-800 rounded-none md:rounded-[42px] shadow-2xl flex flex-col overflow-hidden relative border-slate-700/50" id="mobile-app-frame">
        
        {/* Dynamic Status Bar (Simulated Smartphone HUD) */}
        <div className="bg-slate-950 text-slate-400 text-[11px] font-mono font-bold tracking-tight px-6 py-2.5 flex justify-between items-center select-none shrink-0 border-b border-slate-900/40 z-20">
          <span className="text-white">{currentTime}</span>
          <div className="w-16 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 hidden md:block"></div> {/* iPhone notch spacer */}
          <div className="flex items-center gap-1.5">
            <Wifi size={12} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-500 font-mono">LTE</span>
            <Battery size={14} className="text-emerald-500 rotate-0" />
          </div>
        </div>

        {/* APP CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-950 flex flex-col relative pb-20">
          
          {!loggedInUser ? (
            /* ================= LOGIN & REGISTER GATE ================= */
            <div className="flex-1 flex flex-col justify-center px-6 py-8" id="auth-gate">
              {/* Brand Logo Header */}
              <div className="text-center space-y-3 mb-8">
                <div className="inline-flex bg-emerald-600/10 border border-emerald-500/20 p-3.5 rounded-2xl text-emerald-400 shadow-md animate-pulse">
                  <Building2 size={32} className="stroke-[1.5]" />
                </div>
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-emerald-400 font-bold uppercase leading-none block">Planta Central DEGESA</span>
                  <h1 className="text-xl font-extrabold tracking-tight text-white mt-1">Requisiciones Móvil</h1>
                  <p className="text-xs text-slate-400 mt-1">Plataforma corporativa de compras por sector</p>
                </div>
              </div>

              {!isRegistering ? (
                /* LOGIN SCREEN */
                <form onSubmit={handleLogin} className="space-y-4" id="login-form">
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                    <h2 className="text-sm font-bold text-white tracking-wide border-b border-slate-800 pb-2">Iniciar Sesión</h2>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Usuario corporativo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Degesa"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm rounded-xl text-white outline-none font-medium placeholder:text-slate-600"
                        id="login-username-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Contraseña</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          placeholder="••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm rounded-xl text-white outline-none font-medium placeholder:text-slate-600 font-mono"
                          id="login-password-input"
                        />
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-700" size={14} />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl tracking-wide uppercase transition-colors cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                    >
                      Ingresar al Sistema
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-950/40 text-red-300 border border-red-900/40 rounded-xl text-[11px] flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0 text-red-400" />
                      <span>{authError}</span>
                    </div>
                  )}
                </form>
              ) : (
                /* USER REGISTRATION SCREEN */
                <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn" id="register-form">
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3.5">
                    <h2 className="text-sm font-bold text-white tracking-wide border-b border-slate-800 pb-2">Registrar Usuario de Sector</h2>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Ing. Pedro Perez"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm rounded-xl text-white outline-none font-medium placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Sector o Departamento</label>
                      <select
                        value={regSector}
                        onChange={(e) => setRegSector(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm rounded-xl text-white outline-none font-medium cursor-pointer"
                      >
                        {SECTORS.map(s => (
                          <option key={s} value={s} className="bg-slate-950 text-white">{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Usuario</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: pperez"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm rounded-xl text-white outline-none font-medium placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Contraseña</label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 4 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm rounded-xl text-white outline-none font-medium placeholder:text-slate-600 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl tracking-wide uppercase transition-colors cursor-pointer mt-1"
                    >
                      Registrar & Asignar Sector
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-950/40 text-red-300 border border-red-900/40 rounded-xl text-[11px] flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0 text-red-400" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {regSuccess && (
                    <div className="p-3 bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 rounded-xl text-[11px] flex items-center gap-2">
                      <Sparkles size={14} className="shrink-0 text-emerald-400" />
                      <span>{regSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => { setIsRegistering(false); setAuthError(null); }}
                    className="w-full py-2.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/20 text-slate-400 font-bold text-xs rounded-xl tracking-wide uppercase transition-all cursor-pointer"
                  >
                    Volver al Inicio
                  </button>
                </form>
              )}

            </div>
          ) : (
            /* ================= ACTIVE LOGGED IN WORKSPACE ================= */
            <>
              
              {/* TOP HEADER WITH SECTOR BADGE & LOGOUT */}
              <header className="bg-slate-900 border-b border-slate-800/80 px-4 py-3.5 shrink-0 flex items-center justify-between sticky top-0 z-10 no-print" id="app-header">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h1 className="text-xs font-black tracking-tight text-white leading-none">Requisiciones</h1>
                    <div className="flex items-center gap-1.5 mt-0.5 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide">{loggedInUser.sector}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 max-w-[80px] truncate text-right block leading-none">
                    {loggedInUser.fullName.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Cerrar Sesión"
                    className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-950 border border-slate-800 hover:border-red-950 rounded-lg cursor-pointer transition-colors"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </header>

              {/* MAIN TAB SWITCHER */}
              <div className="flex-1 p-4 overflow-y-auto no-print">
                
                {activeTab === 'list' && (
                  <OrderList
                    orders={sectorOrders}
                    onEditOrder={handleEditOrderRequest}
                    onDeleteOrder={handleDeleteOrder}
                    onNavigateToCreate={() => setActiveTab('create')}
                  />
                )}

                {activeTab === 'create' && (
                  <OrderCreator
                    products={products}
                    productPhotos={productPhotos}
                    editingOrder={editingOrder}
                    currentUser={loggedInUser!}
                    onSaveOrder={handleSaveOrder}
                    onCancelEdit={() => {
                      setEditingOrder(null);
                      setActiveTab('list');
                    }}
                    onSavePhoto={handleSavePhoto}
                  />
                )}

                {activeTab === 'catalog' && (
                  <CatalogManager
                    products={products}
                    productPhotos={productPhotos}
                    onImportProducts={handleImportProducts}
                    onAddManualProduct={handleAddManualProduct}
                    onSavePhoto={handleSavePhoto}
                    onClearCatalog={handleClearCatalog}
                    onDeleteProducts={handleDeleteProducts}
                  />
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6 animate-fadeIn" id="profile-panel">
                    
                    {/* User info card */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md uppercase">
                          {loggedInUser.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{loggedInUser.fullName}</h3>
                          <p className="text-xs text-slate-400 font-medium">Usuario: @{loggedInUser.username}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Sector de Trabajo:</span>
                        <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 font-black rounded-full font-mono text-[10px]">
                          {loggedInUser.sector}
                        </span>
                      </div>
                    </div>

                    {/* Sectors isolation information */}
                    <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-2 text-xs leading-relaxed text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <ShieldAlert className="text-emerald-500" size={14} />
                        <span>Aislamiento por Sectores</span>
                      </div>
                      <p className="text-[11px]">
                        Usted pertenece al sector <span className="text-white font-semibold">{loggedInUser.sector}</span>. Solo podrá visualizar, crear, editar y generar PDF de requisiciones correspondientes a su sector. Otros sectores tendrán accesos completamente independientes.
                      </p>
                    </div>

                    {/* Collapsible Register Section inside profile (Moved from login screen) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileRegisterExpanded(!isProfileRegisterExpanded);
                          setAuthError(null);
                          setRegSuccess(null);
                        }}
                        className="w-full flex justify-between items-center text-left focus:outline-none hover:bg-slate-800/30 p-1 rounded-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Registrar Nuevo Usuario / Sector</h4>
                        </div>
                        <span className="text-slate-400">
                          {isProfileRegisterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </button>

                      {isProfileRegisterExpanded && (
                        <form onSubmit={handleRegister} className="space-y-3.5 pt-2 border-t border-slate-800/80 animate-fadeIn" id="profile-register-form">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Nombre Completo</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Ing. Pedro Perez"
                              value={regFullName}
                              onChange={(e) => setRegFullName(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs rounded-xl text-white outline-none font-medium placeholder:text-slate-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Sector o Departamento</label>
                            <select
                              value={regSector}
                              onChange={(e) => setRegSector(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs rounded-xl text-white outline-none font-medium cursor-pointer"
                            >
                              {SECTORS.map(s => (
                                <option key={s} value={s} className="bg-slate-950 text-white">{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Usuario</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: pperez"
                              value={regUsername}
                              onChange={(e) => setRegUsername(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs rounded-xl text-white outline-none font-medium placeholder:text-slate-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Contraseña</label>
                            <input
                              type="password"
                              required
                              placeholder="Mínimo 4 caracteres"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs rounded-xl text-white outline-none font-medium placeholder:text-slate-600 font-mono"
                            />
                          </div>

                          {authError && (
                            <div className="p-3 bg-red-950/40 text-red-300 border border-red-900/40 rounded-xl text-[11px] flex items-center gap-2">
                              <AlertCircle size={14} className="shrink-0 text-red-400" />
                              <span>{authError}</span>
                            </div>
                          )}

                          {regSuccess && (
                            <div className="p-3 bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 rounded-xl text-[11px] flex items-center gap-2">
                              <Sparkles size={14} className="shrink-0 text-emerald-400" />
                              <span>{regSuccess}</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl tracking-wide uppercase transition-colors cursor-pointer mt-1"
                          >
                            Registrar & Asignar Sector
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Registered users tracker */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <Users size={14} className="text-emerald-400" />
                        <h4 className="text-xs font-bold text-white">Usuarios del Sistema ({users.length})</h4>
                      </div>
                      
                      <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto pr-1">
                        {users.map(u => (
                          <div key={u.id} className="py-2 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-slate-300">{u.fullName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">@{u.username}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-slate-400 uppercase font-mono">
                              {u.sector}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* STICKY BOTTOM TAB NAVIGATION */}
              <nav className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around py-2.5 px-4 z-20 no-print shadow-2xl">
                <button
                  onClick={() => {
                    setActiveTab('list');
                    setEditingOrder(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all ${
                    activeTab === 'list' ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  id="nav-view-orders-btn"
                >
                  <ClipboardList size={18} className={activeTab === 'list' ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
                  <span className="text-[9px] font-bold tracking-wide">Pedidos</span>
                </button>

                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all ${
                    activeTab === 'create' ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  id="nav-create-order-btn"
                >
                  <PlusCircle size={18} className={activeTab === 'create' ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
                  <span className="text-[9px] font-bold tracking-wide">Nuevo</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('catalog');
                    setEditingOrder(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all ${
                    activeTab === 'catalog' ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  id="nav-catalog-btn"
                >
                  <FileSpreadsheet size={18} className={activeTab === 'catalog' ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
                  <span className="text-[9px] font-bold tracking-wide">Catálogo</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setEditingOrder(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer select-none transition-all ${
                    activeTab === 'profile' ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  id="nav-profile-btn"
                >
                  <User size={18} className={activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
                  <span className="text-[9px] font-bold tracking-wide">Perfil</span>
                </button>
              </nav>

            </>
          )}

        </div>

      </div>

    </div>
  );
}
