import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// Helper to create audit log entry
async function createAuditLog(
  userId: string,
  userEmail: string,
  action: string,
  payload: any
) {
  await supabase.from('admin_activity_audit').insert({
    user_id: userId,
    user_email: userEmail,
    action,
    payload
  });
}

// POST /api/activitats/bulk - Bulk operations on activities
export const POST: RequestHandler = async ({ request, locals }) => {
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

    const {
      operation,
      activityIds,
      filters,
      confiancaThreshold = 70,
      ndConfiancaThreshold = 70
    } = await request.json();

    if (!operation) {
      throw error(400, 'operation is required');
    }

    let targetIds: string[] = activityIds || [];

    // If filters provided instead of IDs, fetch IDs based on filters
    if (!activityIds && filters) {
      let query = supabase.from('activitats').select('id');

      // Apply filters
      if (filters.municipi_id) {
        query = query.eq('municipi_id', filters.municipi_id);
      }
      if (filters.tipologia_principal) {
        query = query.eq('tipologia_principal', filters.tipologia_principal);
      }
      if (filters.estat) {
        query = query.eq('estat', filters.estat);
      }
      if (filters.needs_review !== undefined) {
        query = query.eq('needs_review', filters.needs_review);
      }
      if (filters.confianca_min !== undefined) {
        query = query.gte('confianca_global', filters.confianca_min);
      }
      if (filters.in_queue !== undefined && filters.in_queue) {
        // Activities in queue (have unresolved cua_revisio entry)
        const { data: queueActivities } = await supabase
          .from('cua_revisio')
          .select('activitat_id')
          .is('resolt_at', null);
        
        if (queueActivities) {
          const queueIds = queueActivities.map((q: any) => q.activitat_id);
          query = query.in('id', queueIds);
        }
      }

      const { data: activities } = await query;
      targetIds = activities?.map((a: any) => a.id) || [];
    }

    if (targetIds.length === 0) {
      return json({ success: true, count: 0, updatedActivities: [] });
    }

    // Limit bulk operations to prevent accidents
    const MAX_BULK_SIZE = 500;
    if (targetIds.length > MAX_BULK_SIZE) {
      throw error(400, `Bulk operation limited to ${MAX_BULK_SIZE} activities. Found ${targetIds.length}.`);
    }

    let updatedActivities: any[] = [];

    switch (operation) {
      case 'bulk_publish': {
        // Validate activities before publishing
        const { data: activities } = await supabase
          .from('activitats')
          .select('id, nom, municipi_id, tipologia_principal, confianca_global, nd_confianca')
          .in('id', targetIds);

        // Filter to only safe ones
        const safeIds = (activities || [])
          .filter(
            (a: any) =>
              a.municipi_id &&
              a.tipologia_principal &&
              ((a.confianca_global && a.confianca_global >= confiancaThreshold) ||
                (a.nd_confianca && a.nd_confianca >= ndConfiancaThreshold))
          )
          .map((a: any) => a.id);

        if (safeIds.length === 0) {
          return json({
            success: true,
            count: 0,
            updatedActivities: [],
            message: 'No activities met the safety criteria for publishing'
          });
        }

        // Update in transaction
        const { data, error: updateError } = await supabase
          .from('activitats')
          .update({
            estat: 'publicada',
            updated_at: new Date().toISOString()
          })
          .in('id', safeIds)
          .select('id, nom');

        if (updateError) {
          console.error('Error bulk publishing:', updateError);
          throw error(500, 'Failed to bulk publish');
        }

        updatedActivities = data || [];

        // Create audit log
        await createAuditLog(user.id, user.email || '', 'bulk_publish', {
          count: updatedActivities.length,
          confiancaThreshold,
          ndConfiancaThreshold
        });

        break;
      }

      case 'bulk_mark_reviewed': {
        // Mark as reviewed and remove from queue
        const { data, error: updateError } = await supabase
          .from('activitats')
          .update({
            needs_review: false,
            updated_at: new Date().toISOString()
          })
          .in('id', targetIds)
          .select('id, nom');

        if (updateError) {
          console.error('Error bulk marking reviewed:', updateError);
          throw error(500, 'Failed to bulk mark as reviewed');
        }

        // Mark queue entries as resolved
        await supabase
          .from('cua_revisio')
          .update({
            resolt_at: new Date().toISOString(),
            resolt_per: user.id,
            resolucio: 'aprovat'
          })
          .in('activitat_id', targetIds)
          .is('resolt_at', null);

        updatedActivities = data || [];

        // Create audit log
        await createAuditLog(user.id, user.email || '', 'bulk_mark_reviewed', {
          count: updatedActivities.length
        });

        break;
      }

      case 'bulk_queue_remove': {
        // Mark queue entries as resolved (skip)
        await supabase
          .from('cua_revisio')
          .update({
            resolt_at: new Date().toISOString(),
            resolt_per: user.id,
            resolucio: 'saltat'
          })
          .in('activitat_id', targetIds)
          .is('resolt_at', null);

        // Unmark needs_review
        const { data, error: updateError } = await supabase
          .from('activitats')
          .update({
            needs_review: false,
            updated_at: new Date().toISOString()
          })
          .in('id', targetIds)
          .select('id, nom');

        if (updateError) {
          console.error('Error bulk removing from queue:', updateError);
          throw error(500, 'Failed to bulk remove from queue');
        }

        updatedActivities = data || [];

        // Create audit log
        await createAuditLog(user.id, user.email || '', 'bulk_queue_remove', {
          count: updatedActivities.length
        });

        break;
      }

      case 'bulk_unpublish': {
        const { data, error: updateError } = await supabase
          .from('activitats')
          .update({
            estat: 'pendent',
            updated_at: new Date().toISOString()
          })
          .in('id', targetIds)
          .select('id, nom');

        if (updateError) {
          console.error('Error bulk unpublishing:', updateError);
          throw error(500, 'Failed to bulk unpublish');
        }

        updatedActivities = data || [];

        // Create audit log
        await createAuditLog(user.id, user.email || '', 'bulk_unpublish', {
          count: updatedActivities.length
        });

        break;
      }

      default:
        throw error(400, `Unknown operation: ${operation}`);
    }

    return json({
      success: true,
      count: updatedActivities.length,
      updatedActivities
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Error in bulk operation:', err);
    throw error(500, 'Internal server error');
  }
};
