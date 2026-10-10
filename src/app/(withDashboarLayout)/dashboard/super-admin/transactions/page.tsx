"use client"
import React, { useEffect, useState } from 'react'
import {
  Receipt, Wallet, TrendingUp, Clock, AlertCircle, Search, X, FileText
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageProvider'

import { formatCurrency } from '@/lib/formatters'

export default function SuperAdminTransactions() {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/admin/transactions');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((trx) =>
    trx.school?.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trx.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSuccessRevenue = transactions.reduce((acc, curr) => acc + (curr.status === 'SUCCESS' ? (curr.amount || 0) : 0), 0);

  const stats = [
    { title: t("Total Revenue"), value: formatCurrency(totalSuccessRevenue, isAr ? 'ar' : 'en'), icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: t("Pending"), value: transactions.filter(t => t.status === 'PENDING').length.toString(), icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: t("Success"), value: transactions.filter(t => t.status === 'SUCCESS').length.toString(), icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: t("Failed"), value: transactions.filter(t => t.status === 'FAILED' || t.status === 'FAIL').length.toString(), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  ]

  return (
    <div className="space-y-8 animate-fade-in-up pb-10 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-[var(--color-text-primary)]">{isAr ? 'المعاملات المالية والاشتراكات' : 'Subscription Transactions'}</h2>
          <p className="text-[var(--color-text-muted)] font-medium">
            {isAr ? 'متابعة سجل الاشتراكات والمعاملات المالية لمؤسسات المنصة وقيد الإيرادات.' : 'View and manage school subscriptions and financial transactions within the platform.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[var(--color-bg-card)] p-6 rounded-3xl border border-[var(--color-border-light)]">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg}`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <h3 className="text-[var(--color-text-muted)] text-xs uppercase font-black tracking-widest">{stat.title}</h3>
            <p className="text-2xl font-black text-[var(--color-text-primary)] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
            <Receipt size={20} className="text-[var(--color-primary)]" /> {isAr ? 'المدفوعات الأخيرة' : 'Recent Payments'}
          </h3>
          <div className="relative w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder={isAr ? "بحث برقم المعاملة أو اسم المدرسة..." : "Search TRX ID or School..."}
              className="w-full ps-10 pe-4 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <p className="text-center py-10">{isAr ? 'جارٍ تحميل المعاملات...' : 'Loading transactions...'}</p>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((trx) => (
              <div key={trx.id} className="bg-[var(--color-bg-card)] p-5 rounded-3xl border border-[var(--color-border-light)] flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-[var(--color-bg-page)] rounded-2xl">
                    <FileText size={24} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-black text-[var(--color-text-primary)]">{trx.school?.schoolName || 'N/A'}</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-tighter">{trx.transactionId}</p>
                  </div>
                </div>

                <div className="flex gap-10 items-center">
                  <div className="text-end">
                    <p className="text-xs text-[var(--color-text-muted)] font-bold">{isAr ? 'الخطة' : 'PLAN'}</p>
                    <p className="text-sm font-black text-[var(--color-text-primary)] uppercase">{trx.planName}</p>
                  </div>
                    <div className="text-end">
                      <p className="text-xs text-[var(--color-text-muted)] font-bold">{isAr ? 'المبلغ' : 'AMOUNT'}</p>
                      <p className="text-lg font-black text-[var(--color-text-primary)]">{formatCurrency(trx.amount, isAr ? 'ar' : 'en')}</p>
                    </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${trx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                      (trx.status === 'FAILED' || trx.status === 'FAIL') ? 'bg-rose-500/10 text-rose-500' :
                        'bg-orange-500/10 text-orange-500'}`}>
                    {trx.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-[var(--color-bg-card)] rounded-3xl border border-dashed border-[var(--color-border-light)]">
              <p className="text-[var(--color-text-muted)] font-bold">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
