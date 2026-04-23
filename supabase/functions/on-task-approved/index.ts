import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface TaskApprovedPayload {
  type: 'UPDATE'
  table: 'tasks'
  record: {
    id: string
    status: string
    technician_id: string
    team_id: string
    line_total: number
    task_type: string
  }
  old_record: {
    status: string
  }
}

serve(async (req) => {
  try {
    const payload: TaskApprovedPayload = await req.json()

    // Only handle pending → approved transition
    if (payload.old_record.status !== 'pending' || payload.record.status !== 'approved') {
      return new Response('ignored', { status: 200 })
    }

    const { record } = payload

    // 1. Send push notification to technician
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', record.technician_id)
      .single()

    if (profile) {
      // Push notification via Expo Notifications (stored in profiles.push_token)
      const { data: pushToken } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', record.technician_id)
        .single() as { data: { push_token?: string } | null }

      if (pushToken?.push_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: pushToken.push_token,
            title: 'تم اعتماد المهمة ✓',
            body: `تم اعتماد مهمتك بقيمة ${record.line_total.toLocaleString('ar-EG')} ج.م`,
            data: { taskId: record.id },
          }),
        })
      }
    }

    // 2. Refresh materialized views (fire and forget)
    supabase.rpc('refresh_all_materialized_views').then(() => {
      console.log('Materialized views refreshed')
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('on-task-approved error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
