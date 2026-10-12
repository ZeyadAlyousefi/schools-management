'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Mail,
  PieChart,
  Search,
  Calendar,
  Loader2,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Eye,
  Printer,
  X,
  FileSpreadsheet,
  School,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from '@/context/LanguageProvider';
import { getParentAttendanceData } from '@/app/actions/parent/attendance';
import { getParentFeesData } from '@/app/actions/parent/fees';

// Simple className merger
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Card Component
const Card = ({
  children,
  className = "",
  style = {}
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn(
      "bg-bg-card rounded-2xl border border-border-light shadow-sm hover:shadow-xl hover:border-blue-200/60 transition-all duration-500",
      className
    )}
    style={style}
  >
    {children}
  </div>
);

export default function ReportsPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeData, setFinanceData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getParentAttendanceData();
        if (res.success && res.data?.children) {
          setChildren(res.data.children);
          if (res.data.children.length > 0) {
            setSelectedChildId(res.data.children[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load parent children for reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeChild = children.find((c: any) => c.id === selectedChildId) || children[0];
  const attendanceLogs = activeChild?.attendanceLog || [];

  const presentCount = attendanceLogs.filter((l: any) => l.status === 'Present').length;
  const absentCount = attendanceLogs.filter((l: any) => l.status === 'Absent').length;
  const lateCount = attendanceLogs.filter((l: any) => l.status === 'Late').length;
  const attendanceRate = attendanceLogs.length > 0
    ? ((presentCount / attendanceLogs.length) * 100).toFixed(0) + '%'
    : '0%';

  const generatedDate = new Date().toLocaleDateString(isAr ? 'ar-YE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Function to print or save the report preview as PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // Optional CSV export inside modal
  const handleExportCSV = () => {
    if (!activeChild || attendanceLogs.length === 0) return;

    const metaRows = isAr
      ? [
          `"تقرير الحضور والغياب الرسمي"`,
          `"اسم الطالب:","${activeChild.name}"`,
          `"الصف الدراسي:","${activeChild.class}"`,
          `"تاريخ استخراج التقرير:","${generatedDate}"`,
          `"إجمالي الأيام المسجلة:","${attendanceLogs.length}"`,
          `"أيام الحضور:","${presentCount}"`,
          `"أيام الغياب:","${absentCount}"`,
          `"أيام التأخير:","${lateCount}"`,
          `"نسبة الحضور الإجمالية:","${attendanceRate}"`,
          `""`,
          `"التاريخ","اليوم","حالة الحضور"`,
        ]
      : [
          `"Official Attendance Report"`,
          `"Student Name:","${activeChild.name}"`,
          `"Class:","${activeChild.class}"`,
          `"Report Date:","${generatedDate}"`,
          `"Total Recorded Days:","${attendanceLogs.length}"`,
          `"Present Days:","${presentCount}"`,
          `"Absent Days:","${absentCount}"`,
          `"Late Days:","${lateCount}"`,
          `"Attendance Rate:","${attendanceRate}"`,
          `""`,
          `"Date","Day","Status"`,
        ];

    const dataRows = attendanceLogs.map((l: any) => {
      const statusLabel = isAr
        ? (l.status === 'Present' ? 'حاضر' : l.status === 'Absent' ? 'غائب' : 'متأخر')
        : l.status;
      return `"${l.date}","${l.day}","${statusLabel}"`;
    });

    const csvContent = '\uFEFF' + [...metaRows, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const sanitizedName = (activeChild.name || 'Student').replace(/\s+/g, '_');
    link.setAttribute('download', `${isAr ? 'تقرير_حضور' : 'Attendance_Report'}_${sanitizedName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open Financial Statement Modal
  const handleOpenFinanceModal = async () => {
    try {
      setFinanceLoading(true);
      setShowFinanceModal(true);
      const res = await getParentFeesData(selectedChildId);
      if (res.success && res.data) {
        setFinanceData(res.data);
      }
    } catch (err) {
      console.error('Failed to load finance data for report preview:', err);
    } finally {
      setFinanceLoading(false);
    }
  };

  // Export Financial Statement CSV
  const handleExportFinanceCSV = () => {
    if (!financeData || !financeData.paymentHistory || financeData.paymentHistory.length === 0) {
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
          `"المؤسسة التعليمية:","${financeData?.schoolName || 'مدرسة مثقال النموذجية'}"`,
          `"اسم الطالب:","${activeChild?.name}"`,
          `"الصف الدراسي:","${activeChild?.class}"`,
          `"اسم ولي الأمر:","${financeData?.parentName || '—'}"`,
          `"تاريخ الإصدار:","${generatedDate}"`,
          `"إجمالي الرسوم المقررة:","${financeData?.totalInvoiced} ر.ي"`,
          `"إجمالي المبالغ المسددة:","${financeData?.totalPaid} ر.ي"`,
          `"المبلغ المتبقي:","${financeData?.totalDue} ر.ي"`,
          `""`,
          `"رقم السند/المعاملة","التاريخ","نوع الرسم والبيان","طريقة السداد","المبلغ المسدد","الحالة"`,
        ]
      : [
          `"Official Statement of Account & Receipts"`,
          `"Institution:","${financeData?.schoolName || 'Methqal Model School'}"`,
          `"Student Name:","${activeChild?.name}"`,
          `"Class:","${activeChild?.class}"`,
          `"Parent Name:","${financeData?.parentName || '—'}"`,
          `"Issued Date:","${generatedDate}"`,
          `"Total Invoiced:","$${financeData?.totalInvoiced}"`,
          `"Total Paid:","$${financeData?.totalPaid}"`,
          `"Remaining Due:","$${financeData?.totalDue}"`,
          `""`,
          `"Transaction ID","Date","Description","Payment Method","Amount","Status"`,
        ];

    const dataRows = financeData.paymentHistory.map((item: any) => {
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
    const sanitizedName = (activeChild?.name || 'Student').replace(/\s+/g, '_');
    link.setAttribute('download', `${isAr ? 'كشف_حساب_مالي' : 'Financial_Statement'}_${sanitizedName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reports = [
    {
      id: 'attendance',
      name: isAr ? 'تقرير ملخص الحضور والغياب' : 'Attendance Summary Report',
      date: activeChild ? `${attendanceLogs.length} ${isAr ? 'سجل مسجل' : 'records'}` : (isAr ? 'سجل الحضور' : 'Attendance Log'),
      type: isAr ? 'الحضور والغياب' : 'Attendance',
      size: isAr ? 'استعراض مباشر' : 'Live Preview',
      color: 'blue',
      actionType: 'preview-attendance',
    },
    {
      id: 'academic',
      name: isAr ? 'بطاقة الأداء الأكاديمي والنتائج' : 'Academic Performance Card',
      date: isAr ? 'الفصل الدراسي الأول' : 'Term 1',
      type: isAr ? 'أكاديمي' : 'Academic',
      size: isAr ? 'عرض النتائج' : 'View Grades',
      color: 'emerald',
      actionType: 'view-results',
      viewLink: '/dashboard/parent/results',
    },
    {
      id: 'finance',
      name: isAr ? 'كشف الرسوم والمستحقات المالية' : 'Annual Fee Statement',
      date: isAr ? 'العام الحالي 2026' : 'Year 2026',
      type: isAr ? 'مالي' : 'Finance',
      size: isAr ? 'استعراض مباشر' : 'Live Preview',
      color: 'amber',
      actionType: 'preview-finance',
      viewLink: '/dashboard/parent/fees',
    },
  ];

  const filteredReports = reports.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn p-2 md:p-6">
      {/* Print Specific CSS to only print the active preview modal cleanly as a PDF document */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #attendance-printable-report,
          #attendance-printable-report *,
          #financial-printable-report,
          #financial-printable-report * {
            visibility: visible !important;
          }
          #attendance-printable-report,
          #financial-printable-report {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            {isAr ? 'التقارير الأكاديمية والمالية' : 'Academic & Financial Reports'}
          </h1>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            {isAr
              ? 'استعراض وتحميل تقارير أداء وحضور أبنائك وكشوفاتهم المالية'
              : "Access and download your child's progress reports and financial statements"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'بحث في التقارير...' : 'Search reports...'}
              className="ps-11 pe-5 py-3 bg-bg-card border border-border-light rounded-2xl text-sm w-full md:w-64 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Child Switcher Banner */}
      {loading ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-border-light bg-bg-card text-text-muted text-sm no-print">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          <span>{isAr ? 'جاري تحميل بيانات الأبناء...' : 'Loading children data...'}</span>
        </div>
      ) : children.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-bg-card shadow-sm no-print">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Users size={19} />
            </span>
            <div>
              <p className="text-xs font-black text-text-primary">
                {isAr ? 'الطالب المحدد للتقرير' : 'Selected Student for Reports'}
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
                    onClick={() => setSelectedChildId(child.id)}
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
      ) : null}

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4 no-print">
        {filteredReports.map((report, i) => (
          <Card
            key={i}
            className="p-1 group overflow-hidden"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm border",
                  report.color === 'blue' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                  report.color === 'emerald' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                  report.color === 'amber' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                )}>
                  <FileText size={28} />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-text-primary group-hover:text-blue-600 transition-colors">
                    {report.name}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">
                    <span className={cn(
                      "px-2 py-1 rounded-lg border leading-none shadow-sm",
                      report.color === 'blue' && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                      report.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                      report.color === 'amber' && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                    )}>
                      {report.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-text-muted" /> {report.date}
                    </span>
                    <span className="border-s border-border-light ps-3 text-text-muted">
                      {report.size}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                <button
                  type="button"
                  onClick={() => Swal.fire({
                    title: isAr ? 'تم إرسال النسخة' : 'Email Sent',
                    text: isAr
                      ? `تم إرسال نسخة من ${report.name} الخاصة بالطالب (${activeChild?.name || ''}) إلى بريدك المسجل.`
                      : `A copy of ${report.name} for (${activeChild?.name || ''}) has been sent to your registered email.`,
                    icon: 'success',
                    confirmButtonColor: '#3b82f6',
                  })}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-page border border-border-light text-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20 transition-all shadow-sm"
                  title="Email Copy"
                >
                  <Mail size={16} />
                  {isAr ? 'بريد' : 'EMAIL'}
                </button>

                {report.actionType === 'preview-attendance' ? (
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-blue-600/30 transition-all active:scale-[0.98] group/btn"
                    title={isAr ? 'استعراض تقرير الحضور والغياب' : 'Preview Attendance Report'}
                  >
                    <Eye size={16} className="transition-transform group-hover/btn:scale-110" />
                    {isAr ? 'استعراض التقرير' : 'PREVIEW REPORT'}
                  </button>
                ) : report.actionType === 'preview-finance' ? (
                  <div className="flex items-center gap-2 flex-1 md:flex-none">
                    <button
                      type="button"
                      onClick={handleOpenFinanceModal}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-amber-600/30 transition-all active:scale-[0.98] group/btn"
                      title={isAr ? 'استعراض كشف الحساب المالي' : 'Preview Financial Statement'}
                    >
                      <Eye size={16} className="transition-transform group-hover/btn:scale-110" />
                      {isAr ? 'استعراض الكشف' : 'PREVIEW STATEMENT'}
                    </button>
                    <Link
                      href={report.viewLink ?? '#'}
                      className="p-2.5 rounded-xl border border-border-light hover:bg-bg-page text-text-primary text-xs font-bold transition-all shadow-sm flex items-center justify-center"
                      title={isAr ? 'فتح صفحة الرسوم وسداد المستحقات' : 'Open Full Fees Page'}
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={report.viewLink ?? '#'}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-blue-600/30 transition-all active:scale-[0.98] group/btn"
                    title={isAr ? 'عرض التفاصيل' : 'View Details'}
                  >
                    <ExternalLink size={16} className="transition-transform group-hover/btn:translate-y-0.5" />
                    {isAr ? 'عرض وتصدير' : 'VIEW / EXPORT'}
                  </Link>
                )}
              </div>
            </div>
            
            {/* Hover bar */}
            <div className={cn(
              "h-1 w-0 group-hover:w-full transition-all duration-700",
              report.color === 'blue' && "bg-blue-500",
              report.color === 'emerald' && "bg-emerald-500",
              report.color === 'amber' && "bg-amber-500",
            )} />
          </Card>
        ))}
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 no-print">
        <Card className="p-6 bg-slate-900 border-none relative overflow-hidden group">
          <div className="absolute -end-6 -bottom-6 text-white/5 group-hover:scale-110 transition-transform duration-700">
             <PieChart size={140} />
          </div>
          <div className="relative z-10 space-y-4">
            <h5 className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
              {isAr ? 'نظرة أكاديمية عامة' : 'Academic Overview'}
            </h5>
            <p className="text-white text-sm font-medium leading-relaxed max-w-[280px]">
              {isAr
                ? 'استعرض تقدم وتحصيل أبنائك الأكاديمي عبر لوحة التحليلات والنتائج المباشرة.'
                : "Visualize your child's progress throughout the semester with our analytics tool."}
            </p>
            <Link
              href="/dashboard/parent/results"
              className="text-xs font-bold text-blue-400 flex items-center gap-2 hover:text-blue-300 transition-colors"
            >
              {isAr ? 'فتح نتائج الاختبارات' : 'Open Results Analytics'} <PieChart size={16} />
            </Link>
          </div>
        </Card>

        <Card className="p-6 bg-blue-600 border-none relative overflow-hidden group">
           <div className="absolute end-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
           <div className="relative z-10 space-y-4">
             <h5 className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">
               {isAr ? 'سجلات معتمدة وموثوقة' : 'Secure & Verified Access'}
             </h5>
             <p className="text-white text-sm font-medium leading-relaxed">
               {isAr
                 ? 'جميع تقارير الحضور والغياب مستخرجة مباشرة من السجلات الرسمية للكادر التعليمي.'
                 : 'All attendance and academic reports are extracted directly from institutional records.'}
             </p>
             <Link
               href="/dashboard/parent/attendance"
               className="bg-black/20 backdrop-blur-md rounded-xl p-3 inline-flex items-center gap-2 border border-white/10 text-white hover:bg-black/30 transition-colors"
             >
               <CheckCircle2 size={14} className="text-emerald-400" />
               <span className="text-[11px] font-medium">
                 {isAr ? 'الانتقال إلى سجل الحضور اليومي' : 'Go to Daily Attendance'}
               </span>
             </Link>
           </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* Organized Attendance Report Preview Modal with Save as PDF */}
      {/* ======================================================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div
            id="attendance-printable-report"
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
                      {isAr ? 'مدرسة مثقال النموذجية' : 'Methqal Model School'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {isAr ? 'تقرير الحضور والغياب الرسمي' : 'Official Attendance & Absence Report'}
                  </h2>
                </div>
              </div>

              {/* Close Button (Hidden in Print) */}
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="no-print p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Student & Date Info Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
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
                  {isAr ? 'تاريخ التقرير' : 'Report Date'}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {generatedDate}
                </p>
              </div>
            </div>

            {/* Attendance Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {isAr ? 'إجمالي السجلات' : 'Total Days'}
                </p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                  {attendanceLogs.length}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isAr ? 'أيام الحضور' : 'Present'}
                </p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {presentCount}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  {isAr ? 'أيام الغياب' : 'Absent'}
                </p>
                <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                  {absentCount}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {isAr ? 'نسبة الحضور' : 'Attendance Rate'}
                </p>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  {attendanceRate}
                </p>
              </div>
            </div>

            {/* Attendance Log Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  {isAr ? 'تفاصيل السجلات اليومية' : 'Daily Attendance Log'}
                </h4>
                <span className="text-xs text-slate-400 font-medium">
                  {isAr ? `${attendanceLogs.length} سجل متاح` : `${attendanceLogs.length} entries`}
                </span>
              </div>

              {attendanceLogs.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="px-5 py-3.5 text-start">
                          {isAr ? 'التاريخ' : 'Date'}
                        </th>
                        <th className="px-5 py-3.5 text-start">
                          {isAr ? 'اليوم' : 'Day'}
                        </th>
                        <th className="px-5 py-3.5 text-end">
                          {isAr ? 'حالة الحضور' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attendanceLogs.map((log: any, idx: number) => {
                        const isPresent = log.status === 'Present';
                        const isAbsent = log.status === 'Absent';
                        const isLate = log.status === 'Late';

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">
                              {log.date}
                            </td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                              {log.day}
                            </td>
                            <td className="px-5 py-3 text-end">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black",
                                  isPresent && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
                                  isAbsent && "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20",
                                  isLate && "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                )}
                              >
                                {isPresent && <CheckCircle2 size={12} />}
                                {isAbsent && <XCircle size={12} />}
                                {isLate && <Clock size={12} />}
                                {isAr
                                  ? (isPresent ? 'حاضر' : isAbsent ? 'غائب' : 'متأخر')
                                  : log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
                  {isAr ? 'لا توجد سجلات حضور مسجلة لهذا الطالب' : 'No attendance logs recorded for this student'}
                </div>
              )}
            </div>

            {/* Official Footer Stamp (Visible in Print) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <p>
                {isAr
                  ? 'تم استخراج هذا التقرير آلياً من منصة مثقال تك لإدارة المدارس.'
                  : 'Automated report generated by Methqal Tech School Platform.'}
              </p>
              <p className="font-mono text-[10px]">
                REF: ATT-{activeChild?.id?.slice(0, 8) || '2026'}-{Date.now().toString().slice(-4)}
              </p>
            </div>

            {/* Modal Actions Bar (Hidden in Print) */}
            <div className="no-print pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                title={isAr ? 'تصدير نسخة Excel' : 'Export Excel Copy'}
              >
                <FileSpreadsheet size={15} />
                {isAr ? 'تصدير Excel' : 'Export Excel'}
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer size={15} />
                {isAr ? 'حفظ بصيغة PDF / طباعة التقرير' : 'Save as PDF / Print'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Organized Financial Statement Preview Modal with Save as PDF */}
      {/* ======================================================== */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div
            id="financial-printable-report"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 md:p-8 space-y-6 my-auto max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <Receipt size={24} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Methqal Tech Platform
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {financeData?.schoolName || 'مدرسة مثقال النموذجية'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {isAr ? 'كشف الحساب المالي وسندات القبض الرسمية' : 'Official Financial Statement & Receipts'}
                  </h2>
                </div>
              </div>

              {/* Close Button (Hidden in Print) */}
              <button
                type="button"
                onClick={() => setShowFinanceModal(false)}
                className="no-print p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            {financeLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="animate-spin text-amber-500" size={36} />
                <p className="text-sm font-bold text-slate-500">
                  {isAr ? 'جارٍ تحميل كشف الحساب وسندات السداد...' : 'Loading financial statement...'}
                </p>
              </div>
            ) : (
              <>
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
                      {financeData?.parentName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isAr ? 'تاريخ الكشف' : 'Statement Date'}
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {generatedDate}
                    </p>
                  </div>
                </div>

                {/* Financial Summary Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {isAr ? 'إجمالي الرسوم المقررة' : 'Total Invoiced'}
                    </p>
                    <p className="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                      {financeData?.totalInvoiced || '0'} {isAr ? 'ر.ي' : '$'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {isAr ? 'إجمالي المبالغ المسددة' : 'Total Paid'}
                    </p>
                    <p className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      {financeData?.totalPaid || '0'} {isAr ? 'ر.ي' : '$'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {isAr ? 'الرصيد المتبقي (المستحق)' : 'Remaining Due'}
                    </p>
                    <p className="text-xl md:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                      {financeData?.totalDue || '0'} {isAr ? 'ر.ي' : '$'}
                    </p>
                  </div>
                </div>

                {/* Assigned Fees Breakdown */}
                {financeData?.assignedFees && financeData.assignedFees.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-blue-600" />
                      {isAr ? 'هيكل الرسوم المقررة للصف' : 'Assigned Fee Structure'}
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-start border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-2.5 text-start">{isAr ? 'بند الرسوم' : 'Fee Item'}</th>
                            <th className="px-4 py-2.5 text-end">{isAr ? 'المبلغ المقرر' : 'Amount'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {financeData.assignedFees.map((fee: any) => (
                            <tr key={fee.id}>
                              <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{fee.title}</td>
                              <td className="px-4 py-2 text-end font-bold text-slate-900 dark:text-white">{fee.formattedAmount} {isAr ? 'ر.ي' : '$'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Verified Receipts Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={14} className="text-emerald-600" />
                    {isAr ? 'سندات القبض وحركات السداد المعتمدة' : 'Verified Receipts & Payments'}
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
                        {financeData?.paymentHistory && financeData.paymentHistory.length > 0 ? (
                          financeData.paymentHistory.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">{item.transactionId}</td>
                              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{item.date}</td>
                              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{item.desc}</td>
                              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{item.method}</td>
                              <td className="px-4 py-2.5 text-end font-bold text-slate-900 dark:text-white">{item.amount} {isAr ? 'ر.ي' : '$'}</td>
                              <td className="px-4 py-2.5 text-end">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600">
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
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
              </>
            )}

            {/* Modal Actions Bar (Hidden in Print) */}
            <div className="no-print pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFinanceModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              <button
                type="button"
                onClick={handleExportFinanceCSV}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                title={isAr ? 'تصدير كشف الحساب كملف إكسل' : 'Export Statement to Excel'}
              >
                <FileSpreadsheet size={15} />
                {isAr ? 'تصدير Excel' : 'Export Excel'}
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer size={15} />
                {isAr ? 'حفظ بصيغة PDF / طباعة الكشف' : 'Save as PDF / Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


