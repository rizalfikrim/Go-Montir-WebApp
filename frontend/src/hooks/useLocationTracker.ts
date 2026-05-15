import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'

interface TrackerOptions {
  accessToken: string | null
  isOnline: boolean
  orderId?: string
  enabled: boolean
}

export function useLocationTracker({ accessToken, isOnline, orderId, enabled }: TrackerOptions) {
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !accessToken || !isOnline || !navigator.geolocation) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      return
    }

    const socket = getSocket(accessToken)

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('Reporting location:', latitude, longitude, 'Order:', orderId)
        
        socket.emit('update_location', {
          lat: latitude,
          lon: longitude,
          orderId: orderId // if mechanic is currently handling an order
        })
      },
      (error) => {
        console.error('Location tracking error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [accessToken, isOnline, orderId, enabled])

  return null
}
