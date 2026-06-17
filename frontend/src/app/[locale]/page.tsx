'use client';

import React, { useState, useMemo, useEffect } from 'react';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  tenantId: string;
  image: string;
  rating: number;
  featured: boolean;
}

interface Tenant {
  id: string;
  name: string;
  logo: string;
  category: string;
  rating: number;
  bannerGradient: string;
}

interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function MarketplacePage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartCount, setCartCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Dynamic database-driven states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');

  const categories = ['all', 'Electronics', 'Fashion', 'Lifestyle', 'Groceries'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesTenant = selectedTenantId === 'all' || product.tenantId === selectedTenantId;
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTenant && matchesCategory && matchesSearch;
    });
  }, [products, selectedTenantId, selectedCategory, searchQuery]);

  const activeTenantInfo = useMemo(() => {
    return tenants.find(t => t.id === selectedTenantId);
  }, [tenants, selectedTenantId]);

  // Fetch health check once on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        const data = await response.json();
        if (data && data.status === 'healthy') {
          setBackendHealth('healthy');
        } else {
          setBackendHealth('unhealthy');
        }
      } catch (err) {
        setBackendHealth('unhealthy');
      }
    };
    checkHealth();
  }, []);

  // Fetch active catalog directory (tenants and products)
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      setInitialError(null);
      try {
        const [tenantsRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/api/tenants`),
          fetch(`${API_URL}/api/products`)
        ]);

        if (!tenantsRes.ok || !productsRes.ok) {
          throw new Error('Failed to retrieve catalog metadata');
        }

        const tenantsData = await tenantsRes.json();
        const productsData = await productsRes.json();

        setTenants(tenantsData.tenants || []);

        const mapped = (productsData.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category,
          tenantId: p.tenant_id,
          image: p.image || '📦',
          rating: Number(p.rating),
          featured: Boolean(p.featured)
        }));
        setProducts(mapped);
      } catch (err: any) {
        setInitialError(err.message || 'Failed to initialize catalog database');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch live orders whenever active tenant changes
  useEffect(() => {
    if (selectedTenantId === 'all') {
      setOrders([]);
      setOrdersError(null);
      return;
    }

    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          headers: {
            'X-Tenant-ID': selectedTenantId,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch orders (${response.status} ${response.statusText})`);
        }
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setOrdersError(err.message || 'Failed to connect to backend service');
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [selectedTenantId]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              NEXUS
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded-full">
              Multi-Tenant
            </span>
            <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium border rounded-full flex items-center gap-1.5 ${
              backendHealth === 'healthy' 
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' 
                : backendHealth === 'unhealthy' 
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-400' 
                : 'bg-amber-950/40 border-amber-500/50 text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendHealth === 'healthy' ? 'bg-emerald-400 animate-ping' : backendHealth === 'unhealthy' ? 'bg-rose-400' : 'bg-amber-400'
              }`}></span>
              API: {backendHealth === 'healthy' ? 'Connected' : backendHealth === 'unhealthy' ? 'Disconnected' : 'Checking...'}
            </span>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block relative">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <div className="relative cursor-pointer p-2 rounded-full hover:bg-slate-900 transition-colors" onClick={() => setCartCount(0)}>
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>

            {/* User Profile Mock */}
            <div className="flex items-center gap-2 cursor-pointer border border-slate-800 rounded-full pl-2 pr-4 py-1 hover:bg-slate-900 transition-colors">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white">
                JD
              </div>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline-block">John Doe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Dynamic Tenant Banner / Hero Section */}
        <div className={`relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-gradient-to-r ${activeTenantInfo ? activeTenantInfo.bannerGradient : 'from-indigo-950 via-slate-900 to-purple-950'} transition-all duration-500 p-8 sm:p-12 md:p-16 flex flex-col justify-center min-h-[320px]`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60"></div>
          
          <div className="relative z-10 max-w-2xl flex flex-col gap-4">
            {activeTenantInfo ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-5xl p-2 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                    {activeTenantInfo.logo}
                  </span>
                  <div>
                    <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase">Featured Tenant</span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{activeTenantInfo.name}</h1>
                  </div>
                </div>
                <p className="text-lg text-indigo-100/90 font-medium">
                  Discover exclusive, premium curation from our premier vendor in {activeTenantInfo.category}.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-amber-400">★</span>
                  <span className="text-sm font-semibold text-white">{activeTenantInfo.rating} Tenant Rating</span>
                </div>
              </>
            ) : (
              <>
                <span className="inline-block self-start px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 bg-indigo-900/40 border border-indigo-500/30 rounded-full">
                  GLOBAL MULTI-TENANT MARKETPLACE
                </span>
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-200">
                  Your Hub for Regional Commerce
                </h1>
                <p className="text-lg text-slate-300">
                  Shop across multiple vetted local tenants with absolute trust, unified cart, and blazing fast global delivery.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Shop By Tenant Selector */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🏪</span> Shop By Tenant
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <button
              onClick={() => setSelectedTenantId('all')}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                selectedTenantId === 'all'
                  ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-2xl">🌍</span>
              <span className="font-semibold text-sm">All Shops</span>
            </button>
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => setSelectedTenantId(tenant.id)}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                  selectedTenantId === tenant.id
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-2xl">{tenant.logo}</span>
                <span className="font-semibold text-sm text-center truncate w-full">{tenant.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          {/* Categories Tab */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors duration-200 ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Showing <span className="font-semibold text-white">{filteredProducts.length}</span> products
            </span>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const tenant = tenants.find(t => t.id === product.tenantId);
              return (
                <div
                  key={product.id}
                  className="group relative bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5"
                >
                  <div className="relative bg-slate-950 aspect-square flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300 select-none">
                    {product.image}
                    {product.featured && (
                      <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{product.category}</span>
                        <span className="font-medium text-slate-400 flex items-center gap-0.5">
                          {tenant?.logo} {tenant?.name}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors duration-200">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-extrabold text-white">${product.price}</span>
                      <button
                        onClick={() => setCartCount(c => c + 1)}
                        className="bg-indigo-650 hover:bg-indigo-600 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <span className="text-5xl">🔍</span>
            <h3 className="text-xl font-semibold text-white">No products found</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Try modifying your search query or selecting a different category.
            </p>
          </div>
        )}

        {/* Database Verification / Isolation Log Section */}
        <section className="mt-12 bg-slate-900/30 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔒</span> Database Isolation Logs (PostgreSQL RLS)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Verifies database tenant boundaries. Setting <code>app.current_tenant_id</code> restricts query scope automatically.
              </p>
            </div>
            {selectedTenantId !== 'all' && (
              <span className="text-xs font-mono bg-indigo-950 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                Tenant Context: {selectedTenantId}
              </span>
            )}
          </div>

          {selectedTenantId === 'all' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-900 border-dashed">
              <span className="text-3xl">👥</span>
              <p className="text-sm font-medium">Select a specific tenant above to query live orders from the database.</p>
              <p className="text-xs text-slate-500">Only Apex Tech Labs and Luxe Attire contain database records in the seeded state.</p>
            </div>
          ) : ordersLoading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <span className="animate-spin text-2xl">⏳</span>
              <span className="text-sm">Querying isolated records...</span>
            </div>
          ) : ordersError ? (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-2xl p-6 flex flex-col gap-2">
              <span className="font-bold text-sm">Connection/Authorization Failure</span>
              <p className="text-xs">{ordersError}</p>
              <p className="text-[10px] text-slate-500 mt-2">
                Note: Verify that the backend stack is running locally (port 8080) or on Cloud Run and that CORS allows requests from this origin.
              </p>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-4">Order ID</th>
                    <th className="pb-3">Order Number</th>
                    <th className="pb-3">Customer ID</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pl-4 text-slate-500 truncate max-w-[120px]" title={order.id}>
                        {order.id}
                      </td>
                      <td className="py-4 font-bold text-indigo-400">{order.order_number}</td>
                      <td className="py-4 text-slate-500 truncate max-w-[120px]" title={order.customer_id}>
                        {order.customer_id}
                      </td>
                      <td className="py-4 font-semibold text-white">
                        {order.total_amount} {order.currency}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.status === 'completed' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-950 text-amber-400 border border-amber-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-slate-400">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-900 border-dashed">
              <span className="text-3xl">📭</span>
              <p className="text-sm font-medium">No live orders found in the database context for this tenant.</p>
              <p className="text-xs text-slate-500">Row-Level Security queries returned 0 results cleanly.</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              NEXUS
            </span>
            <span className="text-sm text-slate-500">© 2026 Nexus Marketplace Inc. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

