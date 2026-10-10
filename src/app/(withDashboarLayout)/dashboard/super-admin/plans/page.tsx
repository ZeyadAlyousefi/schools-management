"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Plus, Zap, Shield, Crown,
  Trash2, Users, UserRound, HardDrive, LayoutGrid, Edit, Hash, Loader2
} from 'lucide-react';
import { getPlans, deletePlan } from '@/app/actions/plans';
import Swal from 'sweetalert2';
import { useLanguage } from '@/context/LanguageProvider';
import { formatCurrency } from '@/lib/formatters';

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Shield,
  Crown
};

export default function PlansSetup() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const res = await getPlans();
      if (res.success && res.data) {
        setPlans(res.data);
      } else {
        console.error('Failed to fetch plans:', res.error);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // const handleDeletePlan = async (id: string) => {
  //   const confirmDelete = confirm(`Are you sure you want to delete plan ID: ${id}?`);
  //   if (confirmDelete) {
  //     try {
  //       const res = await deletePlan(id);
  //       if (res.success) {
  //         alert(`Plan deleted successfully!`);
  //         fetchPlans(); // Refresh list after deletion
  //       } else {
  //         alert(`Failed to delete plan: ${res.error}`);
  //       }
  //     } catch (error) {
  //       console.error('Error deleting plan:', error);
  //       alert('An error occurred while deleting the plan');
  //     }
  //   }
  // };


const handleDeletePlan = async (id: string) => {

  const result = await Swal.fire({
    title: "Delete Plan?",
    text: `Are you sure you want to delete plan ID: ${id}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await deletePlan(id);

    if (res.success) {

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Plan deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchPlans(); // refresh list

    } else {

      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: res.error || "Failed to delete plan",
      });

    }

  } catch (error) {

    console.error("Error deleting plan:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while deleting the plan",
    });

  }
};

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <div>
          <h2 className="text-3xl py-3 font-black text-[var(--color-text-primary)] tracking-tight">{isAr ? 'خطط الاشتراك' : 'Subscription Plans'}</h2>
          <p className="text-[var(--color-text-muted)] mt-2 font-medium">{isAr ? 'إدارة باقات المنصة السحابية والأسعار والميزات.' : 'Manage your SaaS packages by unique ID.'}</p>
        </div>

        <Link href="/dashboard/super-admin/plans/new" className="flex mt-3 items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-bold text-sm w-47 shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
          <Plus size={18} /> {isAr ? 'إنشاء خطة جديدة' : 'Create New Plan'}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-[var(--color-primary)]" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          <p>{isAr ? 'لا توجد خطط متاحة. أنشئ خطة جديدة للبدء.' : 'No plans found. Create one to get started.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const IconComponent = plan.icon && iconMap[plan.icon] ? iconMap[plan.icon] : Zap;
            return (
              <div key={plan.id} className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-light)] p-8 relative group hover:border-[var(--color-primary)] transition-all shadow-sm">

                {/* ID Badge & Action Icons */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1">
                    <div className={`p-3 rounded-2xl bg-[var(--color-bg-page)] w-fit`}>
                      <IconComponent className={`h-8 w-8 ${plan.color || 'text-blue-500'}`} />
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter mt-2">
                      <Hash size={10} /> {plan.id}
                    </div>
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/super-admin/plans/${plan.id}/edit`}
                      title={isAr ? "تعديل الخطة" : "Edit Plan"}
                      className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      title={isAr ? "حذف الخطة" : "Delete Plan"}
                      className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-[var(--color-text-primary)] mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-[var(--color-text-primary)]">
                    {formatCurrency(plan.price, isAr ? 'ar' : 'en')}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] font-black uppercase tracking-widest">/ {plan.duration}</span>
                </div>

                {/* Limits Summary */}
                <div className="grid grid-cols-3 gap-2 mb-8 border-y border-[var(--color-border-light)] py-4">
                  <div className="text-center">
                    <Users size={18} className="mx-auto text-[var(--color-text-muted)] mb-1" />
                    <p className="text-[11px] font-black text-[var(--color-text-primary)]">{plan.students} {isAr ? 'طالب' : 'Std'}</p>
                  </div>
                  <div className="text-center border-x border-[var(--color-border-light)]">
                    <UserRound size={18} className="mx-auto text-[var(--color-text-muted)] mb-1" />
                    <p className="text-[11px] font-black text-[var(--color-text-primary)]">{plan.teachers} {isAr ? 'معلم' : 'Teach'}</p>
                  </div>
                  <div className="text-center">
                    <HardDrive size={18} className="mx-auto text-[var(--color-text-muted)] mb-1" />
                    <p className="text-[11px] font-black text-[var(--color-text-primary)]">{plan.storage}</p>
                  </div>
                </div>

                {/* Modules */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest flex items-center gap-2">
                    <LayoutGrid size={12} /> {isAr ? 'الوحدات المضمنة' : 'Modules Included'}
                  </p>
                  <ul className="grid grid-cols-1 gap-2">
                    {plan.modules && plan.modules.map((mod: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                        <CheckCircle2 size={14} className="text-green-500" /> {mod}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
