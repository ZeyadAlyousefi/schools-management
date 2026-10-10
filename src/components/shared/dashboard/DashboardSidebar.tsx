"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, ChevronLeft, Sparkles } from "lucide-react"
import Logo from "@/components/shared/logo/logo"
import { DashboardMenuItem } from "./types"
import { useLanguage } from "@/context/LanguageProvider"

interface DashboardSidebarProps {
  menuItems: DashboardMenuItem[]
  onLinkClick?: () => void
  activeColor?: string
}

export function DashboardSidebar({ menuItems, onLinkClick }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { t, language } = useLanguage()

  const isActive = (path: string) => {
    const pathSegments = path.split('/').filter(Boolean)
    const isBaseDashboard = pathSegments.length === 2 && pathSegments[0] === 'dashboard'
    if (isBaseDashboard) return pathname === path
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#07111f] text-white shadow-[0_20px_70px_rgba(2,8,23,.28)]">
      <div className="relative border-b border-white/[0.08] px-5 py-5">
        <Link href="/" onClick={onLinkClick} className="block rounded-2xl transition-transform active:scale-[.98]">
          <Logo variant="light" size="md" />
        </Link>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300"><Sparkles size={15} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{language === 'ar' ? 'منصة تعليمية' : 'Education platform'}</p>
            <p className="truncate text-xs font-bold text-slate-200">{language === 'ar' ? 'مثقال تك' : 'Methqal Tech'}</p>
          </div>
        </div>
      </div>

      <nav 
        data-lenis-prevent="true"
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 focus:outline-none"
        tabIndex={0}
        aria-label={language === 'ar' ? 'شريط التنقل الجانبي' : 'Sidebar Navigation'}
      >
        <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {language === 'ar' ? 'القائمة الرئيسية' : 'Main menu'}
        </p>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.url)
            return (
              <Link
                key={`${item.url}-${item.title}`}
                href={item.url}
                onClick={onLinkClick}
                className={`group relative flex min-h-11 items-center justify-between rounded-2xl px-3.5 py-2.5 transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-400/10 text-white shadow-inner shadow-white/[0.03]'
                    : 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'
                }`}
              >
                {active && <span className="absolute inset-y-2 start-0 w-1 rounded-e-full bg-gradient-to-b from-blue-400 to-cyan-300" />}
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${active ? 'bg-blue-500/15 text-blue-300' : 'bg-white/[0.025] text-slate-500 group-hover:text-slate-200'}`}>
                    <item.icon size={18} strokeWidth={active ? 2.2 : 1.9} />
                  </span>
                  <span className={`truncate text-[13px] font-bold ${active ? 'text-white' : ''}`}>{t(item.title)}</span>
                </span>
                {item.badge && <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${active ? 'bg-blue-400/20 text-blue-200' : 'bg-white/[0.07] text-slate-500'}`}>{t(item.badge)}</span>}
                {active && <ChevronLeft className={`shrink-0 text-blue-300 ${language === 'ar' ? '' : 'rotate-180'}`} size={14} />}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <div className="mb-2 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-400/5 p-3">
          <p className="text-[10px] font-bold text-slate-500">{language === 'ar' ? 'حلول تعليمية رقمية' : 'Digital education solutions'}</p>
          <p className="mt-1 text-xs font-bold text-slate-200">{language === 'ar' ? 'مدرستك في مكان واحد' : 'Your school in one place'}</p>
        </div>
        <button
          className="flex h-11 w-full items-center gap-3 rounded-2xl px-3.5 text-sm font-bold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          onClick={() => window.dispatchEvent(new CustomEvent('methqal:logout'))}
        >
          <LogOut size={18} />
          <span>{t('Log out')}</span>
        </button>
      </div>
    </aside>
  )
}
