import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable))
    })
    return unsubscribe
  }, [])

  if (!isOffline) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>وضع عدم الاتصال · التاسكات محفوظة محلياً</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#242c38',
    borderBottomWidth: 1,
    borderBottomColor: '#fdb022',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  icon: { fontSize: 14, color: '#fdb022' },
  text: { color: '#fdb022', fontSize: 12, fontWeight: '500' },
})
