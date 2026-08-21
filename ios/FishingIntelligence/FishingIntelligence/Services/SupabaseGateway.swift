import Foundation
import Supabase

final class SupabaseGateway: @unchecked Sendable {
    private let client: SupabaseClient
    let callbackURL: URL

    init(configuration: SupabaseConfiguration) {
        client = SupabaseClient(
            supabaseURL: configuration.projectURL,
            supabaseKey: configuration.publishableKey,
            options: SupabaseClientOptions(
                auth: .init(flowType: .pkce)
            )
        )
        callbackURL = configuration.callbackURL
    }

    func hasSession() async -> Bool {
        (try? await client.auth.session) != nil
    }

    func currentUserID() async throws -> UUID {
        try await client.auth.session.user.id
    }

    func signIn(email: String, password: String) async throws {
        try await client.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String) async throws {
        try await client.auth.signUp(
            email: email,
            password: password,
            redirectTo: callbackURL
        )
    }

    func handleAuthCallback(_ url: URL) async throws {
        try await client.auth.session(from: url)
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func fetchProfile() async throws -> Profile? {
        let userID = try await currentUserID()
        let rows: [Profile] = try await client
            .from("profiles")
            .select()
            .eq("id", value: userID.uuidString)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    func updatePreferredUnits(_ units: PreferredUnits) async throws {
        struct Changes: Encodable { let preferred_units: PreferredUnits }
        let userID = try await currentUserID()
        try await client
            .from("profiles")
            .update(Changes(preferred_units: units))
            .eq("id", value: userID.uuidString)
            .execute()
    }

    func fetchWaterBodies() async throws -> [WaterBody] {
        try await client.from("water_bodies")
            .select()
            .order("updated_at", ascending: false)
            .execute().value
    }

    func fetchSpecies() async throws -> [Species] {
        try await client.from("species")
            .select()
            .order("sort_order", ascending: true)
            .execute().value
    }

    func fetchLures() async throws -> [Lure] {
        try await client.from("lures")
            .select()
            .eq("is_active", value: true)
            .order("is_favourite", ascending: false)
            .order("updated_at", ascending: false)
            .execute().value
    }

    func fetchTrips() async throws -> [FishingTrip] {
        try await client.from("fishing_trips")
            .select(
                """
                *,
                water_body:water_bodies(*),
                target_species:species(*),
                current_lure:lures(*)
                """
            )
            .order("started_at", ascending: false)
            .execute().value
    }

    func fetchEvents() async throws -> [FishingEvent] {
        try await client.from("fishing_events")
            .select()
            .order("event_time", ascending: true)
            .execute().value
    }

    func fetchCatches() async throws -> [CatchRecord] {
        try await client.from("catches")
            .select(
                """
                *,
                species:species(*),
                lure:lures(*),
                trip:fishing_trips(*,water_body:water_bodies(*))
                """
            )
            .order("caught_at", ascending: false)
            .execute().value
    }

    func fetchSpots() async throws -> [FishingSpot] {
        try await client.from("fishing_spots")
            .select()
            .order("created_at", ascending: false)
            .execute().value
    }

    func fetchWaterwayTypes() async throws -> [WaterwayType] {
        try await client.from("waterway_types")
            .select()
            .order("name", ascending: true)
            .execute().value
    }

    func createWaterBody(
        name: String,
        type: String,
        latitude: Double?,
        longitude: Double?
    ) async throws {
        let payload = NewWaterBody(
            userID: try await currentUserID(),
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            waterType: type,
            latitude: latitude,
            longitude: longitude
        )
        try await client.from("water_bodies").insert(payload).execute()
    }

    func createWaterwayType(name: String) async throws {
        let payload = NewWaterwayType(
            userID: try await currentUserID(),
            name: name.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        try await client.from("waterway_types").upsert(payload).execute()
    }

    func saveLure(
        existing: Lure?,
        name: String,
        manufacturer: String,
        category: String,
        colour: String,
        notes: String,
        photoPath: String?,
        favourite: Bool
    ) async throws {
        if let existing {
            let changes = LureChanges(
                manufacturer: manufacturer.nilIfBlank,
                productName: name.trimmingCharacters(in: .whitespacesAndNewlines),
                category: category.trimmingCharacters(in: .whitespacesAndNewlines),
                primaryColour: colour.nilIfBlank,
                notes: notes.nilIfBlank,
                photoPath: photoPath,
                isFavourite: favourite,
                isActive: true
            )
            try await client.from("lures")
                .update(changes)
                .eq("id", value: existing.id.uuidString)
                .execute()
        } else {
            let payload = NewLure(
                userID: try await currentUserID(),
                manufacturer: manufacturer.nilIfBlank,
                productName: name.trimmingCharacters(in: .whitespacesAndNewlines),
                category: category.trimmingCharacters(in: .whitespacesAndNewlines),
                primaryColour: colour.nilIfBlank,
                notes: notes.nilIfBlank,
                photoPath: photoPath,
                isFavourite: favourite
            )
            try await client.from("lures").insert(payload).execute()
        }
    }

    func deactivateLure(_ lureID: UUID) async throws {
        struct Changes: Encodable { let is_active: Bool }
        try await client.from("lures")
            .update(Changes(is_active: false))
            .eq("id", value: lureID.uuidString)
            .execute()
    }

    func createSpecies(
        commonName: String,
        scientificName: String,
        photoPath: String?
    ) async throws {
        let payload = NewSpecies(
            userID: try await currentUserID(),
            commonName: commonName.trimmingCharacters(in: .whitespacesAndNewlines),
            scientificName: scientificName.nilIfBlank,
            photoPath: photoPath,
            isActive: true,
            sortOrder: 500
        )
        try await client.from("species").insert(payload).execute()
    }

    func startTrip(
        waterBodyID: UUID,
        targetSpeciesID: UUID?,
        lureID: UUID?,
        latitude: Double?,
        longitude: Double?
    ) async throws {
        let id = UUID()
        let now = Date()
        let userID = try await currentUserID()
        let payload = NewTrip(
            id: id,
            userID: userID,
            waterBodyID: waterBodyID,
            targetSpeciesID: targetSpeciesID,
            startedAt: now,
            startLatitude: latitude,
            startLongitude: longitude,
            currentLureID: lureID,
            status: .active
        )
        try await client.from("fishing_trips").insert(payload).execute()
        try await insertEvent(
            id: UUID(), userID: userID, tripID: id, type: .tripStarted,
            lureID: lureID, castQuantity: nil, latitude: latitude, longitude: longitude,
            spotID: nil, time: now
        )
        if let lureID {
            try await insertEvent(
                id: UUID(), userID: userID, tripID: id, type: .setupSelected,
                lureID: lureID, castQuantity: nil, latitude: latitude, longitude: longitude,
                spotID: nil, time: now
            )
        }
    }

    func changeLure(tripID: UUID, lureID: UUID, latitude: Double?, longitude: Double?) async throws {
        struct Changes: Encodable {
            let current_lure_id: UUID
            let updated_at: Date
        }
        try await client.from("fishing_trips")
            .update(Changes(current_lure_id: lureID, updated_at: Date()))
            .eq("id", value: tripID.uuidString)
            .execute()
        try await recordEvent(
            tripID: tripID, type: .setupSelected, lureID: lureID,
            castQuantity: nil, latitude: latitude, longitude: longitude
        )
    }

    func recordEvent(
        tripID: UUID,
        type: FishingEventType,
        lureID: UUID?,
        castQuantity: Int?,
        latitude: Double?,
        longitude: Double?
    ) async throws {
        try await insertEvent(
            id: UUID(), userID: try await currentUserID(), tripID: tripID, type: type,
            lureID: lureID, castQuantity: castQuantity, latitude: latitude,
            longitude: longitude, spotID: nil, time: Date()
        )
    }

    func createCatch(
        trip: FishingTrip,
        speciesID: UUID,
        lengthCM: Double?,
        weightKG: Double?,
        disposition: FishDisposition?,
        notes: String,
        photoPath: String?,
        latitude: Double?,
        longitude: Double?
    ) async throws {
        let userID = try await currentUserID()
        let eventID = UUID()
        let catchID = UUID()
        let caughtAt = Date()
        try await insertEvent(
            id: eventID, userID: userID, tripID: trip.id, type: .fishCaught,
            lureID: trip.currentLureID, castQuantity: nil, latitude: latitude,
            longitude: longitude, spotID: nil, time: caughtAt
        )

        var snapshot: [String: JSONValue] = [:]
        if let lure = trip.currentLure {
            snapshot["product_name"] = .string(lure.productName)
            if let manufacturer = lure.manufacturer { snapshot["manufacturer"] = .string(manufacturer) }
            snapshot["category"] = .string(lure.category)
            if let colour = lure.primaryColour { snapshot["primary_colour"] = .string(colour) }
        }

        let payload = NewCatch(
            id: catchID,
            userID: userID,
            tripID: trip.id,
            eventID: eventID,
            speciesID: speciesID,
            lureID: trip.currentLureID,
            caughtAt: caughtAt,
            latitude: latitude,
            longitude: longitude,
            lengthCM: lengthCM,
            weightKG: weightKG,
            disposition: disposition,
            lureSnapshot: snapshot,
            photoPath: photoPath,
            notes: notes.nilIfBlank
        )
        try await client.from("catches").insert(payload).execute()
    }

    func markSpot(
        trip: FishingTrip,
        name: String,
        structureType: String,
        latitude: Double,
        longitude: Double
    ) async throws {
        let userID = try await currentUserID()
        let payload = NewSpot(
            userID: userID,
            waterBodyID: trip.waterBodyID,
            name: name.nilIfBlank,
            latitude: latitude,
            longitude: longitude,
            structureType: structureType.nilIfBlank
        )
        let spot: FishingSpot = try await client.from("fishing_spots")
            .insert(payload, returning: .representation)
            .single()
            .execute().value
        try await insertEvent(
            id: UUID(), userID: userID, tripID: trip.id, type: .spotMarked,
            lureID: trip.currentLureID, castQuantity: nil, latitude: latitude,
            longitude: longitude, spotID: spot.id, time: Date()
        )
    }

    func endTrip(_ trip: FishingTrip, notes: String) async throws {
        struct Changes: Encodable {
            let ended_at: Date
            let status: TripStatus
            let trip_notes: String?
            let updated_at: Date
        }
        let now = Date()
        try await client.from("fishing_trips")
            .update(Changes(ended_at: now, status: .completed, trip_notes: notes.nilIfBlank, updated_at: now))
            .eq("id", value: trip.id.uuidString)
            .execute()
        try await recordEvent(
            tripID: trip.id, type: .tripEnded, lureID: trip.currentLureID,
            castQuantity: nil, latitude: nil, longitude: nil
        )
    }

    func deleteTrip(_ tripID: UUID) async throws {
        let related: [CatchRecord] = try await client.from("catches")
            .select()
            .eq("trip_id", value: tripID.uuidString)
            .execute().value
        let paths = related.compactMap(\.photoPath)
        if !paths.isEmpty {
            try? await client.storage.from("catch-photos").remove(paths: paths)
        }
        try await client.from("fishing_trips")
            .delete()
            .eq("id", value: tripID.uuidString)
            .execute()
    }

    func uploadPhoto(_ data: Data, fileExtension: String = "jpg", contentType: String = "image/jpeg") async throws -> String {
        let userID = try await currentUserID()
        let year = Calendar.current.component(.year, from: Date())
        let path = "\(userID.uuidString.lowercased())/\(year)/\(UUID().uuidString.lowercased()).\(fileExtension)"
        try await client.storage.from("catch-photos").upload(
            path,
            data: data,
            options: FileOptions(contentType: contentType, upsert: false)
        )
        return path
    }

    func signedPhotoURL(path: String) async throws -> URL {
        try await client.storage.from("catch-photos")
            .createSignedURL(path: path, expiresIn: 1_800)
    }

    private func insertEvent(
        id: UUID,
        userID: UUID,
        tripID: UUID,
        type: FishingEventType,
        lureID: UUID?,
        castQuantity: Int?,
        latitude: Double?,
        longitude: Double?,
        spotID: UUID?,
        time: Date
    ) async throws {
        let payload = NewFishingEvent(
            id: id,
            userID: userID,
            tripID: tripID,
            eventType: type,
            eventTime: time,
            latitude: latitude,
            longitude: longitude,
            lureID: lureID,
            fishingSpotID: spotID,
            castQuantity: castQuantity,
            metadata: [:]
        )
        try await client.from("fishing_events").insert(payload).execute()
    }
}

private extension String {
    var nilIfBlank: String? {
        let clean = trimmingCharacters(in: .whitespacesAndNewlines)
        return clean.isEmpty ? nil : clean
    }
}
