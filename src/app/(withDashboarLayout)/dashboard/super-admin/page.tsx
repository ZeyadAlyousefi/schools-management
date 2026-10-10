"use client"
import { getSuperAdminDashboardData } from "@/app/actions/superadmin"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
 
  Wallet,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Activity,
  ArrowDownRight,
  ShieldCheck,
  Megaphone,
  CreditCard,
  Wrench,
  Users2
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { useRoleGuard } from '@/hooks/useRoleGurad'
import { useLanguage } from '@/context/LanguageProvider'

export default function SuperAdminOverview() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const { loading } = useRoleGuard('super_admin')
  const { t, language } = useLanguage()
  const isAr = language === 'ar'

  useEffect(() => {
    async function loadData() {
      const res = await getSuperAdminDashboardData()
      if (res.success) {
        setDashboardData(res.data)
      }
      setLoadingData(false)
    }
    loadData()
  }, [])

  if (loading || loadingData || !dashboardData) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
    </div>
  )

  const stats = [
    {
      title: isAr ? "إجمالي المدارس" : "Total Schools",
      value: (dashboardData.totalSchools || 0).toString(),
      icon: Building2,
      trend: isAr ? "قاعدة البيانات" : "Live DB",
      up: true,
      subtitle: isAr ? "المدارس المسجلة فعلياً" : "Registered Schools"
    },
    { 
      title: isAr ? "الاشتراكات النشطة" : "Active Subscriptions", 
      value: (dashboardData.activeSubscriptions || 0).toString(), 
      icon: ShieldCheck, 
      trend: isAr ? "مباشر" : "Real-time", 
      up: true, 
      subtitle: isAr ? "المدارس المشتركة حاليًا" : "Current Active Subscriptions" 
    },
    { 
      title: isAr ? "الإيرادات الشهرية" : "Monthly Revenue", 
      value: formatCurrency(dashboardData.monthlyRevenue || 0, isAr ? 'ar' : 'en'), 
      icon: Wallet, 
      trend: isAr ? "هذا الشهر" : "Current Month", 
      up: true, 
      subtitle: isAr ? "إجمالي المعاملات الناجحة" : "Successful Transactions" 
    },
    { 
      title: isAr ? "إجمالي الإيرادات" : "Total Revenue", 
      value: formatCurrency(dashboardData.totalRevenue || 0, isAr ? 'ar' : 'en'), 
      icon: CreditCard, 
      trend: isAr ? "التراكمي" : "All-time", 
      up: true, 
      subtitle: isAr ? "إجمالي الأرباح المحققة" : "Lifetime Real Revenue" 
    },
    { 
      title: isAr ? "تنتهي قريبًا" : "Expiring Soon", 
      value: (dashboardData.expiringSoonCount || 0).toString().padStart(2, '0'), 
      icon: AlertTriangle, 
      trend: isAr ? "يتطلب إجراء" : "Action Required", 
      up: false, 
      subtitle: isAr ? "خلال 7 أيام" : "Next 7 Days" 
    },
  ]

  const planDistribution = dashboardData.planDistribution || [];
  const revenueData = dashboardData.revenueGrowth || [];

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
            {isAr ? "نظرة عامة على المنصة" : "Platform Overview"}
          </h2>
          <p className="text-[var(--color-text-muted)] font-medium mt-2">
            {isAr ? "أداء الأعمال ومتابعة المدارس المشتركة في مثقال تك." : "Business performance and tenant insights."}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] px-4 py-2 rounded-xl flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">
              {isAr ? "حالة الخادم: يعمل بكفاءة" : "Server Status: Healthy"}
            </span>
          </div>
        </div>
      </div>


      {/* 2. Key Metrics (Stats Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border-light)] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl">
                <stat.icon className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.up ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <h3 className="text-[var(--color-text-muted)] text-[11px] uppercase font-black tracking-widest">{stat.title}</h3>
            <p className="text-3xl font-black text-[var(--color-text-primary)] mt-1">{stat.value}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-1">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* 3. Graph Section */}
      <div className="grid  grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border-light)] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[var(--color-text-primary)] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
              <span>{isAr ? "نمو الإيرادات المالية" : "Revenue Growth"}</span>
            </h3>
            <select className="bg-[var(--color-bg-page)] border-[var(--color-border-light)] text-xs font-bold p-2 rounded-lg outline-none">
              <option>{isAr ? "آخر 6 أشهر" : "Last 6 Months"}</option>
              <option>{isAr ? "العام الماضي" : "Last Year"}</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-light)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-[var(--color-bg-card)] p-6 rounded-2xl  border-[var(--color-border-light)] shadow-sm">
          <h3 className="font-black text-[var(--color-text-primary)] mb-6">
            {isAr ? "توزيع خطط الاشتراك" : "Plan Distribution"}
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planDistribution}>
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {planDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {planDistribution.map((plan: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.color }} /> {plan.name}
                </span>
                <span className="text-[var(--color-text-primary)]">{plan.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Lower Section - Quick Actions & Expiring Subscriptions */}
      <div className="grid  grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-light)] overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border-light)]">
            <h3 className="font-black text-[var(--color-text-primary)]">{isAr ? "الاشتراكات المنتهية قريباً" : "Expiring Subscriptions"}</h3>
          </div>
          <table className="w-full text-start">
            <thead className="bg-[var(--color-bg-page)]">
              <tr className="text-[var(--color-text-muted)] text-[10px] uppercase font-black">
                <th className="px-6 py-4">{isAr ? "اسم المدرسة" : "School Name"}</th>
                <th className="px-6 py-4">{isAr ? "تاريخ الانتهاء" : "Expiry Date"}</th>
                <th className="px-6 py-4">{isAr ? "الخطة" : "Plan"}</th>
                <th className="px-6 py-4">{isAr ? "الإجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {dashboardData.expiringSoonList.length > 0 ? (
                dashboardData.expiringSoonList.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-[var(--color-bg-page)] transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-[var(--color-text-primary)]">{item.schoolName}</td>
                    <td className="px-6 py-4 text-xs text-red-500 font-bold">
                      {new Date(item.expiryDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[var(--color-text-secondary)]">{item.plan}</td>
                    <td className="px-6 py-4">
                      <button className="text-[var(--color-primary)] font-black text-[10px] uppercase hover:underline">{isAr ? "إرسال تذكير" : "Send Reminder"}</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-xs text-[var(--color-text-muted)] font-medium">
                    {isAr ? "لا توجد اشتراكات ستنتهي خلال الأيام السبعة القادمة." : "No subscriptions expiring in the next 7 days."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border-light)]">
          <h3 className="font-black text-[var(--color-text-primary)] mb-6">{isAr ? "الإجراءات السريعة الرئيسية" : "Master Quick Actions"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/dashboard/super-admin/schools/new"
              className="p-4 bg-[var(--color-bg-page)] rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-primary)] transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <Building2 className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" />
              <span className="text-xs font-black text-[var(--color-text-secondary)]">{isAr ? "مدرسة جديدة" : "New School"}</span>
            </Link>
            <Link 
              href="/dashboard/super-admin/add-users?tab=users"
              className="p-4 bg-[var(--color-bg-page)] rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-primary)] transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <Users2 className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" />
              <span className="text-xs font-black text-[var(--color-text-secondary)]">{isAr ? "المديرون" : "Admins"}</span>
            </Link>
            <Link 
              href="/dashboard/super-admin/transactions"
              className="p-4 bg-[var(--color-bg-page)] rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-primary)] transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <CreditCard className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" />
              <span className="text-xs font-black text-[var(--color-text-secondary)]">{isAr ? "الفواتير" : "Billing"}</span>
            </Link>
            <Link 
              href="/dashboard/super-admin/maintenance"
              className="p-4 bg-[var(--color-bg-page)] rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-primary)] transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <Wrench className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" />
              <span className="text-xs font-black text-[var(--color-text-secondary)]">{isAr ? "النظام" : "System"}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
