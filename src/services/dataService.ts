import { requireSupabase } from '../lib/supabase'
import { enqueueMutation, listQueuedMutations, removeQueuedMutation } from '../lib/offlineQueue'
import { getCurrentPosition } from '../lib/geolocation'
import type {
  CatchRecord,
  EventType,
  FishingEvent,
  FishingSpot,
  FishingTrip,
  Lure,
  Species,
  WaterBody,
} from '../types/domain'

async function userId(): Promise<string> {
  const db = requireSupabase()
  const { data, error } = await db.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('You must be signed in.')
  return data.user.id
}

export async function fetchWaterBodies(): Promise<WaterBody[]> {
  const db = requireSupabase()
  const { data, error } = await db.from('water_bodies').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WaterBody[]
}

export async function fetchSpecies(): Promise<Species[]> {
  const db = requireSupabase()
  const { data, error } = await db.from('species').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []) as Species[]
}

export async function fetchLures(): Promise<Lure[]> {
  const db = requireSupabase()
  const { data, error } = await db
    .from('lures')
    .select('*')
    .eq('is_active', true)
    .order('is_favourite', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Lure[]
}

export async function fetchTrips(): Promise<FishingTrip[]> {
  const db = requireSupabase()
  const { data, error } = await db
    .from('fishing_trips')
    .select(`
      *,
      water_body:water_bodies(*),
      target_species:species(*),
      current_lure:lures(*)
    `)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as FishingTrip[]
}

export async function fetchActiveTrip(): Promise<FishingTrip | null> {
  const db = requireSupabase()
  const { data, error } = await db
    .from('fishing_trips')
    .select(`
      *,
      water_body:water_bodies(*),
      target_species:species(*),
      current_lure:lures(*)
    `)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as unknown as FishingTrip | null
}

export async function fetchTrip(id: string): Promise<FishingTrip | null> {
  const db = requireSupabase()
  const { data, error } = await db
    .from('fishing_trips')
    .select(`
      *,
      water_body:water_bodies(*),
      target_species:species(*),
      current_lure:lures(*)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as unknown as FishingTrip | null
}

export async function fetchEvents(tripId?: string): Promise<FishingEvent[]> {
  const db = requireSupabase()
  let query = db.from('fishing_events').select('*').order('event_time')
  if (tripId) query = query.eq('trip_id', tripId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as FishingEvent[]
}

export async function fetchCatches(tripId?: string): Promise<CatchRecord[]> {
  const db = requireSupabase()
  let query = db
    .from('catches')
    .select(`
      *,
      species:species(*),
      lure:lures(*)
    `)
    .order('caught_at', { ascending: false })
  if (tripId) query = query.eq('trip_id', tripId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as CatchRecord[]
}

export async function fetchSpots(): Promise<FishingSpot[]> {
  const db = requireSupabase()
  const { data, error } = await db.from('fishing_spots').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as FishingSpot[]
}

export async function createWaterBody(input: {
  name: string
  water_type?: string
  latitude?: number | null
  longitude?: number | null
}): Promise<WaterBody> {
  const db = requireSupabase()
  const uid = await userId()
  const { data, error } = await db
    .from('water_bodies')
    .insert({
      user_id: uid,
      name: input.name.trim(),
      water_type: input.water_type ?? 'lake',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as WaterBody
}

export async function createLure(input: {
  product_name: string
  category: string
  manufacturer?: string
  primary_colour?: string
  secondary_colour?: string
  size_value?: number | null
  size_unit?: string | null
  weight_value?: number | null
  weight_unit?: string | null
  notes?: string
  is_favourite?: boolean
}): Promise<Lure> {
  const db = requireSupabase()
  const uid = await userId()
  const { data, error } = await db
    .from('lures')
    .insert({
      user_id: uid,
      product_name: input.product_name.trim(),
      category: input.category,
      manufacturer: input.manufacturer?.trim() || null,
      primary_colour: input.primary_colour || null,
      secondary_colour: input.secondary_colour || null,
      size_value: input.size_value ?? null,
      size_unit: input.size_unit ?? null,
      weight_value: input.weight_value ?? null,
      weight_unit: input.weight_unit ?? null,
      notes: input.notes?.trim() || null,
      is_favourite: input.is_favourite ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data as Lure
}

export async function toggleFavourite(lure: Lure): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.from('lures').update({ is_favourite: !lure.is_favourite }).eq('id', lure.id)
  if (error) throw error
}

export async function deactivateLure(lureId: string): Promise<void> {
  const db = requireSupabase()
  const { error } = await db.from('lures').update({ is_active: false }).eq('id', lureId)
  if (error) throw error
}

export async function startTrip(input: {
  waterBodyId: string
  targetSpeciesId?: string | null
  lureId?: string | null
}): Promise<FishingTrip> {
  const db = requireSupabase()
  const uid = await userId()
  const geo = await getCurrentPosition()
  const tripId = crypto.randomUUID()
  const startedAt = new Date().toISOString()

  const { data, error } = await db
    .from('fishing_trips')
    .insert({
      id: tripId,
      user_id: uid,
      water_body_id: input.waterBodyId,
      target_species_id: input.targetSpeciesId ?? null,
      current_lure_id: input.lureId ?? null,
      started_at: startedAt,
      start_latitude: geo?.latitude ?? null,
      start_longitude: geo?.longitude ?? null,
      status: 'active',
    })
    .select(`
      *,
      water_body:water_bodies(*),
      target_species:species(*),
      current_lure:lures(*)
    `)
    .single()

  if (error) throw error

  await recordEvent({
    tripId,
    type: 'trip_started',
    lureId: input.lureId ?? null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  })

  if (input.lureId) {
    await recordEvent({
      tripId,
      type: 'setup_selected',
      lureId: input.lureId,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
    })
  }

  return data as unknown as FishingTrip
}

export async function updateTripCurrentLure(tripId: string, lureId: string): Promise<void> {
  const db = requireSupabase()
  const payload = { current_lure_id: lureId, updated_at: new Date().toISOString() }
  try {
    const { error } = await db.from('fishing_trips').update(payload).eq('id', tripId)
    if (error) throw error
  } catch {
    await enqueueMutation({
      id: `trip:${tripId}:lure:${crypto.randomUUID()}`,
      kind: 'trip_update',
      payload: { id: tripId, ...payload },
      createdAt: new Date().toISOString(),
    })
  }

  const geo = await getCurrentPosition()
  await recordEvent({
    tripId,
    type: 'setup_selected',
    lureId,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  })
}

export async function recordEvent(input: {
  tripId: string
  type: EventType
  lureId?: string | null
  castQuantity?: number | null
  latitude?: number | null
  longitude?: number | null
  spotId?: string | null
  metadata?: Record<string, unknown>
}): Promise<FishingEvent> {
  const db = requireSupabase()
  const uid = await userId()
  const id = crypto.randomUUID()
  const payload = {
    id,
    user_id: uid,
    trip_id: input.tripId,
    event_type: input.type,
    event_time: new Date().toISOString(),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    lure_id: input.lureId ?? null,
    fishing_spot_id: input.spotId ?? null,
    cast_quantity: input.castQuantity ?? null,
    metadata: input.metadata ?? {},
  }

  try {
    const { data, error } = await db.from('fishing_events').insert(payload).select().single()
    if (error) throw error
    return data as FishingEvent
  } catch {
    await enqueueMutation({
      id,
      kind: 'fishing_event',
      payload,
      createdAt: payload.event_time,
    })
    return { ...payload, created_at: payload.event_time } as FishingEvent
  }
}

export async function recordQuickEvent(input: {
  trip: FishingTrip
  type: 'casts_recorded' | 'bite' | 'hooked' | 'fish_lost'
  castQuantity?: number
}): Promise<FishingEvent> {
  const geo = await getCurrentPosition(2500)
  return recordEvent({
    tripId: input.trip.id,
    type: input.type,
    lureId: input.trip.current_lure_id,
    castQuantity: input.castQuantity ?? null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  })
}

export async function createCatch(input: {
  trip: FishingTrip
  speciesId: string
  lengthCm?: number | null
  weightKg?: number | null
  disposition?: 'released' | 'kept' | 'unknown' | null
  notes?: string | null
  photoPath?: string | null
}): Promise<CatchRecord> {
  const db = requireSupabase()
  const uid = await userId()
  const geo = await getCurrentPosition(2500)
  const event = await recordEvent({
    tripId: input.trip.id,
    type: 'fish_caught',
    lureId: input.trip.current_lure_id,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  })

  let lureSnapshot: Record<string, unknown> = {}
  if (input.trip.current_lure_id) {
    const { data } = await db
      .from('lures')
      .select('product_name,manufacturer,category,primary_colour,secondary_colour,size_value,size_unit,weight_value,weight_unit')
      .eq('id', input.trip.current_lure_id)
      .maybeSingle()
    lureSnapshot = (data ?? {}) as Record<string, unknown>
  }

  const id = crypto.randomUUID()
  const caughtAt = event.event_time
  const payload = {
    id,
    user_id: uid,
    trip_id: input.trip.id,
    event_id: event.id,
    species_id: input.speciesId,
    lure_id: input.trip.current_lure_id,
    fishing_spot_id: null,
    caught_at: caughtAt,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    length_cm: input.lengthCm ?? null,
    weight_kg: input.weightKg ?? null,
    disposition: input.disposition ?? null,
    lure_snapshot: lureSnapshot,
    photo_path: input.photoPath ?? null,
    notes: input.notes?.trim() || null,
  }

  try {
    const { data, error } = await db
      .from('catches')
      .insert(payload)
      .select(`
        *,
        species:species(*),
        lure:lures(*)
      `)
      .single()
    if (error) throw error
    return data as unknown as CatchRecord
  } catch {
    await enqueueMutation({
      id,
      kind: 'catch',
      payload,
      createdAt: caughtAt,
    })
    return { ...payload, created_at: caughtAt, updated_at: caughtAt } as CatchRecord
  }
}

export async function markSpot(input: {
  trip: FishingTrip
  name?: string
  structureType?: string
}): Promise<FishingSpot | null> {
  const db = requireSupabase()
  const uid = await userId()
  const geo = await getCurrentPosition()
  if (!geo) return null

  const { data, error } = await db
    .from('fishing_spots')
    .insert({
      user_id: uid,
      water_body_id: input.trip.water_body_id,
      name: input.name?.trim() || null,
      latitude: geo.latitude,
      longitude: geo.longitude,
      structure_type: input.structureType || null,
    })
    .select()
    .single()
  if (error) throw error

  await recordEvent({
    tripId: input.trip.id,
    type: 'spot_marked',
    lureId: input.trip.current_lure_id,
    latitude: geo.latitude,
    longitude: geo.longitude,
    spotId: (data as FishingSpot).id,
  })

  return data as FishingSpot
}

export async function endTrip(trip: FishingTrip, notes?: string): Promise<void> {
  const db = requireSupabase()
  const endedAt = new Date().toISOString()
  const payload = {
    ended_at: endedAt,
    status: 'completed',
    trip_notes: notes?.trim() || trip.trip_notes || null,
    updated_at: endedAt,
  }

  try {
    const { error } = await db.from('fishing_trips').update(payload).eq('id', trip.id)
    if (error) throw error
  } catch {
    await enqueueMutation({
      id: `trip:${trip.id}:end`,
      kind: 'trip_update',
      payload: { id: trip.id, ...payload },
      createdAt: endedAt,
    })
  }

  await recordEvent({
    tripId: trip.id,
    type: 'trip_ended',
    lureId: trip.current_lure_id,
  })
}

export async function uploadCatchPhoto(file: File): Promise<string> {
  const db = requireSupabase()
  const uid = await userId()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${uid}/${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`
  const { error } = await db.storage.from('catch-photos').upload(path, file, {
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  return path
}

export async function signedPhotoUrl(path: string): Promise<string | null> {
  const db = requireSupabase()
  const { data, error } = await db.storage.from('catch-photos').createSignedUrl(path, 60 * 30)
  if (error) return null
  return data.signedUrl
}

export async function syncOfflineQueue(): Promise<{ synced: number; remaining: number }> {
  const db = requireSupabase()
  const queued = await listQueuedMutations()
  let synced = 0

  for (const item of queued) {
    try {
      if (item.kind === 'fishing_event') {
        const { error } = await db.from('fishing_events').upsert(item.payload, {
          onConflict: 'id',
          ignoreDuplicates: true,
        })
        if (error) throw error
      } else if (item.kind === 'catch') {
        const { error } = await db.from('catches').upsert(item.payload, {
          onConflict: 'id',
          ignoreDuplicates: true,
        })
        if (error) throw error
      } else if (item.kind === 'trip_update') {
        const { id, ...changes } = item.payload
        const { error } = await db.from('fishing_trips').update(changes).eq('id', id as string)
        if (error) throw error
      }
      await removeQueuedMutation(item.id)
      synced += 1
    } catch {
      // Leave the item in the queue and continue. It can be retried later.
    }
  }

  const remaining = (await listQueuedMutations()).length
  return { synced, remaining }
}
