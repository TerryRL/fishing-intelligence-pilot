import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { useAppData } from '../contexts/AppDataContext'
import { fetchSpots } from '../services/dataService'
import type { FishingSpot } from '../types/domain'

export default function MapPage() {
  const { catches } = useAppData()
  const [spots, setSpots] = useState<FishingSpot[]>([])
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    void fetchSpots().then(setSpots).catch(() => setSpots([]))
  }, [])

  const points = useMemo(() => {
    const catchPoints = catches
      .filter((row) => row.latitude !== null && row.longitude !== null)
      .map((row) => ({
        kind: 'catch' as const,
        latitude: row.latitude as number,
        longitude: row.longitude as number,
        label: `${row.species?.common_name ?? 'Fish'}${row.lure?.product_name ? ` · ${row.lure.product_name}` : ''}`,
      }))
    const spotPoints = spots.map((row) => ({
      kind: 'spot' as const,
      latitude: row.latitude,
      longitude: row.longitude,
      label: row.name || row.structure_type || 'Fishing spot',
    }))
    return [...catchPoints, ...spotPoints]
  }, [catches, spots])

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const first = points[0]
    const map = L.map(mapEl.current, { zoomControl: true }).setView(
      first ? [first.latitude, first.longitude] : [44.2, -79.4],
      first ? 11 : 6,
    )
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
      L.marker([point.latitude, point.longitude], { icon }).addTo(map).bindPopup(point.label)
      bounds.push([point.latitude, point.longitude])
    })

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] })
    else if (bounds.length === 1) map.setView(bounds[0], 13)
  }, [points])

  return (
    <div className="page map-page">
      <header className="page-header"><div><p className="eyebrow">PRIVATE BY DEFAULT</p><h1>Fishing Map</h1></div></header>
      <div className="map-legend">
        <span><i className="legend-catch">◆</i> Catches</span>
        <span><i className="legend-spot">⌖</i> Spots</span>
      </div>
      <div className="map-canvas" ref={mapEl} />
      {points.length === 0 && <div className="empty-card"><strong>No mapped activity yet.</strong><p>Catch and spot coordinates will appear after you fish with location permission enabled.</p></div>}
      <p className="insight-note">Exact fishing coordinates are only loaded from your own Supabase records under Row Level Security.</p>
    </div>
  )
}
