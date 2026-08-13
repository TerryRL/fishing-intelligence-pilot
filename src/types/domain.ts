export type TripStatus = 'active' | 'completed' | 'cancelled'
export type EventType =
  | 'trip_started'
  | 'setup_selected'
  | 'casts_recorded'
  | 'bite'
  | 'hooked'
  | 'fish_lost'
  | 'fish_caught'
  | 'spot_marked'
  | 'trip_ended'

export interface Profile {
  id: string
  display_name: string | null
  preferred_units: 'metric' | 'imperial'
  created_at: string
  updated_at: string
}

export interface WaterBody {
  id: string
  user_id: string
  name: string
  water_type: string
  province_state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Species {
  id: string
  common_name: string
  scientific_name: string | null
  sort_order: number
}

export interface Lure {
  id: string
  user_id: string
  manufacturer: string | null
  product_name: string
  category: string
  model: string | null
  size_value: number | null
  size_unit: string | null
  weight_value: number | null
  weight_unit: string | null
  primary_colour: string | null
  secondary_colour: string | null
  pattern: string | null
  notes: string | null
  quantity_owned: number
  storage_location: string | null
  photo_path: string | null
  is_favourite: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FishingTrip {
  id: string
  user_id: string
  water_body_id: string
  target_species_id: string | null
  started_at: string
  ended_at: string | null
  start_latitude: number | null
  start_longitude: number | null
  current_lure_id: string | null
  status: TripStatus
  trip_notes: string | null
  weather_summary: string | null
  air_temperature_c: number | null
  wind_speed_kmh: number | null
  wind_direction: string | null
  barometric_pressure_hpa: number | null
  water_temperature_c: number | null
  created_at: string
  updated_at: string
  water_body?: WaterBody
  target_species?: Species | null
  current_lure?: Lure | null
}

export interface FishingEvent {
  id: string
  user_id: string
  trip_id: string
  event_type: EventType
  event_time: string
  latitude: number | null
  longitude: number | null
  lure_id: string | null
  fishing_spot_id: string | null
  cast_quantity: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface CatchRecord {
  id: string
  user_id: string
  trip_id: string
  event_id: string | null
  species_id: string
  lure_id: string | null
  fishing_spot_id: string | null
  caught_at: string
  latitude: number | null
  longitude: number | null
  length_cm: number | null
  weight_kg: number | null
  disposition: 'released' | 'kept' | 'unknown' | null
  lure_snapshot: Record<string, unknown>
  photo_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
  species?: Species
  lure?: Lure | null
  trip?: FishingTrip
}

export interface FishingSpot {
  id: string
  user_id: string
  water_body_id: string
  name: string | null
  description: string | null
  latitude: number
  longitude: number
  structure_type: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ActiveTripStats {
  casts: number
  bites: number
  hooked: number
  lost: number
  fish: number
}

export interface LurePerformance {
  lureId: string
  lureName: string
  colour: string
  minutesUsed: number
  casts: number
  bites: number
  fish: number
  fishPerHour: number
  bitesPerHour: number
  fishPer100Casts: number | null
  bitesPer100Casts: number | null
  trips: number
}

export interface Recommendation extends LurePerformance {
  score: number
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
}
