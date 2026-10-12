'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileText,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Loader2,
  GraduationCap,
  ArrowRight,
  Search,
  Printer,
  School,
  X,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { getParentResultsData } from '@/app/actions/parent/results';
import { useLanguage } from '@/context/LanguageProvider';
import toast from 'react-hot-toast';

// Simple className merger
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Card Component
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
      className,
    )}
    style={style}
  >
    {children}
  </div>
);

export default function ResultsPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getParentResultsData();
        if (res.success) {
          setData(res.data);
        } else {
          console.error('Results fetch failed:', res.error);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const allResults = data?.allResults || [];

  const filteredResults = allResults.filter(
    (r: any) =>
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Single Student Excel Export with UTF-8 BOM
  const handleDownloadExcel = (student: any) => {
    if (!student || !student.subjects || student.subjects.length === 0) {
      toast.error(isAr ? 'لا توجد درجات مسجلة لهذا الطالب' : 'No marks recorded for this student');
      return;
    }

    const headers = isAr
      ? ['المادة الدراسية', 'الدرجة المحصلة', 'التقدير', 'النقاط']
      : ['Subject', 'Marks', 'Grade', 'Point'];

    const meta = isAr
      ? [
          `"كشف درجات ونتائج الطالب الرسمية"`,
          `"اسم الطالب:","${student.studentName}"`,
          `"الصف الدراسي:","${student.currentClass}"`,
          `"الرقم التعريفي:","${student.studentId}"`,
          `"المجموع الكلي:","${student.totalMarks}"`,
          `"التقدير العام:","${student.grade}"`,
          `"تاريخ الإصدار:","${new Date().toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}"`,
          `""`,
        ]
      : [
          `"Official Student Academic Report Card"`,
          `"Student Name:","${student.studentName}"`,
          `"Class:","${student.currentClass}"`,
          `"Student ID:","${student.studentId}"`,
          `"Total Marks:","${student.totalMarks}"`,
          `"Overall Grade:","${student.grade}"`,
          `"Issued Date:","${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"`,
          `""`,
        ];

    const rows = student.subjects.map(
      (sub: any) => `"${sub.subject}","${sub.marks}","${sub.grade}","${sub.point}"`
    );

    const csvContent = '\uFEFF' + [...meta, headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = student.studentName.replace(/\s+/g, '_');
    link.setAttribute('download', `${isAr ? 'شهادة_درجات' : 'Report_Card'}_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم تحميل كشف الدرجات بنجاح' : 'Report card downloaded successfully');
  };

  // Export All Children Consolidated CSV
  const handleExportAllChildren = () => {
    if (allResults.length === 0) {
      toast.error(isAr ? 'لا توجد نتائج متاحة للتحميل' : 'No results available to download');
      return;
    }

    const headers = isAr
      ? ['الرقم التعريفي', 'اسم الطالب', 'الصف', 'المادة الدراسية', 'الدرجة', 'التقدير', 'النقاط']
      : ['Student ID', 'Student Name', 'Class', 'Subject', 'Marks', 'Grade', 'Point'];

    const rows: string[] = [];
    allResults.forEach((s: any) => {
      if (s.subjects && s.subjects.length > 0) {
        s.subjects.forEach((sub: any) => {
          rows.push(
            `"${s.studentId}","${s.studentName}","${s.currentClass}","${sub.subject}","${sub.marks}","${sub.grade}","${sub.point}"`
          );
        });
      } else {
        rows.push(
          `"${s.studentId}","${s.studentName}","${s.currentClass}","—","0","—","0"`
        );
      }
    });

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${isAr ? 'كشف_نتائج_الأبناء_المجمع' : 'Children_Academic_Results'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم تصدير كشف النتائج المجمع بنجاح' : 'All results exported successfully');
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
            {isAr ? 'جاري تحميل النتائج والشهادات الأكاديمية...' : 'Loading Academic Results...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn p-2 md:p-6 relative">
      {/* Print Specific CSS to isolate the student report card for clean PDF output */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #student-printable-report-card,
          #student-printable-report-card * {
            visibility: visible !important;
          }
          #student-printable-report-card {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            {isAr ? 'نتائج وشهادات الأبناء' : "Children's Academic Results"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {isAr
                ? 'سجلات التحصيل الدراسي والشهادات الفصلية الرسمية'
                : "Official Academic Performance & Report Cards"}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder={isAr ? 'بحث بالاسم أو الرقم التعريفي...' : 'Search by ID or Name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 ps-10 pe-4 py-3 bg-bg-card border border-border-light rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-text-primary font-medium"
            />
          </div>

          <button
            type="button"
            onClick={handleExportAllChildren}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
            title={isAr ? 'تصدير نتائج جميع الأبناء كملف إكسل' : 'Export all children results to Excel'}
          >
            <FileSpreadsheet size={18} className="transition-transform group-hover:scale-110" />
            {isAr ? 'تصدير كشف الأبناء المجمع' : 'Export All Results'}
          </button>
        </div>
      </div>

      {/* Results Table Card */}
      <Card className="overflow-hidden shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-bg-page/50 text-text-muted">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-light text-start">
                  {isAr ? 'الطالب' : 'Student'}
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-light text-start">
                  {isAr ? 'الصف والشعبة' : 'Class'}
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-light text-start">
                  {isAr ? 'الجنس' : 'Gender'}
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-light text-center">
                  {isAr ? 'عدد المواد' : 'Subjects'}
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-light text-center">
                  {isAr ? 'التقدير العام' : 'Overall Grade'}
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b border-border-light text-end">
                  {isAr ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredResults.map((r: any, i: number) => (
                <tr
                  key={r.id || i}
                  className="group hover:bg-bg-page/80 transition-all duration-300 animate-fadeInSlide"
                  style={{ animationDelay: `${(i % 10) * 70}ms` }}
                >
                  <td className="px-6 py-6">
                    <div>
                      <span className="text-sm font-bold text-text-primary block">
                        {r.studentName}
                      </span>
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        {isAr ? 'الرقم: ' : 'ID: '} {r.studentId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-medium text-text-secondary">
                      {r.currentClass}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-medium text-text-secondary">
                      {isAr
                        ? r.gender === 'ذكر' || r.gender?.toLowerCase() === 'male'
                          ? 'ذكر'
                          : 'أنثى'
                        : r.gender}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-sm font-bold text-text-primary">
                      {r.subjectCount || r.subjects?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-black border tracking-wider leading-none shadow-sm uppercase',
                        r.grade === 'A+' || r.grade === 'A'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : r.grade === 'F'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : r.grade === 'N/A'
                          ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      )}
                    >
                      {r.grade}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-end">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(r)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-800 text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      {isAr ? 'استعراض الشهادة' : 'View Results'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <BookOpen className="mx-auto block mb-2 opacity-40 w-10 h-10" />
                    <p className="text-sm font-medium">
                      {isAr ? 'لم يتم العثور على نتائج مسجلة للأبناء.' : 'No students results found.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* Individual Student Report Card Modal (with Save as PDF) */}
      {/* ======================================================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div
            id="student-printable-report-card"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 md:p-8 space-y-6 my-auto max-h-[92vh] overflow-y-auto"
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
                    {isAr
                      ? `شهادة درجات الطالب: ${selectedStudent.studentName}`
                      : `${selectedStudent.studentName}'s Report Card`}
                  </h2>
                </div>
              </div>

              {/* Close Button (Hidden in Print) */}
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="no-print p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Student Info Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'اسم الطالب' : 'Student Name'}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedStudent.studentName}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'الصف والشعبة' : 'Class & Section'}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedStudent.currentClass}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'الرقم التعريفي' : 'Student ID'}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
                  {selectedStudent.studentId}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'تاريخ التقرير' : 'Report Date'}
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

            {/* Subject Marks Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 py-3.5 text-start">
                      {isAr ? 'المادة الدراسية' : 'Subject'}
                    </th>
                    <th className="px-5 py-3.5 text-center">
                      {isAr ? 'الدرجة المحصلة' : 'Marks'}
                    </th>
                    <th className="px-5 py-3.5 text-center">
                      {isAr ? 'التقدير' : 'Grade'}
                    </th>
                    <th className="px-5 py-3.5 text-center">
                      {isAr ? 'النقاط' : 'Points'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {selectedStudent.subjects?.map((sub: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 text-start">
                        {sub.subject}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-center text-slate-800 dark:text-slate-200">
                        {sub.marks}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={cn(
                            'inline-block px-2.5 py-0.5 rounded-lg text-xs font-black uppercase',
                            sub.grade === 'A+' || sub.grade === 'A'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : sub.grade === 'F'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          )}
                        >
                          {sub.grade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                        {sub.point}
                      </td>
                    </tr>
                  ))}
                  {(!selectedStudent.subjects || selectedStudent.subjects.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-60" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {isAr ? 'لم ترصد درجات بعد لهذا الطالب' : 'Result is not added'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {isAr
                            ? 'لم يقم المعلمون بإدخال درجات هذا الفصل حتى الآن.'
                            : 'No subject marks have been recorded yet.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Overall Performance Summary Card */}
            {selectedStudent.subjects && selectedStudent.subjects.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 gap-3">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    {isAr ? 'المحصلة والتقييم النهائي' : 'Overall Performance'}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isAr ? 'مجموع الدرجات: ' : 'Total Marks: '}
                    </span>
                    <strong className="text-slate-900 dark:text-white text-sm font-black ps-1">
                      {selectedStudent.totalMarks}
                    </strong>
                  </span>
                  <span className="text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isAr ? 'التقدير العام: ' : 'Overall Grade: '}
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black ps-1">
                      {selectedStudent.grade}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Official Stamp & Certificate Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <p>
                {isAr
                  ? 'تم استخراج هذه الشهادة رسمياً من السجلات الأكاديمية لمنصة مثقال تك.'
                  : 'Official academic certificate generated by Methqal Tech Platform.'}
              </p>
              <p className="font-mono text-[10px]">
                CERT: RES-{selectedStudent.id?.slice(0, 8) || '2026'}-{Date.now().toString().slice(-4)}
              </p>
            </div>

            {/* Modal Actions Bar (Hidden in Print) */}
            <div className="no-print pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              {selectedStudent.subjects && selectedStudent.subjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleDownloadExcel(selectedStudent)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                  title={isAr ? 'تحميل كشف الدرجات كملف إكسل' : 'Download report card as Excel'}
                >
                  <FileSpreadsheet size={15} />
                  {isAr ? 'تحميل Excel' : 'Download Excel'}
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer size={15} />
                {isAr ? 'حفظ الشهادة بصيغة PDF / طباعة' : 'Save as PDF / Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

