"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

/**
 * --- User Management Section ---
 */

// 1. Fetch Super Admin Users
export async function getSuperAdminUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'super_admin' },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: "Failed to fetch users / تعذر تحميل بيانات المستخدمين" };
  }
}

// 1.5 Fetch All Users
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        school: {
          select: {
            schoolName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch users / تعذر تحميل بيانات المستخدمين" };
  }
}

// 2. Create Super Admin User
export async function createSuperAdmin(userData: { name: string; email: string; password?: string; confirmPassword?: string }) {
  let authUserId: string | null = null;
  try {
    const rawPassword = userData.password?.trim() || "";
    if (rawPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters / يجب أن تتكون كلمة المرور من 6 خانات على الأقل" };
    }
    if (userData.confirmPassword && rawPassword !== userData.confirmPassword.trim()) {
      return { success: false, error: "Passwords do not match / كلمتا المرور غير متطابقتين" };
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("dummy")) {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: rawPassword,
          email_confirm: true,
          user_metadata: { role: 'super_admin', name: userData.name }
        });
        if (authData?.user) authUserId = authData.user.id;
      } catch (err) {
        console.warn("Supabase user creation bypassed for demo");
      }
    }

    if (!authUserId) {
      authUserId = `local-sa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const firstSchool = await prisma.school.findFirst();

    const newUser = await prisma.user.create({
      data: {
        authUserId: authUserId!,
        name: userData.name,
        email: userData.email,
        role: 'super_admin', 
        schoolId: firstSchool?.id || null, 
        status: "active",
        password: hashedPassword,
        mustChangePassword: true,
      }
    });

    // Correct revalidation paths
    revalidatePath("/dashboard/super-admin/add-users");
    revalidatePath("/dashboard/super-admin/all-users");
    return { success: true, data: newUser };
  } catch (error: any) {
    if (authUserId) await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => {});
    return { success: false, error: error.message || "Failed to create super admin" };
  }
}

// ৩. সুপার এডমিন ডিলিট করা (Auth + DB)
export async function deleteSuperAdmin(userId: string, authUserId: string) {
  try {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
    if (authError) throw new Error(authError.message);

    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath("/dashboard/super-admin/add-users");
    revalidatePath("/dashboard/super-admin/all-users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ৪. কনফিগ হ্যান্ডলিং (লোগো সহ)
export async function getSystemConfig() {
    try {
      const config = await prisma.systemConfig.findUnique({ where: { id: "system_config" } });
      return { success: true, data: config };
    } catch (error) {
      return { success: false };
    }
}

export async function updateSystemConfig(data: any) {
    try {
      const config = await prisma.systemConfig.upsert({
        where: { id: "system_config" },
        update: data,
        create: { id: "system_config", ...data }
      });
      revalidatePath("/dashboard/super-admin/add-users");
      return { success: true, data: config };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}

export async function getSystemSettings() {
  try {
    let config = await prisma.systemConfig.findUnique({ where: { id: "system_config" } });
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: "system_config",
          siteName: "Methqal Tech Schools",
          siteSubtitle: JSON.stringify({
            supportEmail: "support@methqal.tech",
            supportPhone: "+967-1-234567",
            defaultCurrency: "YER",
            defaultLanguage: "ar",
            minPasswordLength: 8,
            requireSpecialChar: true,
            allowRegistration: true,
            sessionTimeoutHours: 24,
            maintenanceMode: false,
          }),
          siteLogo: "/logo.png"
        }
      });
    }

    let extra: any = {};
    if (config.siteSubtitle && config.siteSubtitle.startsWith('{')) {
      try {
        extra = JSON.parse(config.siteSubtitle);
      } catch (e) {}
    }

    return {
      success: true,
      data: {
        siteName: config.siteName || "Methqal Tech Schools",
        siteLogo: config.siteLogo || "/logo.png",
        supportEmail: extra.supportEmail || "support@methqal.tech",
        supportPhone: extra.supportPhone || "+967-1-234567",
        defaultCurrency: extra.defaultCurrency || "YER",
        defaultLanguage: extra.defaultLanguage || "ar",
        minPasswordLength: extra.minPasswordLength || 8,
        requireSpecialChar: extra.requireSpecialChar ?? true,
        allowRegistration: extra.allowRegistration ?? true,
        sessionTimeoutHours: extra.sessionTimeoutHours || 24,
        maintenanceMode: extra.maintenanceMode ?? false,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveSystemSettings(settings: any) {
  try {
    const extra = {
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      defaultCurrency: settings.defaultCurrency,
      defaultLanguage: settings.defaultLanguage,
      minPasswordLength: Number(settings.minPasswordLength) || 8,
      requireSpecialChar: Boolean(settings.requireSpecialChar),
      allowRegistration: Boolean(settings.allowRegistration),
      sessionTimeoutHours: Number(settings.sessionTimeoutHours) || 24,
      maintenanceMode: Boolean(settings.maintenanceMode),
    };

    const updated = await prisma.systemConfig.upsert({
      where: { id: "system_config" },
      update: {
        siteName: settings.siteName,
        siteLogo: settings.siteLogo || "/logo.png",
        siteSubtitle: JSON.stringify(extra),
      },
      create: {
        id: "system_config",
        siteName: settings.siteName,
        siteLogo: settings.siteLogo || "/logo.png",
        siteSubtitle: JSON.stringify(extra),
      }
    });

    revalidatePath("/dashboard/super-admin/add-users");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}






// ৫. 슈퍼 এডমিন ড্যাশবোর্ড ওভারভিউ ডাটা (Pure 100% Live Database Driven)
export async function getSuperAdminDashboardData() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalSchools,
      activeSubscriptions,
      monthlyRevenue,
      totalRevenue,
      expiringSoon,
      subscriptionsData,
      schoolsData
    ] = await Promise.all([
      prisma.school.count(),
      prisma.subscription.count({
        where: { status: "SUCCESS", endDate: { gte: now } }
      }),
      prisma.subscription.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      prisma.subscription.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true }
      }),
      prisma.subscription.findMany({
        where: { status: "SUCCESS", endDate: { gte: now, lte: in7Days } },
        include: { school: true },
        orderBy: { endDate: "asc" },
        take: 10
      }),
      prisma.subscription.findMany({
        where: { status: "SUCCESS" },
        select: { planName: true }
      }),
      prisma.school.findMany({
        select: { plan: true }
      })
    ]);

    // Revenue Growth (Last 6 Months from real SUCCESS subscriptions)
    const revenueGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthRevenue = await prisma.subscription.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: d, lte: end } },
        _sum: { amount: true }
      });
      revenueGrowth.push({
        name: d.toLocaleString('en-US', { month: 'short' }),
        amount: monthRevenue._sum.amount || 0
      });
    }

    // Plan Distribution: Calculate from real subscriptions first, or school plans
    const sourcePlans = subscriptionsData.length > 0 
      ? subscriptionsData.map((s: any) => (s.planName || '').toLowerCase())
      : schoolsData.map((s: any) => (s.plan || '').toLowerCase());

    const planCounts = sourcePlans.reduce((acc: any, plan: string) => {
      const p = plan.includes('enter') ? 'enterprise' : (plan.includes('pro') || plan.includes('prem') ? 'premium' : 'basic');
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, { basic: 0, premium: 0, enterprise: 0 });

    const totalPlans = sourcePlans.length;
    const planDistribution = [
      { 
        name: "Basic", 
        value: totalPlans > 0 ? Math.round(((planCounts.basic || 0) / totalPlans) * 100) : 0, 
        count: planCounts.basic || 0,
        color: "#3b82f6" 
      },
      { 
        name: "Premium", 
        value: totalPlans > 0 ? Math.round(((planCounts.premium || 0) / totalPlans) * 100) : 0, 
        count: planCounts.premium || 0,
        color: "#8b5cf6" 
      },
      { 
        name: "Enterprise", 
        value: totalPlans > 0 ? Math.round(((planCounts.enterprise || 0) / totalPlans) * 100) : 0, 
        count: planCounts.enterprise || 0,
        color: "#10b981" 
      }
    ];

    return {
      success: true,
      data: {
        totalSchools,
        activeSubscriptions,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        totalRevenue: totalRevenue._sum.amount || 0,
        expiringSoonCount: expiringSoon.length,
        expiringSoonList: expiringSoon.map((s: any) => ({
          schoolName: s.school?.schoolName || 'Unknown School',
          expiryDate: s.endDate,
          plan: s.planName
        })),
        planDistribution,
        revenueGrowth
      }
    };
  } catch (error: any) {
    console.error("Dashboard Stats Live DB Error:", error.message);
    // NEVER return fake/demo data under any circumstances
    return {
      success: false,
      error: error.message,
      data: {
        totalSchools: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
        expiringSoonCount: 0,
        expiringSoonList: [],
        planDistribution: [
          { name: "Basic", value: 0, count: 0, color: "#3b82f6" },
          { name: "Premium", value: 0, count: 0, color: "#8b5cf6" },
          { name: "Enterprise", value: 0, count: 0, color: "#10b981" }
        ],
        revenueGrowth: []
      }
    };
  }
}

