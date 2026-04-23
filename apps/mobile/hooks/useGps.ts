import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

export function useGps() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('إذن الموقع مرفوض')
        setLoading(false)
        return
      }

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 2,
        },
        (loc) => {
          setLocation(loc)
          setAccuracy(loc.coords.accuracy)
          setLoading(false)
        }
      )
    }

    start()
    return () => { subscriber?.remove() }
  }, [])

  return { location, accuracy, loading, error }
}
