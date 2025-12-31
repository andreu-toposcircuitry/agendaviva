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

// POST /api/activitats/[id]/publish - Publish or unpublish an activity
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

    const { action } = await request.json(); // 'publish' or 'unpublish'

    if (action !== 'publish' && action !== 'unpublish') {
      throw error(400, 'Invalid action. Must be "publish" or "unpublish"');
    }

    // Get current activity
    const { data: activity, error: fetchError } = await supabase
      .from('activitats')
      .select('nom, estat, municipi_id, tipologia_principal')
      .eq('id', params.id)
      .single();

    if (fetchError || !activity) {
      throw error(404, 'Activity not found');
    }

    // Validate that activity can be published
    if (action === 'publish') {
      if (!activity.municipi_id) {
        throw error(400, 'Cannot publish: municipi_id is required');
      }
      if (!activity.tipologia_principal) {
        throw error(400, 'Cannot publish: tipologia_principal is required');
      }
    }

    const newEstat = action === 'publish' ? 'publicada' : 'pendent';

    // Update activity estat
    const { data: updatedActivity, error: updateError } = await supabase
      .from('activitats')
      .update({
        estat: newEstat,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating activity estat:', updateError);
      throw error(500, 'Failed to update activity');
    }

    // Create audit log
    await createAuditLog(
      user.id,
      user.email || '',
      action,
      params.id,
      activity.nom,
      { old_estat: activity.estat, new_estat: newEstat }
    );

    return json({
      success: true,
      activity: updatedActivity,
      message: action === 'publish' ? 'Activitat publicada' : 'Activitat despublicada'
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error publishing/unpublishing activity:', err);
    throw error(500, 'Internal server error');
  }
};
