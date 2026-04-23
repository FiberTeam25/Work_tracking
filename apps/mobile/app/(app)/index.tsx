import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useSyncStore } from '@/lib/sync-store'
import { StatusBadge } from '@/components/StatusBadge'
import { OfflineBanner } from '@/components/OfflineBanner'
import { SyncStatus } from '@/components/SyncStatus'

interface LocalTask {
  id: string
  clientId: string
  descriptionAr: string
  taskType: string
  routeLengthM?: number
  quantity?: number
  status: string
  taskDate: string
  teamName: string
  isSynced: boolean
}

export default function TodayTasksScreen() {
  const router = useRouter()
  const { tasks, refresh, isSyncing, pendingCount } = useSyncStore()
  const [refreshing, setRefreshing] = useState(false)

  const today = new Date().toISOString().split('T')[0]!
  const todayTasks = tasks.filter((t) => t.taskDate === today)

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>تاسكات اليوم</Text>
          <Text style={styles.headerSub}>{today} · {todayTasks.length} تاسك</Text>
        </View>
        <SyncStatus pending={pendingCount} syncing={isSyncing} />
      </View>

      {/* Task list */}
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.clientId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff7a1a" />}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✎</Text>
            <Text style={styles.emptyText}>لا توجد تاسكات اليوم</Text>
            <Text style={styles.emptySubtext}>اضغط + لإضافة تاسك جديد</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => router.push(`/(app)/task/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.taskRow}>
              <Text style={styles.taskDesc} numberOfLines={1}>{item.descriptionAr}</Text>
              <StatusBadge status={item.status} synced={item.isSynced} />
            </View>
            <View style={styles.taskMeta}>
              <Text style={styles.taskMetaText}>{item.teamName}</Text>
              <Text style={styles.taskQty}>
                {item.taskType === 'route'
                  ? `${item.routeLengthM} م`
                  : `${item.quantity} PCS`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB — new task */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/task/new')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e14' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
    backgroundColor: '#11161d',
  },
  headerTitle: { color: '#e8edf3', fontSize: 18, fontWeight: '600' },
  headerSub: { color: '#6b7788', fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 32, marginBottom: 8, opacity: 0.5, color: '#6b7788' },
  emptyText: { color: '#6b7788', fontSize: 14, fontWeight: '500' },
  emptySubtext: { color: '#6b7788', fontSize: 12, marginTop: 4 },
  taskCard: {
    backgroundColor: '#11161d',
    borderWidth: 1,
    borderColor: '#2a3442',
    padding: 12,
    gap: 6,
  },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskDesc: { color: '#e8edf3', fontSize: 13, fontWeight: '500', flex: 1, marginEnd: 8, textAlign: 'right' },
  taskMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  taskMetaText: { color: '#6b7788', fontSize: 11 },
  taskQty: { color: '#a8b4c4', fontSize: 11, fontFamily: 'monospace' },
  fab: {
    position: 'absolute',
    bottom: 24,
    end: 24,
    width: 56,
    height: 56,
    backgroundColor: '#ff7a1a',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#ff7a1a',
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '700', lineHeight: 32 },
})
