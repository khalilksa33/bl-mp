'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const translations = {
  en: {
    title: 'Super Admin Dashboard',
    subtitle: 'System-wide overview of all registered multi-tenant business entities',
    statsTotalVendors: 'Total Registered Vendors',
    statsActiveTypes: 'Active Business Domains',
    statsAvgRating: 'Platform Avg Rating',
    vendorListTitle: 'Active Marketplace Tenants',
    colName: 'Business Name / Subdomain',
    colType: 'Business Domain',
    colOwner: 'Owner / Contact',
    colContact: 'Contact Details',
    colTenantId: 'Tenant ID Context',
    colRating: 'Rating',
    noVendors: 'No vendors registered on this platform.',
    backBtn: 'Back to Marketplace',
    loading: 'Loading platform metadata...',
    copyBtn: 'Copy ID',
    copiedBtn: 'Copied!'
  },
  ar: {
    title: 'لوحة تحكم المسؤول الرئيسي',
    subtitle: 'نظرة شاملة على جميع الشركات والمستأجرين المسجلين في المنصة',
    statsTotalVendors: 'إجمالي البائعين والشركاء',
    statsActiveTypes: 'مجالات الأعمال النشطة',
    statsAvgRating: 'متوسط تقييم المنصة',
    vendorListTitle: 'المستأجرين النشطين في السوق',
    colName: 'اسم المنشأة / النطاق الفرعي',
    colType: 'مجال العمل',
    colOwner: 'المالك / المسؤول',
    colContact: 'تفاصيل الاتصال',
    colTenantId: 'معرّف المستأجر (ID)',
    colRating: 'التقييم',
    noVendors: 'لا يوجد شركاء مسجلين في النظام حالياً.',
    backBtn: 'العودة للموقع الرئيسي',
    loading: 'جاري تحميل بيانات النظام الشاملة...',
    copyBtn: 'نسخ المعرّف',
    copiedBtn: 'تم النسخ!'
  }
};

export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as 'en' | 'ar') || 'en';
  const t = translations[locale] || translations.en;

  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/tenants`);
        if (!res.ok) throw new Error('Failed to retrieve system tenants.');
        const data = await res.json();
        setTenants(data.tenants || []);
      } catch (err: any) {
        setError(err.message || 'Error communicating with database.');
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const uniqueBusinessTypesCount = new Set(
    tenants.map(t => t.business_type || t.category).filter(Boolean)
  ).size;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[150px]"></div>
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
          <button
            onClick={() => router.push(`/${locale}`)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-full transition-all"
          >
            {t.backBtn}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t.title}</h1>
          <p className="text-sm text-slate-400 mt-1">{t.subtitle}</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <span className="animate-spin text-3xl">⏳</span>
            <span className="text-sm font-medium">{t.loading}</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-semibold">{t.statsTotalVendors}</span>
                <span className="text-4xl font-black text-white">{tenants.length}</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-semibold">{t.statsActiveTypes}</span>
                <span className="text-4xl font-black text-indigo-400">{uniqueBusinessTypesCount}</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-semibold">{t.statsAvgRating}</span>
                <span className="text-4xl font-black text-amber-400">★ 4.8</span>
              </div>
            </div>

            {/* Tenant Table */}
            <section className="bg-slate-900/10 border border-slate-850 rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">{t.vendorListTitle}</h2>

              {tenants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-3 pl-4">{t.colName}</th>
                        <th className="pb-3">{t.colType}</th>
                        <th className="pb-3">{t.colOwner}</th>
                        <th className="pb-3">{t.colContact}</th>
                        <th className="pb-3">{t.colTenantId}</th>
                        <th className="pb-3 pr-4 text-center">{t.colRating}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/50">
                      {tenants.map((vendor) => (
                        <tr key={vendor.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 pl-4 flex items-center gap-3">
                            <span className="text-2xl p-1.5 bg-slate-950 border border-slate-800 rounded-lg">
                              {vendor.logo || '🏪'}
                            </span>
                            <div>
                              <div className="font-bold text-white text-sm">{vendor.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{vendor.subdomain}.nexus.io</div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-900 border border-slate-800 text-indigo-300">
                              {vendor.business_type?.replace(/_/g, ' ') || vendor.category}
                            </span>
                          </td>
                          <td className="py-4 text-slate-300 font-medium">{vendor.owner_name || 'System Initial Seed'}</td>
                          <td className="py-4">
                            <div className="text-slate-400">{vendor.email || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{vendor.phone || 'N/A'}</div>
                          </td>
                          <td className="py-4 font-mono text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[100px]" title={vendor.id}>{vendor.id}</span>
                              <button
                                onClick={() => handleCopy(vendor.id)}
                                className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-white px-2 py-0.5 rounded text-[10px] transition-all"
                              >
                                {copiedId === vendor.id ? t.copiedBtn : t.copyBtn}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-center font-bold text-amber-400 text-sm">
                            ★ {vendor.rating || '5.0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">{t.noVendors}</div>
              )}
            </section>
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
