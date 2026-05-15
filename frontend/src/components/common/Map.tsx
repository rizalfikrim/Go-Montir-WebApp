import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

// Fix Leaflet Default Icon issue in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom Orange Icon for Mechanic
const mechanicIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom Blue/Red Icon for User
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface MapProps {
  center: [number, number]
  userPos?: [number, number]
  mechanicPos?: [number, number]
  zoom?: number
  className?: string
  markers?: Array<{ pos: [number, number]; label: string; type: 'user' | 'mechanic' }>
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

function MoveHandler({ onMove }: { onMove: (lat: number, lon: number) => void }) {
  const map = useMap()
  useEffect(() => {
    const handler = () => {
      const center = map.getCenter()
      onMove(center.lat, center.lng)
    }
    map.on('moveend', handler)
    return () => {
      map.off('moveend', handler)
    }
  }, [map, onMove])
  return null
}

export default function Map({ center, userPos, mechanicPos, zoom = 15, className = 'h-[300px] w-full', markers = [], onCenterChange }: MapProps & { onCenterChange?: (lat: number, lon: number) => void }) {
  return (
    <div className={`${className} rounded-2xl overflow-hidden border border-slate-700 shadow-2xl z-10`}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <ChangeView center={center} zoom={zoom} />
        {onCenterChange && <MoveHandler onMove={onCenterChange} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // Dark mode tiles
          // url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}

        {mechanicPos && (
          <Marker position={mechanicPos} icon={mechanicIcon}>
            <Popup>Montir Sedang Menuju Sini</Popup>
          </Marker>
        )}

        {markers.map((m, i) => (
          <Marker key={i} position={m.pos} icon={m.type === 'mechanic' ? mechanicIcon : userIcon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
