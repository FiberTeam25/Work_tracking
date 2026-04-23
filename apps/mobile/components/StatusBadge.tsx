import { View, Text, StyleSheet } from 'react-native'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#a8b4c4', bg: 'rgba(58,71,88,.5)' },
  pending: { label: 'بانتظار', color: '#fdb022', bg: 'rgba(253,176,34,.1)' },
  approved: { label: 'معتمد', color: '#32d583', bg: 'rgba(50,213,131,.1)' },
  rejected: { label: 'مرفوض', color: '#f04438', bg: 'rgba(240,68,56,.1)' },
  invoiced: { label: 'مُفوتر', color: '#00d4ff', bg: 'rgba(0,212,255,.1)' },
  pending_sync: { label: 'غير مرفوع', color: '#fdb022', bg: 'rgba(253,176,34,.1)' },
}

export function StatusBadge({ status, synced }: { status: string; synced: boolean }) {
  const displayStatus = !synced ? 'pending_sync' : status
  const cfg = STATUS_MAP[displayStatus] ?? STATUS_MAP['draft']!

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
})
