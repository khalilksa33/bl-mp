'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const translations = {
  en: {
    title: 'Vendor Registration',
    subtitle: 'Register your automotive business and launch your tenant space instantly',
    businessName: 'Business Name',
    businessNamePlaceholder: 'e.g., Apex Spare Parts',
    subdomain: 'Unique Subdomain / Handle',
    subdomainPlaceholder: 'e.g., apex-parts (only letters, numbers, dashes)',
    ownerName: 'Owner / Contact Name',
    ownerNamePlaceholder: 'e.g., John Doe',
    email: 'Email Address',
    emailPlaceholder: 'e.g., contact@business.com',
    phone: 'Phone Number',
    phonePlaceholder: 'e.g., +966 50 123 4567',
    businessType: 'Business Type',
    selectBusinessType: 'Select your business type...',
    logo: 'Select Store Emoji Logo',
    bannerGradient: 'Storefront Theme Accent',
    submit: 'Register & Launch Store',
    registering: 'Launching your space...',
    successTitle: 'Registration Successful! 🎉',
    successSubtitle: 'Your isolated tenant database and storefront have been initialized.',
    tenantIdLabel: 'Your Tenant ID (Secret Access Key)',
    copyBtn: 'Copy Tenant ID',
    copiedBtn: 'Copied!',
    portalBtn: 'Go to Vendor Dashboard',
    backBtn: 'Back to Marketplace',
    commissionInfo: 'Marketplace commission rate for this business type is',
    consentLabel: 'I agree to the partnership terms and authorize Nexus to collect the transaction commission.',
    consentError: 'You must agree to the commission rate and terms of service.',
    types: {
      new_auto_spare_parts: 'New Auto Spare Parts Seller (بائع قطع غيار جديدة)',
      used_auto_spare_parts: 'Used Auto Spare Parts Seller (اصحاب التشليح / Tashleeh)',
      tow_company: 'Flat Bed Car Tow Company (سطحات / Towing)',
      mobile_workshop: 'Mobile Automobile Workshop (ورشة متنقلة)',
      digital_alignment: 'Digital Alignment Company (ميزان إلكتروني)',
      mechanics_workshop: 'Mechanics Workshop Owner (ورشة صيانة السيارات)',
    }
  },
  ar: {
    title: 'تسجيل البائعين والشركاء',
    subtitle: 'سجّل منشأتك لقطع الغيار أو الخدمات وانطلق بمتجرك المستقل فوراً',
    businessName: 'اسم المنشأة / التجاري',
    businessNamePlaceholder: 'مثال: شركة القمة لقطع الغيار',
    subdomain: 'رابط المتجر الفرعي / المعرّف الفريد',
    subdomainPlaceholder: 'مثال: apex-parts (أحرف، أرقام، شرطة فقط)',
    ownerName: 'اسم المالك / الشخص المسؤول',
    ownerNamePlaceholder: 'مثال: أحمد محمد',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'example@domain.com',
    phone: 'رقم الجوال / الاتصال',
    phonePlaceholder: 'مثال: 0501234567',
    businessType: 'نوع النشاط التجاري',
    selectBusinessType: 'اختر نوع النشاط...',
    logo: 'اختر رمز المتجر (Emoji)',
    bannerGradient: 'تنسيق ألوان واجهة المحل',
    submit: 'تسجيل وإطلاق المتجر',
    registering: 'جاري تهيئة مساحتك الخاصة...',
    successTitle: 'تم التسجيل بنجاح! 🎉',
    successSubtitle: 'تم إنشاء قاعدة البيانات المعزولة الخاصة بك ومتجرك الإلكتروني بنجاح.',
    tenantIdLabel: 'معرّف المستأجر الخاص بك (مفتاح الدخول السري)',
    copyBtn: 'نسخ معرّف المتجر',
    copiedBtn: 'تم النسخ!',
    portalBtn: 'الانتقال إلى لوحة تحكم البائع',
    backBtn: 'العودة للموقع الرئيسي',
    commissionInfo: 'نسبة عمولة المنصة المعتمدة لهذا النشاط هي',
    consentLabel: 'أوافق على شروط الشراكة وأفوض المنصة بتحصيل عمولة المبيعات المذكورة.',
    consentError: 'يجب الموافقة على نسبة العمولة وشروط الخدمة للاستمرار.',
    types: {
      new_auto_spare_parts: 'بائع قطع غيار جديدة (New Auto Spare Parts)',
      used_auto_spare_parts: 'تشليح / قطع مستعملة (Used Parts / Tashleeh)',
      tow_company: 'خدمات سطحات نقل السيارات (Tow Companies / Satḥa)',
      mobile_workshop: 'ورشة صيانة متنقلة (Mobile Workshop)',
      digital_alignment: 'ميزان إلكتروني وضبط زوايا (Digital Alignment)',
      mechanics_workshop: 'ورشة صيانة وميكانيكا (Mechanics Workshop)',
    }
  }
};

const logoOptions = ['⚙️', '🔌', '🚗', '🛻', '🔋', '📐', '🔧', '🏎️', '🏪', '🛠️', '🚛'];

const gradientOptions = [
  { name: 'Midnight Violet', value: 'from-purple-600 to-pink-900' },
  { name: 'Emerald Wave', value: 'from-emerald-600 to-teal-900' },
  { name: 'Amber Glow', value: 'from-amber-500 to-orange-850' },
  { name: 'Electric Ocean', value: 'from-blue-600 to-indigo-900' },
  { name: 'Volcanic Red', value: 'from-rose-600 to-red-950' },
];

const commissionRates: Record<string, number> = {
  new_auto_spare_parts: 8,
  used_auto_spare_parts: 10,
  tow_company: 12,
  mobile_workshop: 12,
  digital_alignment: 10,
  mechanics_workshop: 12,
};

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as 'en' | 'ar') || 'en';
  const t = translations[locale] || translations.en;

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    logo: '⚙️',
    bannerGradient: 'from-blue-600 to-indigo-900',
  });

  const [consentChecked, setConsentChecked] = useState(false);
  const [registeredTenant, setRegisteredTenant] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSubdomain = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .trim()
      .replace(/\s+/g, '-'); // replace spaces with dashes
    
    setFormData(prev => ({
      ...prev,
      name,
      subdomain: prev.subdomain ? prev.subdomain : generatedSubdomain
    }));
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subdomain = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ''); // enforce valid subdomain formats
    setFormData(prev => ({ ...prev, subdomain }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.businessType) {
      setError(locale === 'ar' ? 'الرجاء اختيار نوع النشاط التجاري.' : 'Please select your business type.');
      return;
    }

    if (!consentChecked) {
      setError(t.consentError);
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: formData.name,
          subdomain: formData.subdomain,
          logo: formData.logo,
          category: t.types[formData.businessType as keyof typeof t.types].split('(')[0].trim(),
          bannerGradient: formData.bannerGradient,
          business_type: formData.businessType,
          owner_name: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
        };

        const res = await fetch(`${API_URL}/api/tenants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to register vendor.');
        }

        const data = await res.json();
        setRegisteredTenant(data.tenant);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  const handleCopy = () => {
    if (registeredTenant?.id) {
      navigator.clipboard.writeText(registeredTenant.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isRtl = locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[150px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-900/80 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
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

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {!registeredTenant ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{t.title}</h1>
              <p className="text-sm text-slate-400">{t.subtitle}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Business Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.businessName}</label>
                <input
                  type="text"
                  required
                  placeholder={t.businessNamePlaceholder}
                  value={formData.name}
                  onChange={handleNameChange}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Subdomain */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.subdomain}</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder={t.subdomainPlaceholder}
                    value={formData.subdomain}
                    onChange={handleSubdomainChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <span className={`absolute ${isRtl ? 'left-4' : 'right-4'} text-xs font-medium text-slate-500`}>
                    .nexus.io
                  </span>
                </div>
              </div>

              {/* Business Type dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.businessType}</label>
                <select
                  required
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
                >
                  <option value="" disabled>{t.selectBusinessType}</option>
                  <option value="new_auto_spare_parts">{t.types.new_auto_spare_parts}</option>
                  <option value="used_auto_spare_parts">{t.types.used_auto_spare_parts}</option>
                  <option value="tow_company">{t.types.tow_company}</option>
                  <option value="mobile_workshop">{t.types.mobile_workshop}</option>
                  <option value="digital_alignment">{t.types.digital_alignment}</option>
                  <option value="mechanics_workshop">{t.types.mechanics_workshop}</option>
                </select>

                {formData.businessType && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/35 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between mt-1">
                    <span>{t.commissionInfo}</span>
                    <span className="font-extrabold text-sm text-indigo-200">%{commissionRates[formData.businessType]}</span>
                  </div>
                )}
              </div>

              {/* Owner / Contact Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.ownerName}</label>
                <input
                  type="text"
                  required
                  placeholder={t.ownerNamePlaceholder}
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.email}</label>
                  <input
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.phone}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.phonePlaceholder}
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Theme customizers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800/80 pt-6">
                {/* Logo Emoji Picker */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.logo}</label>
                  <div className="flex flex-wrap gap-2">
                    {logoOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo: emoji }))}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-all ${
                          formData.logo === emoji 
                            ? 'bg-indigo-600/20 border-indigo-500 shadow-lg' 
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Gradient Theme */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.bannerGradient}</label>
                  <div className="flex flex-col gap-2">
                    {gradientOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, bannerGradient: opt.value }))}
                        className={`w-full py-2.5 px-3 rounded-xl border flex items-center gap-3 transition-all ${
                          formData.bannerGradient === opt.value
                            ? 'border-indigo-500 bg-slate-950'
                            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${opt.value}`} />
                        <span className="text-xs font-semibold">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-3 border-t border-slate-800/80 pt-6">
                <input
                  type="checkbox"
                  id="consent"
                  required
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-indigo-650 cursor-pointer shrink-0"
                />
                <label htmlFor="consent" className="text-xs text-slate-400 font-medium cursor-pointer leading-relaxed">
                  {t.consentLabel}
                  {formData.businessType && (
                    <span className="text-indigo-400 font-bold block mt-1">
                      ({t.commissionInfo}: %{commissionRates[formData.businessType]})
                    </span>
                  )}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-4 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-900/50 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    {t.registering}
                  </>
                ) : (
                  t.submit
                )}
              </button>
            </form>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-3xl animate-bounce">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{t.successTitle}</h2>
              <p className="text-sm text-slate-400">{t.successSubtitle}</p>
            </div>

            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 items-stretch mt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t.tenantIdLabel}</span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-mono font-bold text-indigo-400 select-all truncate">{registeredTenant.id}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                  {copied ? t.copiedBtn : t.copyBtn}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <button
                onClick={() => router.push(`/${locale}/portal?tenant_id=${registeredTenant.id}`)}
                className="flex-1 bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                {t.portalBtn}
              </button>
            </div>
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
