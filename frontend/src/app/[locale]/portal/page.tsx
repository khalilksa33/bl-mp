'use client';

import React, { useState, useEffect, useTransition, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const logoOptions = ['⚙️', '🔌', '🚗', '🛻', '🔋', '📐', '🔧', '🏎️', '🏪', '🛠️', '🚛'];

const translations = {
  en: {
    title: 'Vendor Portal',
    subtitle: 'Manage your products, services, and track your store orders securely',
    loginTitle: 'Access Your Portal',
    loginSubtitle: 'Enter your Secret Tenant ID to enter your isolated space',
    tenantIdLabel: 'Secret Tenant ID (UUID)',
    tenantIdPlaceholder: 'e.g., 11111111-1111-1111-1111-111111111111',
    loginBtn: 'Enter Portal',
    logoutBtn: 'Exit Portal',
    activeTabDashboard: 'Dashboard',
    activeTabProducts: 'Manage Catalog',
    activeTabOrders: 'Customer Orders',
    bizType: 'Business Type',
    bizSubdomain: 'Subdomain URL',
    ownerName: 'Contact Owner',
    email: 'Email',
    phone: 'Phone',
    rlsBadge: 'PostgreSQL RLS Protected',
    rlsDesc: 'Row-Level Security ensures you only view your own orders.',
    addProductBtn: 'Add Product / Service',
    prodName: 'Product/Service Name',
    prodPrice: 'Price',
    prodCategory: 'Category',
    prodImage: 'Emoji Icon',
    featuredLabel: 'Featured on Homepage',
    cancel: 'Cancel',
    save: 'Save Item',
    deleteBtn: 'Delete',
    noProducts: 'No products or services listed yet. Add one above!',
    noOrders: 'No orders placed yet for your business.',
    orderNum: 'Order Number',
    orderAmount: 'Amount',
    orderStatus: 'Status',
    orderDate: 'Date',
    actions: 'Actions',
    loading: 'Synchronizing secure database context...',
    errorTitle: 'Access Error',
    backBtn: 'Back to Marketplace',
  },
  ar: {
    title: 'بوابة إدارة البائعين',
    subtitle: 'إدارة خدماتك، منتجاتك، ومتابعة الطلبات الخاصة بك بأمان تام',
    loginTitle: 'الدخول إلى لوحة التحكم',
    loginSubtitle: 'أدخل معرّف المتجر السري (Tenant ID) للوصول إلى مساحتك الخاصة المعزولة',
    tenantIdLabel: 'معرّف المتجر السري (UUID)',
    tenantIdPlaceholder: 'مثال: 11111111-1111-1111-1111-111111111111',
    loginBtn: 'دخول اللوحة',
    logoutBtn: 'تسجيل الخروج',
    activeTabDashboard: 'لوحة التحكم',
    activeTabProducts: 'إدارة المنتجات والخدمات',
    activeTabOrders: 'طلبات العملاء',
    bizType: 'نوع النشاط',
    bizSubdomain: 'رابط المتجر الفرعي',
    ownerName: 'مسؤول الاتصال',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    rlsBadge: 'حماية معززة بقواعد RLS',
    rlsDesc: 'تضمن سياسة Row-Level Security في قاعدة البيانات عدم اطلاع أي بائع آخر على طلباتك.',
    addProductBtn: 'إضافة منتج أو خدمة جديدة',
    prodName: 'اسم المنتج / الخدمة',
    prodPrice: 'السعر',
    prodCategory: 'التصنيف',
    prodImage: 'أيقونة معبرة (Emoji)',
    featuredLabel: 'تمييز في الصفحة الرئيسية',
    cancel: 'إلغاء',
    save: 'حفظ العنصر',
    deleteBtn: 'حذف',
    noProducts: 'لا توجد منتجات أو خدمات مضافة حتى الآن. أضف أول خدمة لك!',
    noOrders: 'لا توجد طلبات مسجلة لنشاطك التجاري حالياً.',
    orderNum: 'رقم الطلب',
    orderAmount: 'المبلغ الإجمالي',
    orderStatus: 'الحالة',
    orderDate: 'التاريخ',
    actions: 'الإجراءات',
    loading: 'جاري مزامنة بيانات المتجر الآمنة...',
    errorTitle: 'خطأ في الدخول',
    backBtn: 'العودة للموقع الرئيسي',
  }
};

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as 'en' | 'ar') || 'en';
  const t = translations[locale] || translations.en;

  const [tenantIdInput, setTenantIdInput] = useState('');
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');

  // Backend state
  const [tenant, setTenant] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Product Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    image: '🛠️',
    featured: false
  });

  const [isPending, startTransition] = useTransition();

  // Read URL query parameter if present on mount
  useEffect(() => {
    const urlId = searchParams.get('tenant_id');
    if (urlId) {
      setActiveTenantId(urlId);
      setTenantIdInput(urlId);
    }
  }, [searchParams]);

  // Sync data when active tenant changes
  useEffect(() => {
    if (!activeTenantId) {
      setTenant(null);
      setProducts([]);
      setOrders([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all tenants to find profile matching current ID
        const tenantsRes = await fetch(`${API_URL}/api/tenants`);
        if (!tenantsRes.ok) throw new Error('Failed to fetch vendor list');
        const tenantsData = await tenantsRes.json();
        const found = (tenantsData.tenants || []).find((t: any) => t.id === activeTenantId);

        if (!found) {
          throw new Error(locale === 'ar' ? 'المعرّف غير صحيح أو غير مسجل كبائع.' : 'Tenant ID not found or unregistered.');
        }
        setTenant(found);

        // Fetch products isolated by this tenant
        const prodRes = await fetch(`${API_URL}/api/products?tenant_id=${activeTenantId}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }

        // Fetch orders isolated by this tenant (passes X-Tenant-ID to enforce RLS)
        const orderRes = await fetch(`${API_URL}/api/orders`, {
          headers: {
            'X-Tenant-ID': activeTenantId
          }
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(orderData.orders || []);
        }
      } catch (err: any) {
        setError(err.message || 'Error communicating with database.');
        setActiveTenantId(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTenantId, locale]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = tenantIdInput.trim();
    if (cleanId) {
      setActiveTenantId(cleanId);
    }
  };

  const handleLogout = () => {
    setActiveTenantId(null);
    setTenantIdInput('');
    setTenant(null);
    setProducts([]);
    setOrders([]);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenantId) return;

    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          image: newProduct.image,
          featured: newProduct.featured
        };

        const res = await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': activeTenantId
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error('Failed to save product/service.');
        }

        const data = await res.json();
        setProducts(prev => [data.product, ...prev]);
        setShowAddForm(false);
        setNewProduct({
          name: '',
          price: '',
          category: '',
          image: '🛠️',
          featured: false
        });
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!activeTenantId) return;
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا العنصر؟' : 'Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`${API_URL}/api/products?id=${prodId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': activeTenantId
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete item.');
      }

      setProducts(prev => prev.filter(p => p.id !== prodId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isRtl = locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-900/80 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <span 
            className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
            onClick={() => router.push(`/${locale}`)}
          >
            NEXUS
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-full transition-all"
            >
              {t.backBtn}
            </button>
            {tenant && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-950 hover:border-rose-900 bg-rose-950/10 rounded-full transition-all"
              >
                {t.logoutBtn}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex justify-between items-center">
            <span><strong>{t.errorTitle}:</strong> {error}</span>
            <button onClick={() => setError(null)} className="font-bold hover:text-white">✕</button>
          </div>
        )}

        {!tenant ? (
          /* LOGIN FORM */
          <div className="max-w-md w-full mx-auto my-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col gap-2 mb-6">
              <h1 className="text-2xl font-extrabold text-white">{t.loginTitle}</h1>
              <p className="text-xs text-slate-400">{t.loginSubtitle}</p>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.tenantIdLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.tenantIdPlaceholder}
                  value={tenantIdInput}
                  onChange={(e) => setTenantIdInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-98"
              >
                {t.loginBtn}
              </button>
            </form>
          </div>
        ) : loading ? (
          /* LOADING INDICATOR */
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <span className="animate-spin text-3xl">⏳</span>
            <span className="text-sm font-medium">{t.loading}</span>
          </div>
        ) : (
          /* DASHBOARD */
          <div className="flex flex-col gap-8">
            {/* Vendor Banner */}
            <div className={`relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r ${tenant.bannerGradient || 'from-indigo-600 to-indigo-900'} p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl`}>
              <div className="flex items-center gap-4 relative z-10">
                <span className="text-5xl p-2 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                  {tenant.logo || '🏪'}
                </span>
                <div>
                  <span className="text-xs font-bold tracking-widest text-indigo-200 uppercase">{tenant.category}</span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{tenant.name}</h1>
                  <span className="text-[10px] font-mono bg-slate-950/40 text-slate-300 px-2 py-0.5 rounded border border-white/5 mt-1 inline-block">
                    ID: {tenant.id}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-start sm:items-end justify-center relative z-10">
                <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t.rlsBadge}
                </span>
                <span className="text-[10px] text-indigo-200 mt-1 max-w-xs text-left sm:text-right">
                  {t.rlsDesc}
                </span>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex border-b border-slate-850 gap-2">
              {(['dashboard', 'products', 'orders'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
                    activeTab === tab 
                      ? 'border-indigo-500 text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'dashboard' ? t.activeTabDashboard : tab === 'products' ? t.activeTabProducts : t.activeTabOrders}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: PROFILE/DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold">{locale === 'ar' ? 'إجمالي المنتجات' : 'Total Listed Products'}</span>
                  <span className="text-3xl font-extrabold text-white">{products.length}</span>
                </div>
                <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold">{locale === 'ar' ? 'إجمالي الطلبات' : 'Total Incoming Orders'}</span>
                  <span className="text-3xl font-extrabold text-indigo-400">{orders.length}</span>
                </div>
                <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold">{locale === 'ar' ? 'تقييم المتجر' : 'Store Rating'}</span>
                  <span className="text-3xl font-extrabold text-amber-400">★ {tenant.rating || '5.0'}</span>
                </div>

                {/* Profile Details */}
                <div className="md:col-span-3 bg-slate-900/20 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-white mb-2">{locale === 'ar' ? 'تفاصيل المنشأة' : 'Business Registry Details'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold">{t.ownerName}</span>
                      <span className="font-semibold text-slate-200">{tenant.owner_name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold">{t.bizType}</span>
                      <span className="font-semibold text-slate-200 capitalize">{tenant.business_type?.replace(/_/g, ' ') || tenant.category}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold">{t.email}</span>
                      <span className="font-semibold text-slate-200">{tenant.email || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-semibold">{t.phone}</span>
                      <span className="font-semibold text-slate-200">{tenant.phone || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-xs text-slate-500 font-semibold">{t.bizSubdomain}</span>
                      <span className="font-semibold text-indigo-400 font-mono">{tenant.subdomain}.nexus.io</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PRODUCT MANAGER */}
            {activeTab === 'products' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center gap-4">
                  <h3 className="text-lg font-bold text-white">{locale === 'ar' ? 'الكتالوج الخاص بك' : 'Product & Service Directory'}</h3>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    {t.addProductBtn}
                  </button>
                </div>

                {showAddForm && (
                  <form onSubmit={handleAddProduct} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-white">{t.addProductBtn}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{t.prodName}</label>
                        <input
                          type="text"
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{t.prodPrice}</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newProduct.price}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{t.prodCategory}</label>
                        <input
                          type="text"
                          required
                          value={newProduct.category}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{t.prodImage}</label>
                        <select
                          value={newProduct.image}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          {logoOptions.map(emoji => (
                            <option key={emoji} value={emoji}>{emoji}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2 mt-2">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={newProduct.featured}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, featured: e.target.checked }))}
                          className="w-4 h-4 accent-indigo-650 cursor-pointer"
                        />
                        <label htmlFor="featured" className="text-xs text-slate-300 font-medium cursor-pointer">
                          {t.featuredLabel}
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                      >
                        {t.save}
                      </button>
                    </div>
                  </form>
                )}

                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden p-4 flex flex-col justify-between gap-4"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-4xl">{product.image}</span>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-rose-500 hover:text-rose-400 text-xs font-bold transition-colors"
                          >
                            {t.deleteBtn}
                          </button>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{product.category}</span>
                          <h4 className="font-bold text-white text-sm truncate mt-0.5">{product.name}</h4>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-extrabold text-white">${product.price}</span>
                          {product.featured && (
                            <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-400 text-xs">
                    {t.noProducts}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ORDERS (RLS PROOF) */}
            {activeTab === 'orders' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400">🛡️</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{locale === 'ar' ? 'طلبات متجرك' : 'Isolated Store Orders'}</h3>
                    <p className="text-[10px] text-slate-500">
                      {locale === 'ar' 
                        ? 'تُظهر هذه القائمة فقط الطلبات التي تمت تصفيتها عبر سياسة RLS لمتجرك بقاعدة البيانات.' 
                        : 'PostgreSQL engine enforces table-level filtering. Orders belonging to other vendors are strictly invisible.'}
                    </p>
                  </div>
                </div>

                {orders.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-900/10">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">{t.orderNum}</th>
                          <th className="py-3">{t.orderAmount}</th>
                          <th className="py-3">{t.orderStatus}</th>
                          <th className="py-3 px-4">{t.orderDate}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/50 font-mono">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-4 px-4 font-bold text-indigo-400">{order.order_number}</td>
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
                            <td className="py-4 px-4 text-slate-400">
                              {new Date(order.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-400 text-xs">
                    {t.noOrders}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 py-6 text-center text-xs text-slate-500">
        © 2026 Nexus Marketplace Inc. All rights reserved.
      </footer>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="animate-spin text-3xl">⏳</span>
          <span className="text-sm font-semibold">Initializing Portal Context...</span>
        </div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
