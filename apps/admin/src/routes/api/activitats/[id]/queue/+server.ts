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

// POST /api/activitats/[id]/queue - Add to queue
export const POST: RequestHandler = async ({ params, request, locals }) => {
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

    const { prioritat = 'mitjana', motiu, motiu_detall } = await request.json();

    if (!motiu) {
      throw error(400, 'motiu is required');
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

    // Check if already in queue
    const { data: existingQueue } = await supabase
      .from('cua_revisio')
      .select('id')
      .eq('activitat_id', params.id)
      .is('resolt_at', null)
      .single();

    if (existingQueue) {
      throw error(400, 'Activity already in queue');
    }

    // Add to queue
    const { data: queueEntry, error: insertError } = await supabase
      .from('cua_revisio')
      .insert({
        activitat_id: params.id,
        prioritat,
        motiu,
        motiu_detall
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding to queue:', insertError);
      throw error(500, 'Failed to add to queue');
    }

    // Mark needs_review
    await supabase
      .from('activitats')
      .update({ needs_review: true })
      .eq('id', params.id);

    // Create audit log
    await createAuditLog(
      user.id,
      user.email || '',
      'queue_add',
      params.id,
      activity.nom,
      { prioritat, motiu }
    );

    return json({ success: true, queueEntry });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error adding to queue:', err);
    throw error(500, 'Internal server error');
  }
};

// DELETE /api/activitats/[id]/queue - Remove from queue
export const DELETE: RequestHandler = async ({ params, locals }) => {
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

    // Get activity name for audit log
    const { data: activity } = await supabase
      .from('activitats')
      .select('nom')
      .eq('id', params.id)
      .single();

    if (!activity) {
      throw error(404, 'Activity not found');
    }

    // Mark queue entry as resolved
    const { error: updateError } = await supabase
      .from('cua_revisio')
      .update({
        resolt_at: new Date().toISOString(),
        resolt_per: user.id,
        resolucio: 'saltat'
      })
      .eq('activitat_id', params.id)
      .is('resolt_at', null);

    if (updateError) {
      console.error('Error removing from queue:', updateError);
      throw error(500, 'Failed to remove from queue');
    }

    // Unmark needs_review
    await supabase
      .from('activitats')
      .update({ needs_review: false })
      .eq('id', params.id);

    // Create audit log
    await createAuditLog(
      user.id,
      user.email || '',
      'queue_remove',
      params.id,
      activity.nom,
      {}
    );

    return json({ success: true });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error removing from queue:', err);
    throw error(500, 'Internal server error');
  }
};
