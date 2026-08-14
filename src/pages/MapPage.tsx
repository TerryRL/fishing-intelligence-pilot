import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { useAppData } from '../contexts/AppDataContext'
import { fetchSpots } from '../services/dataService'
import type { FishingSpot } from '../types/domain'

export default function MapPage() {
  const navigate = useNavigate()
  const { catches } = useAppData()
  const [spots, setSpots] = useState<FishingSpot[]>([])
  const [year, setYear] = useState('all')
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    void fetchSpots().then(setSpots).catch(() => setSpots([]))
  }, [])

  const years = useMemo(() => {
    const values = new Set<number>()
    catches.forEach((row) => values.add(new Date(row.caught_at).getFullYear()))
    spots.forEach((row) => values.add(new Date(row.created_at).getFullYear()))
    return Array.from(values).sort((a, b) => b - a)
  }, [catches, spots])

  const points = useMemo(() => {
    const selectedYear = year === 'all' ? null : Number(year)
    const catchPoints = catches
      .filter((row) => row.latitude !== null && row.longitude !== null)
      .filter((row) => selectedYear === null || new Date(row.caught_at).getFullYear() === selectedYear)
      .map((row) => ({
        kind: 'catch' as const,
        id: row.id,
        latitude: row.latitude as number,
        longitude: row.longitude as number,
        label: `${row.species?.common_name ?? 'Fish'} · ${new Date(row.caught_at).getFullYear()}${row.lure?.product_name ? ` · ${row.lure.product_name}` : ''}`,
      }))

    const spotPoints = spots
      .filter((row) => selectedYear === null || new Date(row.created_at).getFullYear() === selectedYear)
      .map((row) => ({
        kind: 'spot' as const,
        id: row.id,
        latitude: row.latitude,
        longitude: row.longitude,
        label: `${row.name || row.structure_type || 'Fishing spot'} · ${new Date(row.created_at).getFullYear()}`,
      }))
    return [...catchPoints, ...spotPoints]
  }, [catches, spots, year])

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, { zoomControl: true }).setView([44.2, -79.4], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer)
    })

    const bounds: L.LatLngTuple[] = []
    points.forEach((point) => {
      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `<span class="${point.kind}">${point.kind === 'catch' ? '◆' : '⌖'}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
      const marker = L.marker([point.latitude, point.longitude], { icon }).addTo(map)
      if (point.kind === 'catch') {
        marker.bindTooltip(`${point.label} · Tap for details`, { direction: 'top' })
        marker.on('click', () => navigate(`/catches/${point.id}`))
      } else {
        marker.bindPopup(point.label)
      }
      bounds.push([point.latitude, point.longitude])
    })

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] })
    else if (bounds.length === 1) map.setView(bounds[0], 13)
  }, [points, navigate])

  return (
    <div className="page map-page">
      <header className="page-header"><div><p className="eyebrow">PRIVATE BY DEFAULT</p><h1>Fishing Map</h1></div></header>

      <section className="form-card" style={{ marginTop: 0, marginBottom: 14 }}>
        <label>Activity period
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">All activity / all years</option>
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <small style={{ color: '#91a9ba' }}>
          {year === 'all' ? 'Showing your complete mapped history.' : `Showing catches and spots recorded in ${year}.`}
        </small>
      </section>

      <div className="map-legend">
        <span><i className="legend-catch">◆</i> Catches — tap for details</span>
        <span><i className="legend-spot">⌖</i> Spots</span>
      </div>
      <div className="map-canvas" ref={mapEl} />
      {points.length === 0 && <div className="empty-card"><strong>No mapped activity for this period.</strong><p>Choose another year or All Activity.</p></div>}
      <p className="insight-note">Tap any catch marker to see its lake, date, time, lure, size, location, notes and submitted photo.</p>
    </div>
  )
}
