import Combine
import CoreLocation
import Foundation

@MainActor
final class AppModel: ObservableObject {
    @Published private(set) var isConfigured: Bool
    @Published private(set) var isAuthenticated = false
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?
    @Published var profile: Profile?
    @Published var waterBodies: [WaterBody] = []
    @Published var species: [Species] = []
    @Published var lures: [Lure] = []
    @Published var trips: [FishingTrip] = []
    @Published var events: [FishingEvent] = []
    @Published var catches: [CatchRecord] = []
    @Published var spots: [FishingSpot] = []
    @Published var waterwayTypes: [WaterwayType] = []

    private let gateway: SupabaseGateway?
    private let location = LocationService()
    private var photoURLCache: [String: URL] = [:]

    var activeTrip: FishingTrip? { trips.first { $0.status == .active } }

    init(bundle: Bundle = .main) {
        if let configuration = SupabaseConfiguration.load(bundle: bundle) {
            gateway = SupabaseGateway(configuration: configuration)
            isConfigured = true
        } else {
            gateway = nil
            isConfigured = false
        }
    }

    func bootstrap() async {
        guard let gateway else { return }
        isAuthenticated = await gateway.hasSession()
        if isAuthenticated { await refreshAll() }
    }

    func signIn(email: String, password: String) async -> Bool {
        await perform {
            guard let gateway else { throw AppError.notConfigured }
            try await gateway.signIn(email: email, password: password)
            isAuthenticated = true
            await refreshAll()
        }
    }

    func signUp(email: String, password: String) async -> Bool {
        await perform {
            guard let gateway else { throw AppError.notConfigured }
            try await gateway.signUp(email: email, password: password)
            isAuthenticated = await gateway.hasSession()
            if isAuthenticated { await refreshAll() }
        }
    }

    func handleAuthCallback(_ url: URL) async {
        guard let gateway else { return }
        do {
            try await gateway.handleAuthCallback(url)
            isAuthenticated = true
            await refreshAll()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        guard let gateway else { return }
        do { try await gateway.signOut() } catch { errorMessage = error.localizedDescription }
        isAuthenticated = false
        profile = nil
        waterBodies = []
        species = []
        lures = []
        trips = []
        events = []
        catches = []
        spots = []
        waterwayTypes = []
    }

    func refreshAll() async {
        guard let gateway, isAuthenticated else { return }
        isLoading = true
        errorMessage = nil
        do {
            async let profileResult = gateway.fetchProfile()
            async let waterResult = gateway.fetchWaterBodies()
            async let speciesResult = gateway.fetchSpecies()
            async let lureResult = gateway.fetchLures()
            async let tripResult = gateway.fetchTrips()
            async let eventResult = gateway.fetchEvents()
            async let catchResult = gateway.fetchCatches()
            async let spotResult = gateway.fetchSpots()
            async let typeResult = gateway.fetchWaterwayTypes()
            let values = try await (
                profileResult, waterResult, speciesResult, lureResult, tripResult,
                eventResult, catchResult, spotResult, typeResult
            )
            profile = values.0
            waterBodies = values.1
            species = Self.visibleSpecies(values.2)
            lures = values.3
            trips = values.4
            events = values.5
            catches = values.6
            spots = values.7
            waterwayTypes = values.8
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func createWaterBody(name: String, type: String) async -> Bool {
        let coordinate = await location.currentCoordinate()
        return await mutate {
            try await gatewayRequired.createWaterBody(
                name: name, type: type,
                latitude: coordinate?.latitude, longitude: coordinate?.longitude
            )
        }
    }

    func createWaterwayType(name: String) async -> Bool {
        await mutate { try await gatewayRequired.createWaterwayType(name: name) }
    }

    func saveLure(
        existing: Lure?, name: String, manufacturer: String, category: String,
        colour: String, notes: String, imageData: Data?, favourite: Bool
    ) async -> Bool {
        await mutate {
            var photoPath = existing?.photoPath
            if let imageData { photoPath = try await gatewayRequired.uploadPhoto(imageData) }
            try await gatewayRequired.saveLure(
                existing: existing, name: name, manufacturer: manufacturer,
                category: category, colour: colour, notes: notes,
                photoPath: photoPath, favourite: favourite
            )
        }
    }

    func deactivateLure(_ lure: Lure) async -> Bool {
        await mutate { try await gatewayRequired.deactivateLure(lure.id) }
    }

    func createSpecies(commonName: String, scientificName: String, imageData: Data?) async -> Bool {
        await mutate {
            var path: String?
            if let imageData { path = try await gatewayRequired.uploadPhoto(imageData) }
            try await gatewayRequired.createSpecies(
                commonName: commonName, scientificName: scientificName, photoPath: path
            )
        }
    }

    func startTrip(waterBodyID: UUID, speciesID: UUID?, lureID: UUID?) async -> Bool {
        let coordinate = await location.currentCoordinate()
        return await mutate {
            try await gatewayRequired.startTrip(
                waterBodyID: waterBodyID, targetSpeciesID: speciesID, lureID: lureID,
                latitude: coordinate?.latitude, longitude: coordinate?.longitude
            )
        }
    }

    func record(_ type: FishingEventType, casts: Int? = nil) async -> Bool {
        guard let trip = activeTrip else { return false }
        let coordinate = await location.currentCoordinate()
        return await mutate {
            try await gatewayRequired.recordEvent(
                tripID: trip.id, type: type, lureID: trip.currentLureID,
                castQuantity: casts, latitude: coordinate?.latitude, longitude: coordinate?.longitude
            )
        }
    }

    func changeLure(to lureID: UUID) async -> Bool {
        guard let trip = activeTrip else { return false }
        let coordinate = await location.currentCoordinate()
        return await mutate {
            try await gatewayRequired.changeLure(
                tripID: trip.id, lureID: lureID,
                latitude: coordinate?.latitude, longitude: coordinate?.longitude
            )
        }
    }

    func createCatch(
        speciesID: UUID, lengthCM: Double?, weightKG: Double?,
        disposition: FishDisposition?, notes: String, imageData: Data?
    ) async -> Bool {
        guard let trip = activeTrip else { return false }
        let coordinate = await location.currentCoordinate()
        return await mutate {
            var photoPath: String?
            if let imageData { photoPath = try await gatewayRequired.uploadPhoto(imageData) }
            try await gatewayRequired.createCatch(
                trip: trip, speciesID: speciesID, lengthCM: lengthCM,
                weightKG: weightKG, disposition: disposition, notes: notes,
                photoPath: photoPath, latitude: coordinate?.latitude,
                longitude: coordinate?.longitude
            )
        }
    }

    func markSpot(name: String, structureType: String) async -> Bool {
        guard let trip = activeTrip, let coordinate = await location.currentCoordinate() else {
            errorMessage = "A current location is required to mark a fishing spot."
            return false
        }
        return await mutate {
            try await gatewayRequired.markSpot(
                trip: trip, name: name, structureType: structureType,
                latitude: coordinate.latitude, longitude: coordinate.longitude
            )
        }
    }

    func endTrip(notes: String) async -> Bool {
        guard let trip = activeTrip else { return false }
        return await mutate { try await gatewayRequired.endTrip(trip, notes: notes) }
    }

    func deleteTrip(_ trip: FishingTrip) async -> Bool {
        await mutate { try await gatewayRequired.deleteTrip(trip.id) }
    }

    func updateUnits(_ units: PreferredUnits) async -> Bool {
        await mutate { try await gatewayRequired.updatePreferredUnits(units) }
    }

    func signedPhotoURL(for path: String?) async -> URL? {
        guard let path else { return nil }
        if let cached = photoURLCache[path] { return cached }
        guard let url = try? await gatewayRequired.signedPhotoURL(path: path) else { return nil }
        photoURLCache[path] = url
        return url
    }

    func events(for trip: FishingTrip) -> [FishingEvent] { events.filter { $0.tripID == trip.id } }
    func catches(for trip: FishingTrip) -> [CatchRecord] { catches.filter { $0.tripID == trip.id } }

    private var gatewayRequired: SupabaseGateway {
        get throws {
            guard let gateway else { throw AppError.notConfigured }
            return gateway
        }
    }

    private func mutate(_ work: () async throws -> Void) async -> Bool {
        do {
            try await work()
            await refreshAll()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func perform(_ work: () async throws -> Void) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            try await work()
            isLoading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    private static func visibleSpecies(_ rows: [Species]) -> [Species] {
        let overridden = Set(rows.compactMap { $0.userID == nil ? nil : $0.sourceSpeciesID })
        return rows
            .filter(\.isActive)
            .filter { $0.userID != nil || !overridden.contains($0.id) }
            .sorted { ($0.sortOrder, $0.commonName) < ($1.sortOrder, $1.commonName) }
    }
}

enum AppError: LocalizedError {
    case notConfigured

    var errorDescription: String? {
        "Add your Supabase publishable key to SupabaseConfig.plist before running the app."
    }
}
