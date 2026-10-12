'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Download,
  CreditCard,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  GraduationCap,
  School,
  X,
  FileSpreadsheet,
  Printer,
  Users,
  Receipt,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { getParentFeesData } from '@/app/actions/parent/fees';
import { initiatePayment } from '@/app/actions/payment';
import Swal from 'sweetalert2';
import { useLanguage } from '@/context/LanguageProvider';

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const Card = ({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn(
      'bg-bg-card rounded-2xl border border-border-light shadow-sm hover:shadow-xl hover:border-blue-200/60 transition-all duration-500',
      className
    )}
    style={style}
  >
    {children}
  </div>
);

export default function FeesPage() {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [showStatementModal, setShowStatementModal] = useState(false);

  const loadData = async (childId?: string) => {
    try {
      setLoading(true);
      const res = await getParentFeesData(childId);
      if (res.success && res.data) {
        setData(res.data);
        if (!selectedChildId && res.data.selectedChild?.id) {
          setSelectedChildId(res.data.selectedChild.id);
        }
      }
    } catch (err) {
      console.error('Error fetching fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    loadData(childId);
  };

  const children = data?.children || [];
  const activeChild = data?.selectedChild || children.find((c: any) => c.id === selectedChildId) || children[0];
  const paymentHistory = data?.paymentHistory || [];
  const assignedFees = data?.assignedFees || [];
  const currencySymbol = isAr ? 'ر.ي' : '$';

  const handlePayment = async () => {
    try {
      if (!data?.totalDueRaw || data?.totalDueRaw <= 0) {
        Swal.fire({
          title: isAr ? 'لا توجد مستحقات' : 'No Outstanding Balance',
          text: isAr
            ? `جميع الرسوم الدراسية للطالب (${activeChild?.name}) مسددة بالكامل.`
            : `All fees for (${activeChild?.name}) are fully paid.`,
          icon: 'success',
          confirmButtonColor: '#3b82f6',
        });
        return;
      }

      Swal.fire({
        title: t('Initiating Payment'),
        text: isAr
          ? `جارٍ التحويل لبوابة الدفع لرصيد ر.ي ${data?.totalDue}...`
          : `Redirecting to secure gateway for $${data?.totalDue}...`,
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await initiatePayment({
        amount: String(data?.totalDueRaw || '0'),
        studentId: activeChild?.id,
        schoolId: activeChild?.schoolId || 'school-methqal-demo-01',
        feeCategory: 'School Fee',
        customerName: data?.parentName || 'ولي الأمر',
      });

      if (res.success) {
        Swal.fire(
          t('Payment Request Submitted'),
          res.message || t('Payment request submitted and will be verified by administration.'),
          'success'
        );
        loadData(selectedChildId);
      } else {
        Swal.fire(t('Payment Error'), res.error || t('Unable to submit payment request'), 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Swal.fire(
        t('Error'),
        isAr ? 'حدث خطأ أثناء بدء عملية الدفع' : 'An unexpected error occurred during payment initialization.',
        'error'
      );
    }
  };

  // Export Financial Statement as CSV with UTF-8 BOM
  const handleExportStatementCSV = () => {
    if (!activeChild || paymentHistory.length === 0) {
      Swal.fire({
        title: isAr ? 'تنبيه' : 'Notice',
        text: isAr ? 'لا توجد سندات أو مدفوعات مسجلة للتحميل' : 'No payment records available to download',
        icon: 'info',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const metaRows = isAr
      ? [
          `"كشف الحساب المالي وسندات السداد الرسمية"`,
          `"المؤسسة التعليمية:","${data?.schoolName || 'مدرسة مثقال النموذجية'}"`,
          `"اسم الطالب:","${activeChild.name}"`,
          `"الصف الدراسي:","${activeChild.class}"`,
          `"اسم ولي الأمر:","${data?.parentName || '—'}"`,
          `"تاريخ الإصدار:","${new Date().toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}"`,
          `"إجمالي الرسوم المقررة:","${data?.totalInvoiced} ر.ي"`,
          `"إجمالي المبالغ المسددة:","${data?.totalPaid} ر.ي"`,
          `"المبلغ المتبقي:","${data?.totalDue} ر.ي"`,
          `""`,
          `"رقم السند/المعاملة","التاريخ","نوع الرسم والبيان","طريقة السداد","المبلغ المسدد","الحالة"`,
        ]
      : [
          `"Official Statement of Account & Payment Receipts"`,
          `"Institution:","${data?.schoolName || 'Methqal Model School'}"`,
          `"Student Name:","${activeChild.name}"`,
          `"Class:","${activeChild.class}"`,
          `"Parent Name:","${data?.parentName || '—'}"`,
          `"Issued Date:","${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"`,
          `"Total Invoiced:","$${data?.totalInvoiced}"`,
          `"Total Paid:","$${data?.totalPaid}"`,
          `"Remaining Due:","$${data?.totalDue}"`,
          `""`,
          `"Transaction ID","Date","Description","Payment Method","Amount","Status"`,
        ];

    const dataRows = paymentHistory.map((item: any) => {
      const statusLabel = isAr
        ? (item.status === 'SUCCESS' || item.status === 'مسدد' ? 'مسدد' : 'معلق')
        : (item.status === 'SUCCESS' || item.status === 'مسدد' ? 'Paid' : 'Pending');
      return `"${item.transactionId}","${item.date}","${item.desc}","${item.method}","${item.amount}","${statusLabel}"`;
    });

    const csvContent = '\uFEFF' + [...metaRows, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = (activeChild.name || 'Student').replace(/\s+/g, '_');
    link.setAttribute('download', `${isAr ? 'كشف_حساب_مالي' : 'Financial_Statement'}_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600" size={60} />
          <GraduationCap className="absolute inset-0 m-auto text-blue-900/20" size={30} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-black text-text-primary tracking-tight animate-pulse">
            {isAr ? 'جارٍ تحميل السجلات والبيانات المالية...' : 'Loading Financial Records...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn p-2 md:p-6">
      {/* Print Specific CSS to isolate the statement modal for clean PDF output */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #financial-printable-statement,
          #financial-printable-statement * {
            visibility: visible !important;
          }
          #financial-printable-statement {
            position: absolute !important;
            inset-inline-start: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {isAr ? 'الرسوم المدرسية والمدفوعات' : t('Fees & Payments')}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {isAr
              ? 'متابعة الرسوم المقررة وسندات القبض وحالة السداد لكل طالب'
              : t("Monitor and manage your child's school fees and payment history")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowStatementModal(true)}
          className="px-5 py-2.5 bg-bg-card border border-border-light text-text-primary hover:bg-bg-page rounded-xl transition-all duration-300 flex items-center gap-2 font-bold text-xs shadow-sm"
        >
          <Receipt size={17} className="text-blue-600" />
          {isAr ? 'استعراض كشف الحساب الرسمي' : 'View Statement'}
        </button>
      </div>

      {/* Child Switcher Banner */}
      {children.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-bg-card shadow-sm no-print">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Users size={19} />
            </span>
            <div>
              <p className="text-xs font-black text-text-primary">
                {isAr ? 'الطالب المحدد للذمة المالية' : 'Selected Student for Account'}
              </p>
              <p className="text-xs font-semibold text-text-muted">
                {activeChild ? `${activeChild.name} — ${activeChild.class}` : ''}
              </p>
            </div>
          </div>

          {children.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {children.map((child: any) => {
                const isSelected = activeChild?.id === child.id;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleChildSelect(child.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                        : 'bg-bg-card text-text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-border-light'
                    }`}
                  >
                    <GraduationCap size={15} />
                    <span>{child.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600'}`}>
                      {child.class}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        {/* Due & Balance Card */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 border-none shadow-xl shadow-blue-500/20 relative overflow-hidden group h-full flex flex-col justify-between">
            <div className="absolute end-[-20px] top-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <CreditCard size={180} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <CreditCard size={24} className="text-white" />
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">
                  {isAr ? 'الرصيد المالي' : t('Total Due')}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                  {isAr ? 'المبلغ المستحق حالياً' : t('Remaining Balance')}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black tracking-tight mt-1">
                    {data?.totalDue || '0'}
                  </p>
                  <span className="text-xs font-bold text-white/80">{currencySymbol}</span>
                </div>
              </div>

              {/* Sub-metrics */}
              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/15 text-xs">
                <div>
                  <p className="text-white/60 text-[10px] uppercase font-bold">
                    {isAr ? 'إجمالي الرسوم' : 'Total Invoiced'}
                  </p>
                  <p className="font-bold text-white mt-0.5">
                    {data?.totalInvoiced || '0'} {currencySymbol}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-[10px] uppercase font-bold">
                    {isAr ? 'المبالغ المسددة' : 'Total Paid'}
                  </p>
                  <p className="font-bold text-emerald-300 mt-0.5">
                    {data?.totalPaid || '0'} {currencySymbol}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 py-2 border-t border-white/10">
                <Calendar size={15} className="text-white/60" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                  {isAr ? 'حالة الحساب: ' : 'Account Status: '}
                  <span className="text-white ps-1">
                    {data?.totalDueRaw > 0
                      ? (isAr ? 'يوجد مستحقات مطلوب سدادها' : 'Payment Due')
                      : (isAr ? 'تم سداد كافة الرسوم بالكامل ✓' : 'Fully Settled ✓')}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={handlePayment}
                className="w-full py-3.5 bg-white text-blue-700 rounded-2xl font-bold text-xs hover:shadow-2xl hover:bg-blue-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
              >
                {data?.totalDueRaw > 0 ? (isAr ? 'سداد الرسوم الآن' : t('Pay Now')) : (isAr ? 'طلب إيصال / دفعة إضافية' : 'Submit Payment')}
                <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </Card>
        </div>

        {/* History Table */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 border-b border-border-light flex items-center justify-between bg-bg-page/30">
            <h3 className="font-bold text-text-primary flex items-center gap-2 text-sm uppercase tracking-widest leading-none">
              <History size={18} className="text-blue-500" />
              {isAr ? 'سجل العمليات وسندات القبض' : t('Transactions')}
            </h3>
            <button
              type="button"
              onClick={() => setShowStatementModal(true)}
              className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all border border-blue-500/10 uppercase tracking-widest"
            >
              <Receipt size={14} /> {isAr ? 'كشف الحساب' : t('Statement')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-bg-page/50 text-text-muted">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider border-b border-border-light text-start">
                    {isAr ? 'رقم السند والتاريخ' : t('Month')}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider border-b border-border-light text-start">
                    {isAr ? 'البيان ونوع الرسم' : t('Description')}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider border-b border-border-light text-start">
                    {isAr ? 'المبلغ' : t('Amount')}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider border-b border-border-light text-end">
                    {isAr ? 'الحالة' : t('Status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {paymentHistory.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    className="hover:bg-bg-page/80 transition-colors animate-fadeInSlide"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-xs font-bold text-text-primary block">
                          {item.transactionId}
                        </span>
                        <span className="text-[10px] text-text-muted mt-0.5 block">
                          {item.date}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-text-secondary leading-relaxed max-w-[220px]">
                        {item.desc}
                      </p>
                      <span className="text-[10px] text-text-muted">
                        {item.method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-text-primary">
                        {item.amount} {currencySymbol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider shadow-sm',
                          item.statusColor === 'emerald'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        )}
                      >
                        {item.statusColor === 'emerald' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paymentHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-text-muted">
                      <Receipt className="mx-auto block mb-2 opacity-40 w-8 h-8" />
                      <p className="text-xs font-medium">
                        {isAr ? 'لا توجد سندات أو مدفوعات مسجلة لهذا الطالب' : 'No payments recorded for this student'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-bg-page/30 mt-auto border-t border-border-light flex items-center justify-between text-[11px] text-text-muted font-medium">
            <span>
              {isAr ? `إجمالي السندات المسجلة: ${paymentHistory.length}` : `Total Receipts: ${paymentHistory.length}`}
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck size={14} /> {isAr ? 'سندات معتمدة رسمياً' : 'Verified Transactions'}
            </span>
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* Official Financial Statement Modal with Save as PDF */}
      {/* ======================================================== */}
      {showStatementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div
            id="financial-printable-statement"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 md:p-8 space-y-6 my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <School size={24} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                      Methqal Tech Platform
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {data?.schoolName || 'مدرسة مثقال النموذجية'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {isAr ? 'كشف الحساب المالي وسندات القبض' : 'Official Statement of Account & Receipts'}
                  </h2>
                </div>
              </div>

              {/* Close Button (Hidden in Print) */}
              <button
                type="button"
                onClick={() => setShowStatementModal(false)}
                className="no-print p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Student & Account Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'اسم الطالب' : 'Student Name'}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {activeChild?.name || '—'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'الصف والشعبة' : 'Class & Section'}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {activeChild?.class || '—'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'ولي الأمر المسجل' : 'Guardian Name'}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {data?.parentName || '—'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'تاريخ الكشف' : 'Statement Date'}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {new Date().toLocaleDateString(isAr ? 'ar-YE' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Financial Summary Metric Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {isAr ? 'إجمالي الرسوم المقررة' : 'Total Invoiced'}
                </p>
                <p className="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                  {data?.totalInvoiced} {currencySymbol}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isAr ? 'إجمالي المبالغ المسددة' : 'Total Paid'}
                </p>
                <p className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {data?.totalPaid} {currencySymbol}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {isAr ? 'الرصيد المتبقي (المستحق)' : 'Remaining Due'}
                </p>
                <p className="text-xl md:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                  {data?.totalDue} {currencySymbol}
                </p>
              </div>
            </div>

            {/* Assigned Fees Breakdown */}
            {assignedFees.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" />
                  {isAr ? 'هيكل الرسوم المعتمد للصف الدراسي' : 'Assigned Fee Structure'}
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-2.5 text-start">{isAr ? 'بند الرسوم' : 'Fee Item'}</th>
                        <th className="px-4 py-2.5 text-end">{isAr ? 'القيمة المقررة' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {assignedFees.map((fee: any) => (
                        <tr key={fee.id}>
                          <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{fee.title}</td>
                          <td className="px-4 py-2 text-end font-bold text-slate-900 dark:text-white">{fee.formattedAmount} {currencySymbol}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Receipts and Payments Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-600" />
                {isAr ? 'سندات القبض وحركات السداد المسجلة' : 'Verified Receipts & Payments'}
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-start">{isAr ? 'رقم السند' : 'Receipt No.'}</th>
                      <th className="px-4 py-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="px-4 py-3 text-start">{isAr ? 'البيان' : 'Description'}</th>
                      <th className="px-4 py-3 text-start">{isAr ? 'طريقة السداد' : 'Method'}</th>
                      <th className="px-4 py-3 text-end">{isAr ? 'المبلغ' : 'Amount'}</th>
                      <th className="px-4 py-3 text-end">{isAr ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paymentHistory.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">{item.transactionId}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{item.date}</td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{item.desc}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{item.method}</td>
                        <td className="px-4 py-2.5 text-end font-bold text-slate-900 dark:text-white">{item.amount} {currencySymbol}</td>
                        <td className="px-4 py-2.5 text-end">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paymentHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {isAr ? 'لا توجد حركات سداد مسجلة حتى الآن' : 'No payments recorded yet'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Footer Stamp (Visible in Print) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <p>
                {isAr
                  ? 'تم استخراج هذا السند المالي آلياً من الإدارة المالية لمنصة مثقال تك.'
                  : 'Official financial statement generated by Methqal Tech Platform.'}
              </p>
              <p className="font-mono text-[10px]">
                FIN: STMT-{activeChild?.id?.slice(0, 8) || '2026'}-{Date.now().toString().slice(-4)}
              </p>
            </div>

            {/* Modal Actions Bar (Hidden in Print) */}
            <div className="no-print pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStatementModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              <button
                type="button"
                onClick={handleExportStatementCSV}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                title={isAr ? 'تصدير كشف الحساب كملف إكسل' : 'Export Statement to Excel'}
              >
                <FileSpreadsheet size={15} />
                {isAr ? 'تصدير Excel' : 'Export Excel'}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer size={15} />
                {isAr ? 'حفظ كشف الحساب بصيغة PDF / طباعة' : 'Save as PDF / Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

