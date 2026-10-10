"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/getCurrentUser";
import bcrypt from "bcryptjs";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully handle CLI/test environments
  }
}

export interface SubmitApplicationInput {
  schoolName: string;
  adminName: string;
  email: string;
  phone: string;
  instituteCode?: string;
  password?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\+\-\s\(\)]{7,20}$/;

import { applyDatabaseMigrations } from "@/lib/migration-runner";

let isDbReady = false;
async function ensureDb() {
  if (isDbReady) return;
  try {
    await applyDatabaseMigrations();
    isDbReady = true;
  } catch (err) {
    console.warn("ensureDb non-fatal error:", err);
  }
}

/**
 * 1. Submit a New School Application (Public)
 */
export async function submitSchoolApplication(data: SubmitApplicationInput) {
  try {
    await ensureDb();
    const schoolName = data.schoolName?.trim();
    const adminName = data.adminName?.trim();
    const email = data.email?.trim().toLowerCase();
    const phone = data.phone?.trim();
    const instituteCode = data.instituteCode?.trim() || null;
    const password = data.password?.trim();
    const message = data.message?.trim() || null;

    // Validation
    if (!schoolName || schoolName.length < 3) {
      return {
        success: false,
        error: "School name must be at least 3 characters / يجب أن يحتوي اسم المدرسة على 3 أحرف على الأقل",
      };
    }

    if (!adminName || adminName.length < 3) {
      return {
        success: false,
        error: "Administrator name must be at least 3 characters / يجب أن يحتوي اسم المسؤول على 3 أحرف على الأقل",
      };
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return {
        success: false,
        error: "Invalid email address format / صيغة البريد الإلكتروني غير صالحة",
      };
    }

    if (!phone || !PHONE_REGEX.test(phone)) {
      return {
        success: false,
        error: "Invalid contact phone number / رقم الهاتف غير صالح",
      };
    }

    if (password && password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters / يجب أن تتكون كلمة المرور من 6 خانات على الأقل",
      };
    }

    // Check for existing user with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return {
        success: false,
        error: "This email is already registered as an active account / هذا البريد الإلكتروني مسجل بالفعل كحساب نشط في المنصة",
      };
    }

    // Check for existing pending or under_review application with this email
    const activeApp = await prisma.schoolApplication.findFirst({
      where: {
        email,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    });
    if (activeApp) {
      return {
        success: false,
        error: `An application with this email is already awaiting review (Ref: ${activeApp.applicationNo}) / يوجد طلب انضمام قيد المراجعة مسجل بهذا البريد بالفعل (المرجع: ${activeApp.applicationNo})`,
      };
    }

    // Hash password if provided (never store plaintext)
    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Generate unique reference number
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const applicationNo = `APP-${new Date().getFullYear()}-${randomSuffix}`;

    const newApplication = await prisma.schoolApplication.create({
      data: {
        applicationNo,
        schoolName,
        adminName,
        email,
        phone,
        instituteCode,
        passwordHash,
        message,
        status: "PENDING",
      },
    });

    safeRevalidatePath("/dashboard/super-admin/applications");

    return {
      success: true,
      applicationNo: newApplication.applicationNo,
      data: {
        id: newApplication.id,
        applicationNo: newApplication.applicationNo,
        schoolName: newApplication.schoolName,
        adminName: newApplication.adminName,
        email: newApplication.email,
        createdAt: newApplication.createdAt,
      },
    };
  } catch (error: any) {
    console.error("submitSchoolApplication error:", error);
    return {
      success: false,
      error: error?.message || "Failed to submit school application / حدث خطأ أثناء إرسال طلب الانضمام",
    };
  }
}

/**
 * 2. Get All School Applications (Super Admin only)
 */
export async function getSchoolApplications(filters?: {
  status?: string;
  search?: string;
}) {
  try {
    await ensureDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role as string) !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized: Super Admin access required / غير مصرح: يتطلب صلاحية المشرف العام",
      };
    }

    const where: any = {};

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { applicationNo: { contains: q } },
        { schoolName: { contains: q } },
        { adminName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [applications, counts] = await Promise.all([
      prisma.schoolApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          school: {
            select: {
              id: true,
              schoolName: true,
              slug: true,
            },
          },
        },
      }),
      prisma.schoolApplication.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const countMap: Record<string, number> = {
      ALL: 0,
      PENDING: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    counts.forEach((c) => {
      countMap[c.status] = c._count.status;
      countMap.ALL += c._count.status;
    });

    return {
      success: true,
      data: applications,
      counts: countMap,
    };
  } catch (error: any) {
    console.error("getSchoolApplications error:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch school applications",
    };
  }
}

/**
 * 3. Get Single Application by ID (Super Admin only)
 */
export async function getSchoolApplicationById(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role as string) !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized: Super Admin access required",
      };
    }

    const application = await prisma.schoolApplication.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    return { success: true, data: application };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error fetching application" };
  }
}

/**
 * 4. Approve School Application (Super Admin only)
 * Atomically creates School, Administrator User, updates Application status.
 */
export async function approveSchoolApplication(id: string, notes?: string) {
  try {
    await ensureDb();
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role as string) !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized: Super Admin access required / غير مصرح: يتطلب صلاحية المشرف العام",
      };
    }

    const application = await prisma.schoolApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return { success: false, error: "Application not found / لم يتم العثور على الطلب" };
    }

    if (application.status === "APPROVED") {
      return {
        success: false,
        error: "This application has already been approved / تمت الموافقة على هذا الطلب مسبقاً",
      };
    }

    // Check if email is already taken in users
    const existingUser = await prisma.user.findUnique({
      where: { email: application.email },
    });
    if (existingUser && existingUser.schoolId) {
      return {
        success: false,
        error: "An administrator account with this email already exists and belongs to another school / يوجد حساب مسؤول مسجل بهذا البريد بالفعل",
      };
    }

    // Generate unique slug for the school
    const sanitizedName = application.schoolName
      .toLowerCase()
      .replace(/[^a-z0-9\u0621-\u064A]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const baseSlug = sanitizedName.length > 2 ? sanitizedName : "school";
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    // Prepare Administrator password (use submitted hash or secure default)
    const adminPassword =
      application.passwordHash || (await bcrypt.hash("School@123456", 10));
    const adminAuthUserId = `local-adm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create School record
      const school = await tx.school.create({
        data: {
          schoolName: application.schoolName,
          slug,
          schoolEmail: application.email,
          phone: application.phone,
          registrationId: application.instituteCode || application.applicationNo,
          schoolCategory: "combined",
          plan: "basic",
          duration: "12",
          language: "arabic",
        },
      });

      // 2. Create or associate Admin User
      const adminUser = await tx.user.upsert({
        where: { email: application.email },
        update: {
          role: "admin",
          schoolId: school.id,
          status: "active",
          password: adminPassword,
          name: application.adminName,
          mustChangePassword: true,
        },
        create: {
          authUserId: adminAuthUserId,
          name: application.adminName,
          email: application.email,
          role: "admin",
          schoolId: school.id,
          status: "active",
          password: adminPassword,
          mustChangePassword: true,
        },
      });

      // 3. Update Application status to APPROVED
      const updatedApplication = await tx.schoolApplication.update({
        where: { id: application.id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: currentUser.email || currentUser.id || "super_admin",
          reviewNotes: notes || "Approved by Super Admin",
          schoolId: school.id,
        },
      });

      // 4. Create initial active subscription and transaction for the newly approved school
      const planName = school.plan ? (school.plan.charAt(0).toUpperCase() + school.plan.slice(1)) : "Basic";
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await tx.subscription.create({
        data: {
          transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
          amount: planName.toLowerCase().includes('enterprise') ? 750000 : (planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('premium')) ? 350000 : 150000,
          currency: "YER",
          status: "SUCCESS",
          planName: planName,
          duration: "1 Year",
          schoolId: school.id,
          method: "Direct Onboarding / اعتماد مباشر",
          customerName: application.adminName,
          customerEmail: application.email,
          customerPhone: application.phone,
          startDate,
          endDate,
        }
      });

      return { school, adminUser, application: updatedApplication };
    });

    safeRevalidatePath("/dashboard/super-admin/applications");
    safeRevalidatePath("/dashboard/super-admin/schools");
    safeRevalidatePath("/dashboard/super-admin/transactions");
    safeRevalidatePath("/dashboard/super-admin");
    safeRevalidatePath("/schools");

    return {
      success: true,
      message: "Application approved and school created successfully / تمت الموافقة على الطلب وإنشاء المدرسة بنجاح",
      data: result,
    };
  } catch (error: any) {
    console.error("approveSchoolApplication error:", error);
    return {
      success: false,
      error: error?.message || "Failed to approve application / فشل في الموافقة على الطلب",
    };
  }
}

/**
 * 5. Reject School Application (Super Admin only)
 */
export async function rejectSchoolApplication(id: string, reason?: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role as string) !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized: Super Admin access required / غير مصرح: يتطلب صلاحية المشرف العام",
      };
    }

    const application = await prisma.schoolApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    if (application.status === "APPROVED") {
      return {
        success: false,
        error: "Cannot reject an already approved application / لا يمكن رفض طلب تمت الموافقة عليه مسبقاً",
      };
    }

    const updated = await prisma.schoolApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: currentUser.email || currentUser.id || "super_admin",
        reviewNotes: reason?.trim() || "Rejected during administrative review",
      },
    });

    safeRevalidatePath("/dashboard/super-admin/applications");

    return {
      success: true,
      message: "Application rejected / تم رفض الطلب",
      data: updated,
    };
  } catch (error: any) {
    console.error("rejectSchoolApplication error:", error);
    return {
      success: false,
      error: error?.message || "Failed to reject application",
    };
  }
}

/**
 * 6. Public Application Status Check
 */
export async function checkApplicationStatus(query: string) {
  try {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { success: false, error: "Please provide a reference number or email" };
    }

    const application = await prisma.schoolApplication.findFirst({
      where: {
        OR: [
          { applicationNo: { equals: query.trim() } },
          { email: { equals: q } },
        ],
      },
      select: {
        applicationNo: true,
        schoolName: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        reviewNotes: true,
      },
    });

    if (!application) {
      return {
        success: false,
        error: "No application found matching this reference / لم يتم العثور على طلب بهذا المرجع",
      };
    }

    return {
      success: true,
      data: application,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to check application status",
    };
  }
}
