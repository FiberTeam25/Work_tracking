import { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import type { LocationObject } from 'expo-location'

interface Props {
  location: LocationObject | null
  accuracy: number | null
  loading: boolean
}

export function GpsPill({ location, accuracy, loading }: Props) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    )
    if (location) anim.start()
    else anim.stop()
    return () => anim.stop()
  }, [location])

  const lat = location?.coords.latitude.toFixed(4)
  const lng = location?.coords.longitude.toFixed(4)
  const acc = accuracy ? `±${Math.round(accuracy)}م` : ''

  return (
    <View style={styles.pill}>
      <Animated.View style={[styles.dot, { opacity: pulse, backgroundColor: location ? '#32d583' : '#6b7788' }]} />
      <Text style={[styles.coords, { color: location ? '#32d583' : '#6b7788' }]}>
        {loading
          ? 'جاري تحديد الموقع...'
          : location
          ? `${lat}°N · ${lng}°E`
          : 'GPS غير متاح'}
      </Text>
      {acc ? <Text style={styles.accuracy}>{acc}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a2028',
    borderWidth: 1,
    borderColor: '#2a3442',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  coords: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'right',
  },
  accuracy: {
    color: '#6b7788',
    fontFamily: 'monospace',
    fontSize: 11,
  },
})
