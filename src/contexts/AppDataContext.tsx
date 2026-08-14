import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useAuth } from './AuthContext'
import type {
  CatchRecord,
  FishingEvent,
  FishingTrip,
  Lure,
  Species,
  WaterBody,
} from '../types/domain'
import {
  fetchActiveTrip,
  fetchCatches,
  fetchEvents,
  fetchLures,
  fetchSpecies,
  fetchTrips,
  fetchWaterBodies,
} from '../services/dataService'

interface AppDataValue {
  loading: boolean
  error: string | null
  waterBodies: WaterBody[]
  species: Species[]
  lures: Lure[]
  trips: FishingTrip[]
  events: FishingEvent[]
  catches: CatchRecord[]
  activeTrip: FishingTrip | null
  refresh: () => Promise<void>
  refreshActive: () => Promise<void>
}

const AppDataContext = createContext<AppDataValue | null>(null)

function visibleSpecies(rows: Species[]): Species[] {
  const overriddenDefaults = new Set(
    rows.filter((row) => row.user_id && row.source_species_id).map((row) => row.source_species_id as string),
  )
  return rows
    .filter((row) => row.is_active !== false)
    .filter((row) => row.user_id || !overriddenDefaults.has(row.id))
    .sort((a, b) => a.sort_order - b.sort_order || a.common_name.localeCompare(b.common_name))
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waterBodies, setWaterBodies] = useState<WaterBody[]>([])
  const [species, setSpecies] = useState<Species[]>([])
  const [lures, setLures] = useState<Lure[]>([])
  const [trips, setTrips] = useState<FishingTrip[]>([])
  const [events, setEvents] = useState<FishingEvent[]>([])
  const [catches, setCatches] = useState<CatchRecord[]>([])
  const [activeTrip, setActiveTrip] = useState<FishingTrip | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [waterRows, speciesRows, lureRows, tripRows, eventRows, catchRows, active] =
        await Promise.all([
          fetchWaterBodies(),
          fetchSpecies(),
          fetchLures(),
          fetchTrips(),
          fetchEvents(),
          fetchCatches(),
          fetchActiveTrip(),
        ])
      setWaterBodies(waterRows)
      setSpecies(visibleSpecies(speciesRows))
      setLures(lureRows)
      setTrips(tripRows)
      setEvents(eventRows)
      setCatches(catchRows)
      setActiveTrip(active)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load fishing data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  const refreshActive = useCallback(async () => {
    if (!user) return
    try {
      const [active, eventRows, catchRows, lureRows, speciesRows] = await Promise.all([
        fetchActiveTrip(),
        fetchEvents(),
        fetchCatches(),
        fetchLures(),
        fetchSpecies(),
      ])
      setActiveTrip(active)
      setEvents(eventRows)
      setCatches(catchRows)
      setLures(lureRows)
      setSpecies(visibleSpecies(speciesRows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh active trip.')
    }
  }, [user])

  useEffect(() => {
    if (user) void refresh()
    else {
      setWaterBodies([])
      setSpecies([])
      setLures([])
      setTrips([])
      setEvents([])
      setCatches([])
      setActiveTrip(null)
    }
  }, [user, refresh])

  const value = useMemo(
    () => ({
      loading,
      error,
      waterBodies,
      species,
      lures,
      trips,
      events,
      catches,
      activeTrip,
      refresh,
      refreshActive,
    }),
    [
      loading,
      error,
      waterBodies,
      species,
      lures,
      trips,
      events,
      catches,
      activeTrip,
      refresh,
      refreshActive,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used inside AppDataProvider')
  return value
}
