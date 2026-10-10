'use client';

import React, { useState, useEffect } from 'react';
import {
  
  User,
  CheckCircle2,
  X,
  Eye,
  
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  School,
  Loader2,
} from 'lucide-react';
import {
  getAllSupportTickets,
  updateTicketStatus,
  deleteTicket,
} from '@/app/actions/principle/support';
import Swal from 'sweetalert2';
import { useLanguage } from '@/context/LanguageProvider';

export default function ActivityHelpDesk() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    const result = await getAllSupportTickets();
    if (result.success && result.data) setActivities(result.data);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    setUpdating(true);
    let nextStatus = currentStatus === 'open' ? 'reviewing' : 'completed';
    const result = await updateTicketStatus(id, nextStatus);
    if (result.success) {
      setActivities((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)),
      );
      setSelectedTicket((prev: any) =>
        prev ? { ...prev, status: nextStatus } : null,
      );
    }
    setUpdating(false);
  };
  const handleDelete = async (id: string) => {

    const confirm = await Swal.fire({
      title: "Delete Ticket?",
      text: "Are you sure you want to delete this ticket?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const result = await deleteTicket(id);

    if (result.success) {

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Ticket deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      setActivities((prev) => prev.filter((t) => t.id !== id));

      if (selectedTicket?.id === id) {
        setSelectedTicket(null);
      }

    } else {

      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: result.error || "Failed to delete ticket.",
      });

    }
  };
  if (loading)
    return (
      <div className="p-10 text-center font-black animate-pulse text-primary flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        INITIALIZING COMMAND CENTER...
      </div>
    );

  return (
    <div className="relative space-y-8 animate-fade-in-up p-2 md:p-0">
      {/* --- Header --- */}
      <div className="bg-[var(--color-bg-card)] p-8 rounded-[32px] border border-[var(--color-border-light)] shadow-sm">
        <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight uppercase">
          {isAr ? <>تذاكر <span className="text-primary">الدعم الفني</span></> : <>Support <span className="text-primary">Tickets</span></>}
        </h2>
        <p className="text-[var(--color-text-muted)] mt-1 font-bold text-xs uppercase tracking-widest">
          {isAr ? `النشطة: ${activities.filter((t) => t.status !== 'completed').length} | المكتملة: ${activities.filter((t) => t.status === 'completed').length}` : `Active: ${activities.filter((t) => t.status !== 'completed').length} | Resolved: ${activities.filter((t) => t.status === 'completed').length}`}
        </p>
      </div>

      {/* --- Table --- */}
      <div className="bg-[var(--color-bg-card)] rounded-[32px] border border-[var(--color-border-light)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-page)]/50 border-b border-[var(--color-border-light)]">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{isAr ? 'الموضوع' : 'Subject'}</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{isAr ? 'الأولوية' : 'Priority'}</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {activities.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-primary/[0.02] transition-colors group"
                >
                  <td className="p-6">
                    <p className="font-black text-[var(--color-text-primary)] group-hover:text-primary transition-colors">
                      {item.subject}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase mt-1">
                      ID: #{item.id.slice(-6)}
                    </p>
                  </td>
                  <td className="p-6">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : item.status === 'reviewing' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`}
                      />
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-end">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(item)}
                        className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Detail Modal (X Button Fix) --- */}
      {selectedTicket && (
        <div className="fixed inset-0 mb-6 flex flex-col -translate-y-10 items-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedTicket(null)}
          ></div>

          {/* Modal Container */}
          <div className="relative bg-[var(--color-bg-card)] w-full max-w-4xl max-h-[90vh] rounded-[40px] border border-[var(--color-border-light)] shadow-2xl flex flex-col overflow-visible animate-fade-in-up">
            {/* --- FIXED CROSS BUTTON (Always on top of Header) --- */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-4 -end-4 z-[10000] p-4 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all shadow-xl border-4 border-[var(--color-bg-card)] active:scale-90 group"
              style={{ pointerEvents: 'auto' }}
            >
              <X
                size={24}
                strokeWidth={3}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
            </button>

            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-[var(--color-border-light)] flex items-center gap-4 bg-primary/5 shrink-0 rounded-t-[40px]">
              <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight text-[var(--color-text-primary)] leading-none">
                  Ticket Overview
                </h3>
                <p className="text-[10px] font-bold text-primary uppercase mt-1.5 tracking-[2px]">
                  Admin Management Console
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar flex-grow space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Info Column */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-primary uppercase mb-4 leading-tight">
                      {selectedTicket.subject}
                    </h2>
                    <div className="bg-[var(--color-bg-page)] p-6 rounded-[32px] border border-[var(--color-border-light)] shadow-inner">
                      <p className="text-[var(--color-text-secondary)] font-medium italic">
                        "{selectedTicket.description}"
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-4 p-4 bg-[var(--color-bg-page)] rounded-2xl border border-[var(--color-border-light)]">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <School size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase italic">
                          Institution ID
                        </p>
                        <p className="text-sm font-black">
                          {selectedTicket.school?.schoolName || selectedTicket.schoolId || (isAr ? 'غير محدد' : 'N/A')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-[var(--color-bg-page)] rounded-2xl border border-[var(--color-border-light)]">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase italic">
                          Submitted By
                        </p>
                        <p className="text-sm font-black">
                          {selectedTicket.userEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Column */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} /> Attachment Preview
                  </h3>
                  <div className="relative rounded-[32px] overflow-hidden border-2 border-[var(--color-border-light)] bg-slate-900 shadow-xl h-[320px] group">
                    {selectedTicket.attachmentUrl ? (
                      <>
                        <img
                          src={selectedTicket.attachmentUrl}
                          alt="Screenshot"
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                        <a
                          href={selectedTicket.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs gap-2"
                        >
                          <ExternalLink size={20} /> OPEN ORIGINAL
                        </a>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-10 text-white">
                        <ImageIcon size={64} className="mb-2" />
                        <p className="font-black text-[10px] uppercase tracking-widest">
                          No Media Attached
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-[var(--color-border-light)] bg-[var(--color-bg-page)]/50 shrink-0 rounded-b-[40px]">
              {selectedTicket.status !== 'completed' ? (
                <button
                  disabled={updating}
                  onClick={() =>
                    handleStatusUpdate(selectedTicket.id, selectedTicket.status)
                  }
                  className="w-full bg-primary text-white py-5 rounded-[28px] font-black uppercase tracking-[3px] text-xs hover:bg-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      {selectedTicket.status === 'open'
                        ? (isAr ? 'بدء المراجعة' : 'Initialize Reviewing')
                        : (isAr ? 'تحديد كمكتملة' : 'Mark as Resolved')}
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full bg-emerald-500/10 text-emerald-600 py-6 rounded-[28px] font-black uppercase text-xs text-center border-2 border-emerald-500/20 flex items-center justify-center gap-2 shadow-inner">
                  <CheckCircle2 size={20} /> {isAr ? "تم حل المشكلة بنجاح" : "Problem Resolved Successfully"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
