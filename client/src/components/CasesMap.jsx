import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { STATUS, CENTER } from '../utils/constants'

const pin = (color, big) => L.divIcon({
  className: '', html: `<span class="pin" style="background:${color}"></span>`,
  iconSize: big ? [28, 28] : [18, 18], iconAnchor: big ? [14, 14] : [9, 9],
})
const icons = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, pin(v.color)]))
const iconsBig = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, pin(v.color, true)]))
const pickIcon = pin('#183b36', true)

function Resize() { // keeps the map correct when the sidebar expands/collapses
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}
function Picker({ onPick }) { useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) }); return null }
function Fly({ pos }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, Math.max(map.getZoom(), 16), { duration: 0.6 }) }, [pos, map])
  return null
}

export default function CasesMap({ cases = [], selectedId, onSelect, onPick, picked, flyTo }) {
  return (
    <MapContainer center={CENTER} zoom={13} scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Resize />
      <Fly pos={flyTo} />
      {onPick && <Picker onPick={onPick} />}
      {cases.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]}
          icon={(c.id === selectedId ? iconsBig : icons)[c.status]}
          eventHandlers={{ click: () => onSelect?.(c.id) }} />
      ))}
      {picked && <Marker position={picked} icon={pickIcon} />}
    </MapContainer>
  )
}
