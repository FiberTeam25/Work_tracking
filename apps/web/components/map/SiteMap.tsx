'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip } from 'react-leaflet'
import type { LatLngExpression, LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Cabinet {
  id: string
  code: string
  type: string
  status: string
  fiber_count: number | null
  lat: number
  lng: number
}

interface Box {
  id: string
  code: string
  type: string
  status: string
  cabinet_id: string
  lat: number
  lng: number
}

interface RouteFeature {
  id: string
  status: string
  length_m: number | null
  geojson: { type: 'LineString'; coordinates: [number, number][] } | null
}

interface MapData {
  cabinets: Cabinet[]
  boxes: Box[]
  routes: RouteFeature[]
}

const STATUS_COLOR: Record<string, string> = {
  completed: '#32d583',
  active:    '#00d4ff',
  planned:   '#6b7788',
  pending:   '#fdb022',
  approved:  '#32d583',
  rejected:  '#f04438',
}

const CABINET_TYPE_COLOR: Record<string, string> = {
  ODF: '#ff7a1a',
  FDT: '#00d4ff',
  FAT: '#a78bfa',
}

const LEGEND = [
  { color: '#ff7a1a', label: 'كابينة ODF', r: 12 },
  { color: '#00d4ff', label: 'كابينة FDT', r: 9 },
  { color: '#a78bfa', label: 'كابينة FAT', r: 9 },
  { color: '#32d583', label: 'مكتمل',       r: 5 },
  { color: '#fdb022', label: 'قيد التنفيذ', r: 5 },
  { color: '#6b7788', label: 'مخطط',        r: 5 },
]

const DEFAULT_CENTER: LatLngExpression = [30.0275, 31.4686]

function routePositions(geojson: RouteFeature['geojson']): LatLngTuple[] {
  if (!geojson?.coordinates?.length) return []
  return geojson.coordinates.map(([lng, lat]) => [lat, lng])
}

function cabinetColor(type: string): string {
  return CABINET_TYPE_COLOR[type] ?? '#6b7788'
}

function cabinetRadius(type: string): number {
  return type === 'ODF' ? 12 : 9
}

export default function SiteMap({ projectId }: { projectId: string }) {
  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/map/data?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-sm"
        style={{ background: 'var(--bg-0)', color: 'var(--ink-2)' }}
      >
        جاري تحميل الخريطة...
      </div>
    )
  }

  const cabinets = data?.cabinets ?? []
  const boxes    = data?.boxes    ?? []
  const routes   = data?.routes   ?? []
  const center: LatLngExpression =
    cabinets[0] ? [cabinets[0].lat, cabinets[0].lng] : DEFAULT_CENTER

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height: '100%', background: '#0a0e14' }}
        zoomControl
        attributionControl={false}
      >
        {/* CartoDB Dark Matter tiles — no API key needed */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Route polylines from approved/pending tasks */}
        {routes.map((r) => {
          const positions = routePositions(r.geojson)
          if (positions.length < 2) return null
          return (
            <Polyline
              key={r.id}
              positions={positions}
              pathOptions={{
                color:     STATUS_COLOR[r.status] ?? '#ff7a1a',
                weight:    2.5,
                opacity:   0.75,
                dashArray: r.status === 'approved' ? undefined : '8 4',
              }}
            >
              {r.length_m && (
                <Tooltip sticky>{r.length_m.toLocaleString('ar-EG')} م</Tooltip>
              )}
            </Polyline>
          )
        })}

        {/* Box markers — small circles colored by status */}
        {boxes.map((box) => (
          <CircleMarker
            key={box.id}
            center={[box.lat, box.lng]}
            radius={5}
            pathOptions={{
              fillColor:   STATUS_COLOR[box.status] ?? '#6b7788',
              fillOpacity: 0.9,
              color:       'rgba(255,255,255,0.25)',
              weight:      1,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  {box.code}
                </div>
                <div style={{ color: '#888' }}>النوع: {box.type}</div>
                <div style={{ color: '#888' }}>الحالة: {box.status}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Cabinet markers — larger circles with permanent label */}
        {cabinets.map((cab) => (
          <CircleMarker
            key={cab.id}
            center={[cab.lat, cab.lng]}
            radius={cabinetRadius(cab.type)}
            pathOptions={{
              fillColor:   cabinetColor(cab.type),
              fillOpacity: 0.9,
              color:       'rgba(255,255,255,0.4)',
              weight:      2,
            }}
          >
            <Tooltip direction="top" permanent offset={[0, -14]}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '10px' }}>
                {cab.code}
              </span>
            </Tooltip>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7, minWidth: '140px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                  {cab.code}
                </div>
                <div style={{ color: '#888' }}>النوع: <strong>{cab.type}</strong></div>
                <div style={{ color: '#888' }}>الحالة: {cab.status}</div>
                {cab.fiber_count != null && (
                  <div style={{ color: '#888' }}>الألياف: {cab.fiber_count}</div>
                )}
                <div style={{ color: '#888', marginTop: '4px', fontSize: '10px' }}>
                  {cab.lat.toFixed(6)}, {cab.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend — sits above Leaflet z-index 1000 */}
      <div
        className="absolute bottom-3 start-3 z-[1000] p-2.5 flex flex-col gap-1.5"
        style={{
          background: 'rgba(10,14,20,.92)',
          border: '1px solid var(--line)',
          pointerEvents: 'none',
        }}
      >
        {LEGEND.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--ink-1)' }}
          >
            <div
              style={{
                width:        `${item.r * 2}px`,
                height:       `${item.r * 2}px`,
                background:   item.color,
                borderRadius: '50%',
                flexShrink:   0,
                opacity:      0.9,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      {/* Empty state overlay */}
      {cabinets.length === 0 && boxes.length === 0 && !loading && (
        <div
          className="absolute inset-0 z-[999] flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(10,14,20,0.7)', pointerEvents: 'none' }}
        >
          <span style={{ fontSize: '2.5rem', color: 'var(--ink-2)' }}>◉</span>
          <span className="text-sm" style={{ color: 'var(--ink-1)' }}>
            لا توجد إحداثيات GPS مسجلة
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--ink-2)' }}>
            run: supabase db push (migration 00006)
          </span>
        </div>
      )}
    </div>
  )
}
