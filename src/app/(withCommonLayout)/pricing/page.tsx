'use client';
import React, { useEffect, useState } from 'react';
import {
  Check, Zap, Shield, Crown, Loader2, Users, UserRound,
  HardDrive, Star, Rocket, Gem, Sparkles, Globe,
  ChevronRight
} from 'lucide-react';
import { motion } from "framer-motion";
import Link from 'next/link';
import { getPlans } from '@/app/actions/plans';
import { useLanguage } from '@/context/LanguageProvider';
import { formatCurrency } from '@/lib/formatters';

const iconMap: Record<string, React.ElementType> = {
  Zap, Shield, Crown, Star, Rocket, Gem, Sparkles, Globe
};

const PricingPage = () => {
    const { language, t } = useLanguage();
    const isAr = language === 'ar';
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await getPlans();
                if (res.success && res.data) {
                    setPlans(res.data);
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-bg-page">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-page pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 start-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
                <div className="absolute top-20 start-10 w-72 h-72 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[100px] opacity-60" />
                <div className="absolute top-40 end-10 w-96 h-96 bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-[120px] opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-24">
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 mb-6"
                  >
                      <Sparkles size={14} />
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                        {isAr ? "باقات مرنة ومناسبة" : "Flexible Packages"}
                      </span>
                  </motion.div>

                  <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-5xl md:text-7xl font-black text-text-primary mb-8 tracking-tight"
                  >
                      {isAr ? (
                        <>الخطة المثالية <span className="text-blue-600 dark:text-blue-400">لكل مدرسة</span></>
                      ) : (
                        <>The perfect plan for <span className="text-blue-600 dark:text-blue-400">every school</span></>
                      )}
                  </motion.h1>

                  <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl text-text-secondary font-medium max-w-2xl mx-auto"
                  >
                      {isAr
                        ? "من المدارس الصغيرة إلى المؤسسات الكبرى، نوفر خططاً تناسب مختلف الاحتياجات. كل ما تحتاجه لإدارة مدرستك في بيئة واحدة متكاملة."
                        : "From small startups to large institutions, we have a plan to suit your needs. Everything you need to manage your school in one place."}
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
                    {plans.map((plan, index) => {
                        const IconComponent = plan.icon && iconMap[plan.icon] ? iconMap[plan.icon] : Zap;
                        const isPopular = index === 1;

                        let colorClasses = 'bg-blue-50 text-blue-600';
                        if (plan.color === 'purple') colorClasses = 'bg-purple-50 text-purple-600';
                        if (plan.color === 'orange') colorClasses = 'bg-orange-50 text-orange-600';
                        if (plan.color === 'emerald') colorClasses = 'bg-emerald-50 text-emerald-600';
                        if (plan.color === 'rose') colorClasses = 'bg-rose-50 text-rose-600';

                        const durationLabel = isAr ? "شهر" : (plan.duration?.split(' ')[1] || 'mo');

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative bg-bg-card p-12 rounded-[3.5rem] border-2 transition-all hover:scale-[1.02] ${isPopular ? 'border-blue-600 shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)]' : 'border-border-light shadow-xl shadow-gray-200/50 dark:shadow-none'}`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-5 start-1/2 -translate-x-1/2 bg-blue-600 dark:bg-blue-500 text-white px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30">
                                        {isAr ? "الأكثر طلباً" : "Best Value"}
                                    </div>
                                )}

                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner ${colorClasses} dark:bg-opacity-20`}>
                                    <IconComponent size={36} />
                                </div>

                                <h3 className="text-3xl font-black text-text-primary leading-tight">
                                  {isAr ? (plan.name === 'Starter' ? 'الباقة الأساسية' : plan.name === 'Pro' ? 'الباقة الاحترافية' : plan.name === 'Enterprise' ? 'باقة المؤسسات' : plan.name) : plan.name}
                                </h3>
                                <div className="mt-8 flex flex-col">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-4xl sm:text-5xl font-black text-text-primary">
                                        {formatCurrency(plan.price, isAr ? 'ar' : 'en')}
                                      </span>
                                      <span className="text-text-muted font-bold text-lg">/{durationLabel}</span>
                                    </div>
                                    <p className="text-text-muted font-bold uppercase tracking-widest text-[10px] mt-4">
                                      {isAr ? "خطة اشتراك" : "Subscription Plan"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 my-10 font-bold text-sm">
                                  <div className="flex items-center gap-3 text-text-secondary">
                                    <Users size={18} className="text-blue-500 dark:text-blue-400" />
                                    <span>{plan.students} {isAr ? "طالب" : "Students"}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-text-secondary">
                                    <UserRound size={18} className="text-purple-500 dark:text-purple-400" />
                                    <span>{plan.teachers} {isAr ? "معلم" : "Teachers"}</span>
                                  </div>
                                </div>

                                <ul className="space-y-5 mb-12 flex-1 pt-6 border-t border-border-light">
                                    {plan.modules && plan.modules.slice(0, 5).map((module: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-4 text-sm font-bold text-text-secondary">
                                            <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            {isAr ? t(module) : module}
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/login" className="block">
                                  <button className={`w-full py-5 rounded-[2.5rem] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-2 ${isPopular ? 'bg-text-primary text-bg-card shadow-gray-400/50 dark:shadow-none hover:opacity-90' : 'bg-bg-page text-text-primary border border-border-light shadow-gray-100 dark:shadow-none hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500'}`}>
                                      {isAr ? "ابدأ الاستكشاف" : "Start Exploring"} <ChevronRight size={20} className={isAr ? "rotate-180" : ""} />
                                  </button>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
