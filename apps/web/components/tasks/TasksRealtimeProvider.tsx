'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

interface Props {
  /** Only listen for task changes on this project to avoid cross-project noise */
  projectId?: string
}

/**
 * Invisible component that subscribes to Supabase Realtime for task INSERT/UPDATE events
 * and triggers a server-side data refresh via router.refresh().
 *
 * Why router.refresh() instead of local state: the tasks list is rendered by a Server
 * Component. Calling router.refresh() re-runs the server fetch so the full table
 * (including newly approved/rejected rows) is re-rendered without a full page reload.
 */
export function TasksRealtimeProvider({ projectId }: Props) {
  const router = useRouter()
  // Debounce rapid consecutive events (e.g. bulk approvals) into a single refresh
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()

    const filter = projectId
      ? `project_id=eq.${projectId}`
      : undefined

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks', filter },
        () => scheduleRefresh()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks', filter },
        () => scheduleRefresh()
      )
      .subscribe()

    function scheduleRefresh() {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        router.refresh()
      }, 300)
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [router, projectId])

  return (
    <div
      className="flex items-center gap-1.5 text-xs select-none"
      style={{ color: 'var(--success)' }}
      title="تحديث مباشر مفعّل"
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: 'var(--success)', animation: 'pulse 2s ease-in-out infinite' }}
      />
      مباشر
    </div>
  )
}
