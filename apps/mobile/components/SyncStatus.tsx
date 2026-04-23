import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'

interface Props {
  pending: number
  syncing: boolean
}

export function SyncStatus({ pending, syncing }: Props) {
  if (syncing) {
    return (
      <View style={styles.row}>
        <ActivityIndicator size="small" color="#ff7a1a" />
        <Text style={styles.syncingText}>جاري الرفع...</Text>
      </View>
    )
  }

  if (pending > 0) {
    return (
      <View style={[styles.badge, { backgroundColor: 'rgba(253,176,34,.15)', borderColor: 'rgba(253,176,34,.4)' }]}>
        <Text style={[styles.badgeText, { color: '#fdb022' }]}>{pending} معلّق</Text>
      </View>
    )
  }

  return (
    <View style={[styles.badge, { backgroundColor: 'rgba(50,213,131,.1)', borderColor: 'rgba(50,213,131,.3)' }]}>
      <Text style={[styles.badgeText, { color: '#32d583' }]}>✓ متزامن</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncingText: { color: '#ff7a1a', fontSize: 11 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
})
