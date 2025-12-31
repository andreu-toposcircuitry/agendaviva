import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// Helper to create audit log entry
async function createAuditLog(
  userId: string,
  userEmail: string,
  action: string,
  activityId: string,
  activityName: string,
  payload: any
) {
  await supabase.from('admin_activity_audit').insert({
    user_id: userId,
    user_email: userEmail,
    action,
    activity_id: activityId,
    activity_name: activityName,
    payload
  });
}

// GET /api/activitats/[id] - Get activity details
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Authentication required');
    }

    // Check if user is admin/moderator
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      throw error(403, 'Admin/Moderator role required');
    }

    // Fetch activity with related data
    const { data: activity, error: queryError } = await supabase
      .from('activitats')
      .select(
        `
        *,
        municipis(id, nom),
        entitats(id, nom)
      `
      )
      .eq('id', params.id)
      .single();

    if (queryError || !activity) {
      throw error(404, 'Activity not found');
    }

    return json({
      activity: {
        ...activity,
        municipi_nom: activity.municipis?.nom || null,
        entitat_nom: activity.entitats?.nom || null
      }
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error fetching activity:', err);
    throw error(500, 'Internal server error');
  }
};

// PATCH /api/activitats/[id] - Update activity
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Authentication required');
    }

    // Check if user is admin/moderator
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      throw error(403, 'Admin/Moderator role required');
    }

    const updates = await request.json();

    // Get current activity for audit log
    const { data: currentActivity } = await supabase
      .from('activitats')
      .select('nom')
      .eq('id', params.id)
      .single();

    if (!currentActivity) {
      throw error(404, 'Activity not found');
    }

    // Update activity
    const { data: updatedActivity, error: updateError } = await supabase
      .from('activitats')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating activity:', updateError);
      throw error(500, 'Failed to update activity');
    }

    // Create audit log
    await createAuditLog(
      user.id,
      user.email || '',
      'update',
      params.id,
      currentActivity.nom,
      { updated_fields: Object.keys(updates) }
    );

    return json({ activity: updatedActivity, success: true });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error updating activity:', err);
    throw error(500, 'Internal server error');
  }
};

// DELETE /api/activitats/[id] - Delete activity (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Authentication required');
    }

    // Check if user is admin (not just moderator)
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active || adminUser.role !== 'admin') {
      throw error(403, 'Admin role required');
    }

    // Get activity name for audit log
    const { data: activity } = await supabase
      .from('activitats')
      .select('nom')
      .eq('id', params.id)
      .single();

    if (!activity) {
      throw error(404, 'Activity not found');
    }

    // Delete activity
    const { error: deleteError } = await supabase
      .from('activitats')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting activity:', deleteError);
      throw error(500, 'Failed to delete activity');
    }

    // Create audit log
    await createAuditLog(user.id, user.email || '', 'delete', params.id, activity.nom, {});

    return json({ success: true });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error deleting activity:', err);
    throw error(500, 'Internal server error');
  }
};
