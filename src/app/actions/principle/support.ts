'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * নতুন সাপোর্ট টিকেট তৈরি করা (ImgBB ইমেজ আপলোড সহ)
 */
export async function createSupportTicket(data: {
  subject: string;
  description: string;
  priority: string;
  userEmail: string;
  schoolId?: string | null;
  image?: string | null; // Base64 string from frontend
}) {
  try {
    let imageUrl = '';

    // 1. Upload image if provided, with fail-safe error handling
    if (data.image) {
      try {
        const base64Data = data.image.includes(',') ? data.image.split(',')[1] : data.image;
        if (process.env.IMGBB_API_KEY) {
          const formData = new FormData();
          formData.append('image', base64Data);

          const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            {
              method: 'POST',
              body: formData,
            },
          );

          const uploadResult = await response.json();
          if (uploadResult.success) {
            imageUrl = uploadResult.data.url;
          }
        }
      } catch (uploadErr) {
        console.warn('Image upload skipped or failed, proceeding with ticket creation:', uploadErr);
      }
    }

    // 2. Resolve schoolId if not directly provided
    let resolvedSchoolId = data.schoolId || null;
    if (!resolvedSchoolId && data.userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: data.userEmail },
        select: { schoolId: true }
      });
      if (user?.schoolId) {
        resolvedSchoolId = user.schoolId;
      }
    }

    // 3. Save ticket to database
    const ticket = await prisma.supportTicket.create({
      data: {
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'low',
        userEmail: data.userEmail,
        schoolId: resolvedSchoolId,
        attachmentUrl: imageUrl || null,
      },
    });

    // Revalidate paths
    revalidatePath('/dashboard/support');
    revalidatePath('/dashboard/super-admin/support');
    revalidatePath('/dashboard/principal/addsupport');

    return { success: true, data: ticket };
  } catch (error: any) {
    console.error('Create Ticket Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create ticket',
    };
  }
}

/**
 * ডাটাবেজ থেকে সব টিকেট লোড করা
 */
export async function getAllSupportTickets() {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        school: {
          select: {
            schoolName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, data: tickets };
  } catch (error) {
    console.error('Fetch Error:', error);
    return { success: false, error: 'Failed to load tickets' };
  }
}

/**
 * টিকেটের স্ট্যাটাস (Open/Completed) আপডেট করা
 */
export async function updateTicketStatus(ticketId: string, newStatus: string) {
  try {
    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: newStatus },
    });
    revalidatePath('/dashboard/support');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Update Status Error:', error);
    return { success: false, error: 'Failed to update status' };
  }
}

/**
 * টিকেট ডিলিট করা
 */
export async function deleteTicket(ticketId: string) {
  try {
    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });
    revalidatePath('/dashboard/support');
    return { success: true };
  } catch (error) {
    console.error('Delete Error:', error);
    return { success: false, error: 'Failed to delete ticket' };
  }
}
