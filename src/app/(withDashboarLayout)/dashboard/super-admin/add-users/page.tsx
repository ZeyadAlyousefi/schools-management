"use client"

import React, { useState, useEffect } from 'react'
import { 
  Loader2, Plus, Trash2, X, User as UserIcon, Users, 
  Settings, ShieldCheck, Globe, Save, Sliders, Lock, CheckCircle2 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import { useLanguage } from '@/context/LanguageProvider'
import { 
    getSuperAdminUsers, createSuperAdmin, 
    deleteSuperAdmin, getSystemSettings, saveSystemSettings
} from '@/app/actions/superadmin'

export default function SystemSettingsControl() {
  const { language } = useLanguage()
  const isAr = language === 'ar'
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'admins'>('general')

  // Super Admin Users State
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // System Settings State
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'Methqal Tech Schools',
    siteLogo: '/logo.png',
    supportEmail: 'support@methqal.tech',
    supportPhone: '+967-1-234567',
    defaultCurrency: 'YER',
    defaultLanguage: 'ar',
    minPasswordLength: 8,
    requireSpecialChar: true,
    allowRegistration: true,
    sessionTimeoutHours: 24,
    maintenanceMode: false,
  })

  const loadData = async () => {
    try {
      setLoadingUsers(true)
      setSettingsLoading(true)
      
      const [userRes, settingsRes] = await Promise.all([
        getSuperAdminUsers(),
        getSystemSettings()
      ])

      if (userRes?.success) {
        setUsers(userRes.data || [])
      }

      if (settingsRes?.success && settingsRes.data) {
        setSettings(settingsRes.data)
      }
    } catch (err) {
      console.error("Initialization error:", err)
    } finally {
      setLoadingUsers(false)
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await saveSystemSettings(settings)
      if (res.success) {
        Swal.fire({
          title: isAr ? 'تم الحفظ!' : 'Saved!',
          text: isAr ? 'تم حفظ إعدادات النظام بنجاح' : 'System configuration saved successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        Swal.fire(isAr ? 'خطأ!' : 'Error!', res.error || 'Failed to save', 'error')
      }
    } catch (err: any) {
      Swal.fire(isAr ? 'خطأ!' : 'Error!', err.message, 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  // Delete user function
  const handleDeleteUser = async (user: any) => {
    const confirm = await Swal.fire({
      title: isAr ? 'هل أنت متأكد؟' : 'Are you sure?',
      text: isAr ? `سيتم إلغاء وصول ${user.name} بشكل نهائي!` : `Access for ${user.name} will be permanently revoked!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: isAr ? 'نعم، احذف' : 'Yes, Delete it!',
      cancelButtonText: isAr ? 'إلغاء' : 'Cancel'
    });

    if (confirm.isConfirmed) {
      const result = await deleteSuperAdmin(user.id, user.authUserId);
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        Swal.fire(isAr ? 'تم الحذف!' : 'Deleted!', isAr ? 'تمت إزالة المستخدم بنجاح.' : 'User has been removed.', 'success');
      } else {
        Swal.fire(isAr ? 'خطأ!' : 'Error!', result.error, 'error');
      }
    }
  }

  // Add user submit
  const handleAddUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsCreatingUser(true)
    const formData = new FormData(form)
    const password = (formData.get('password') as string) || "";
    const confirmPassword = (formData.get('confirmPassword') as string) || "";

    if (password !== confirmPassword) {
      Swal.fire(isAr ? 'خطأ!' : 'Error!', isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match', 'error');
      setIsCreatingUser(false);
      return;
    }

    if (password.length < Number(settings.minPasswordLength || 8)) {
      Swal.fire(
        isAr ? 'خطأ!' : 'Error!', 
        isAr 
          ? `يجب أن تتكون كلمة المرور من ${settings.minPasswordLength} أحرف على الأقل` 
          : `Password must be at least ${settings.minPasswordLength} characters`, 
        'error'
      );
      setIsCreatingUser(false);
      return;
    }

    const userData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: password
    }

    try {
        const result = await createSuperAdmin(userData)
        if (result.success) {
            Swal.fire({ 
              title: isAr ? 'نجاح!' : 'Success!', 
              text: isAr ? 'تم إنشاء مدير النظام بنجاح!' : 'Admin created successfully!', 
              icon: 'success', 
              confirmButtonColor: '#2563eb' 
            });
            setUsers(prev => [result.data, ...prev]);
            setShowUserModal(false);
            form.reset();
        } else { 
          Swal.fire(isAr ? 'خطأ!' : 'Error!', result.error, 'error'); 
        }
    } catch (err: any) { 
      Swal.fire(isAr ? 'خطأ!' : 'Error!', err.message, 'error'); 
    } finally { 
      setIsCreatingUser(false) 
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] pb-20 p-4 md:p-8 text-[var(--color-text-primary)]">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          {isAr ? 'إعدادات النظام وإدارة المشرفين' : 'System Settings & Administration'}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
          {isAr 
            ? 'تكوين هوية المنصة، السياسات الأمنية، وقواعد البيانات وحسابات مديري النظام' 
            : 'Configure platform identity, security policies, global currency, and super admin access'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-[var(--color-border-light)] pb-4">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]/50'
          }`}
        >
          <Sliders size={16} />
          {isAr ? 'إعدادات المنصة العامة' : 'General Platform'}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]/50'
          }`}
        >
          <ShieldCheck size={16} />
          {isAr ? 'السياسات والأمان' : 'Security & Policies'}
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            activeTab === 'admins'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]/50'
          }`}
        >
          <Users size={16} />
          {isAr ? 'حسابات مديري النظام' : 'Super Admins'}
        </button>
      </div>

      {/* TAB 1: GENERAL PLATFORM SETTINGS */}
      {activeTab === 'general' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-bg-card)] p-8 md:p-12 rounded-[40px] border border-[var(--color-border-light)] shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-8 max-w-4xl">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">
                {isAr ? 'بيانات المنصة الأساسية' : 'Platform Identity & Contact'}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {isAr ? 'تخصيص اسم المنصة، وسائل الاتصال الرسمية، والعملة الافتراضية للنظام.' : 'Manage site name, official support channels, and default system currency.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'اسم المنصة الرسمي' : 'Platform Official Name'}
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  required
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'رابط شعار المنصة (Logo)' : 'Platform Logo URL'}
                </label>
                <input
                  type="text"
                  value={settings.siteLogo}
                  onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'بريد الدعم الفني الرسمي' : 'Official Support Email'}
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  required
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'رقم هاتف الدعم والاستفسارات' : 'Official Support Phone'}
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  required
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'العملة الافتراضية للنظام' : 'Default Platform Currency'}
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                >
                  <option value="YER">YER (ريال يمني - ر.ي)</option>
                  <option value="SAR">SAR (ريال سعودي - ر.س)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'اللغة الافتراضية للواجهة' : 'Default Language'}
                </label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                >
                  <option value="ar">العربية (Arabic - RTL)</option>
                  <option value="en">English (LTR)</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isAr ? 'حفظ إعدادات المنصة' : 'Save Platform Settings'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 2: SECURITY & POLICIES */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-bg-card)] p-8 md:p-12 rounded-[40px] border border-[var(--color-border-light)] shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-8 max-w-4xl">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">
                {isAr ? 'سياسات الأمان وكلمات المرور' : 'Security Policies & Access Control'}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {isAr ? 'تحديد قيود كلمات المرور، مدة الجلسات، وحالة الصيانة العامة للمنصة.' : 'Define password complexity, session duration, and maintenance mode.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'الحد الأدنى لطول كلمة المرور (أحرف)' : 'Minimum Password Length'}
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={settings.minPasswordLength}
                  onChange={(e) => setSettings({ ...settings, minPasswordLength: Number(e.target.value) })}
                  required
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                  {isAr ? 'مدة صلاحية الجلسة (ساعات)' : 'Session Timeout (Hours)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.sessionTimeoutHours}
                  onChange={(e) => setSettings({ ...settings, sessionTimeoutHours: Number(e.target.value) })}
                  required
                  className="w-full px-5 py-4 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--color-border-light)]">
              <label className="flex items-center gap-4 cursor-pointer p-4 bg-[var(--color-bg-page)] rounded-2xl border border-[var(--color-border-light)]">
                <input
                  type="checkbox"
                  checked={settings.requireSpecialChar}
                  onChange={(e) => setSettings({ ...settings, requireSpecialChar: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
                <div>
                  <p className="font-bold text-sm">
                    {isAr ? 'إلزام احتواء كلمة المرور على رموز خاصة (!@#$%^&*)' : 'Require Special Character in Passwords'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {isAr ? 'يزيد من أمان حسابات المشرفين والمعلمين والطلاب.' : 'Enhances security across all institutional user credentials.'}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer p-4 bg-[var(--color-bg-page)] rounded-2xl border border-[var(--color-border-light)]">
                <input
                  type="checkbox"
                  checked={settings.allowRegistration}
                  onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
                <div>
                  <p className="font-bold text-sm">
                    {isAr ? 'تفعيل تقديم طلبات انضمام المدارس الجديدة' : 'Allow School Onboarding Applications'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {isAr ? 'السماح للمدارس بإرسال طلبات التسجيل من الصفحة الرئيسية.' : 'Enables external schools to submit registration applications.'}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
                <div>
                  <p className="font-bold text-sm text-rose-600">
                    {isAr ? 'وضع الصيانة للنظام (Maintenance Mode)' : 'System Maintenance Mode'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {isAr ? 'إغلاق الوصول العام وعرض صفحة الصيانة لغير المشرفين.' : 'Blocks public access during core upgrades while keeping super admin accessible.'}
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isAr ? 'حفظ السياسات الأمنية' : 'Save Security Policies'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 3: SUPER ADMIN ACCOUNTS */}
      {activeTab === 'admins' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-bg-card)] p-8 md:p-12 rounded-[40px] border border-[var(--color-border-light)] min-h-[600px] shadow-sm">
          <div className="space-y-10">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                      <h3 className="text-3xl font-black tracking-tight">{isAr ? 'مديرو النظام' : 'System Admins'}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">{isAr ? `إجمالي ${users.length} حسابات مديري نظام نشطة ومسجلة في قاعدة البيانات.` : `Total ${users.length} super admin accounts active in database.`}</p>
                  </div>
                  <button onClick={() => setShowUserModal(true)} className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                    <Plus size={18} /> {isAr ? 'إضافة مستخدم' : 'Add User'}
                  </button>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-start">
                      <thead>
                        <tr className="border-b border-[var(--color-border-light)] text-[10px] font-black uppercase tracking-wider text-[var(--color-text-secondary)]">
                          <th className="py-4 text-start">{isAr ? 'المستخدم' : 'User'}</th>
                          <th className="py-4 text-start">{isAr ? 'الدور والصلاحية' : 'Role'}</th>
                          <th className="py-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-light)]">
                          {loadingUsers ? (
                            <tr><td colSpan={3} className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-2" /><p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">{isAr ? 'جارٍ تحميل المديرين...' : 'Loading Admins...'}</p></td></tr>
                          ) : users.length > 0 ? (
                             users.map((user) => (
                              <tr key={user.id} className="group hover:bg-[var(--color-bg-page)]/50 transition-all">
                                  <td className="py-6">
                                      <div className="flex items-center gap-4">
                                          <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                              {user.name?.charAt(0) || <UserIcon size={20} />}
                                          </div>
                                          <div>
                                              <p className="font-black text-base">{user.name}</p>
                                              <p className="text-xs text-[var(--color-text-secondary)]">{user.email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="py-6">
                                      <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                          {isAr ? (user.role === 'super_admin' ? 'المدير العام' : user.role) : user.role}
                                      </span>
                                  </td>
                                  <td className="py-6 text-end">
                                      <button 
                                        onClick={() => handleDeleteUser(user)} 
                                        title={isAr ? 'حذف' : 'Delete'}
                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition-all"
                                      >
                                          <Trash2 size={20}/>
                                      </button>
                                  </td>
                              </tr>
                          ))
                          ) : (
                              <tr>
                                  <td colSpan={3} className="py-20 text-center">
                                      <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
                                          <Users size={48} className="opacity-20" />
                                          <p className="font-bold">{isAr ? 'لم يتم العثور على مديري نظام' : 'No Super Admins Found'}</p>
                                      </div>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
        </motion.div>
      )}

      {/* --- ADD USER MODAL --- */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-lg">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--color-bg-card)] w-full max-w-lg rounded-[40px] p-8 md:p-10 relative border border-[var(--color-border-light)] shadow-2xl">
                  <button onClick={() => setShowUserModal(false)} className="absolute end-8 top-8 text-[var(--color-text-secondary)] hover:rotate-90 transition-all hover:text-black dark:hover:text-white duration-300"><X size={24}/></button>
                  <h4 className="text-2xl font-black mb-6 tracking-tight">{isAr ? 'تعيين مدير نظام جديد' : 'Provision Super Admin'}</h4>
                  <form onSubmit={handleAddUserSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[var(--color-text-secondary)]">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                        <input name="name" required placeholder={isAr ? "مثال: م. علي صالح" : "e.g. Ali Saleh"} className="w-full px-5 py-3.5 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[var(--color-text-secondary)]">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                        <input name="email" required type="email" placeholder={isAr ? "admin@methqal.tech" : "admin@methqal.tech"} className="w-full px-5 py-3.5 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[var(--color-text-secondary)]">{isAr ? 'كلمة المرور المؤقتة' : 'Temporary Password'}</label>
                        <input name="password" type="password" required placeholder="••••••••" className="w-full px-5 py-3.5 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-sm" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[var(--color-text-secondary)]">{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                        <input name="confirmPassword" type="password" required placeholder="••••••••" className="w-full px-5 py-3.5 bg-[var(--color-bg-page)] border border-[var(--color-border-light)] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-sm" />
                      </div>

                      <button disabled={isCreatingUser} type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all">
                        {isCreatingUser ? <Loader2 className="animate-spin mx-auto" size={20}/> : (isAr ? "منح صلاحيات مدير النظام" : "Grant Super Admin Access")}
                      </button>
                  </form>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
