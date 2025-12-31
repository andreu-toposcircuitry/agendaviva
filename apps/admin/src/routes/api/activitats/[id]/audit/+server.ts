import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// GET /api/activitats/[id]/audit - Get audit log for an activity
export const GET: RequestHandler = async ({ params, url, locals }) => {
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

    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch audit logs for this activity
    const { data: auditLogs, error: queryError } = await supabase
      .from('admin_activity_audit')
      .select('*')
      .eq('activity_id', params.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (queryError) {
      console.error('Error fetching audit logs:', queryError);
      throw error(500, 'Failed to fetch audit logs');
    }

    return json({ auditLogs: auditLogs || [] });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error fetching audit logs:', err);
    throw error(500, 'Internal server error');
  }
};
