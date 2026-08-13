export interface GeoPoint {
  latitude: number
  longitude: number
  accuracy: number | null
}

export function getCurrentPosition(timeout = 7000): Promise<GeoPoint | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null)

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        }),
      () => resolve(null),
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout,
      },
    )
  })
}
