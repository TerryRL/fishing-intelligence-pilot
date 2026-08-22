import Combine
import CoreLocation
import Foundation
import SwiftData

@MainActor
final class AppModel: ObservableObject {
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

    private let store: LocalStore
    private let location = LocationService()

    var activeTrip: FishingTrip? { trips.first { $0.status == .active } }
    var activeLures: [Lure] { lures.filter(\.isActive) }
    var activeSpecies: [Species] {
        species
            .filter(\.isActive)
            .sorted { ($0.sortOrder, $0.commonName) < ($1.sortOrder, $1.commonName) }
    }

    init(container: ModelContainer) {
        store = LocalStore(container: container)
    }

    func bootstrap() async {
        await refreshAll()
    }

    func refreshAll() async {
        isLoading = true
        errorMessage = nil
        do {
            apply(try store.load())
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func createWaterBody(name: String, type: String) async -> Bool {
        let coordinate = await location.currentCoordinate()
        return await mutate {
            let ownerID = try requiredProfile.id
            let now = Date()
            waterBodies.insert(WaterBody(
                id: UUID(),
                userID: ownerID,
                name: try cleanedRequired(name, field: "Waterway name"),
                waterType: try cleanedRequired(type, field: "Waterway type"),
                provinceState: nil,
                country: nil,
                latitude: coordinate?.latitude,
                longitude: coordinate?.longitude,
                notes: nil,
                createdAt: now,
                updatedAt: now
            ), at: 0)
        }
    }

    func createWaterwayType(name: String) async -> Bool {
        await mutate {
            let cleanName = try cleanedRequired(name, field: "Waterway type")
            guard !waterwayTypes.contains(where: { $0.name.caseInsensitiveCompare(cleanName) == .orderedSame }) else {
                return
            }
            waterwayTypes.append(WaterwayType(
                id: UUID(),
                userID: try requiredProfile.id,
                name: cleanName,
                createdAt: Date()
            ))
            waterwayTypes.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        }
    }

    func saveLure(
        existing: Lure?, name: String, manufacturer: String, category: String,
        colour: String, notes: String, imageData: Data?, favourite: Bool
    ) async -> Bool {
        await mutate {
            let cleanName = try cleanedRequired(name, field: "Lure name")
            let cleanCategory = try cleanedRequired(category, field: "Lure type")
            let now = Date()
            var photoPath = existing?.photoPath
            if let imageData { photoPath = try store.savePhoto(imageData) }

            if let existing, let index = lures.firstIndex(where: { $0.id == existing.id }) {
                lures[index].manufacturer = manufacturer.nilIfBlank
                lures[index].productName = cleanName
                lures[index].category = cleanCategory
                lures[index].primaryColour = colour.nilIfBlank
                lures[index].notes = notes.nilIfBlank
                lures[index].photoPath = photoPath
                lures[index].isFavourite = favourite
                lures[index].isActive = true
                lures[index].updatedAt = now
            } else {
                lures.append(Lure(
                    id: UUID(),
                    userID: try requiredProfile.id,
                    manufacturer: manufacturer.nilIfBlank,
                    productName: cleanName,
                    category: cleanCategory,
                    model: nil,
                    sizeValue: nil,
                    sizeUnit: nil,
                    weightValue: nil,
                    weightUnit: nil,
                    primaryColour: colour.nilIfBlank,
                    secondaryColour: nil,
                    pattern: nil,
                    notes: notes.nilIfBlank,
                    quantityOwned: 1,
                    storageLocation: nil,
                    photoPath: photoPath,
                    isFavourite: favourite,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now
                ))
            }
            sortLures()
        }
    }

    func deactivateLure(_ lure: Lure) async -> Bool {
        await mutate {
            guard let index = lures.firstIndex(where: { $0.id == lure.id }) else { return }
            lures[index].isActive = false
            lures[index].updatedAt = Date()
        }
    }

    func createSpecies(commonName: String, scientificName: String, imageData: Data?) async -> Bool {
        await mutate {
            let photoPath = try imageData.map(store.savePhoto)
            species.append(Species(
                id: UUID(),
                userID: try requiredProfile.id,
                sourceSpeciesID: nil,
                commonName: try cleanedRequired(commonName, field: "Species name"),
                scientificName: scientificName.nilIfBlank,
                photoPath: photoPath,
                isActive: true,
                sortOrder: (species.map(\.sortOrder).max() ?? 0) + 1
            ))
        }
    }

    func startTrip(waterBodyID: UUID, speciesID: UUID?, lureID: UUID?) async -> Bool {
        let coordinate = await location.currentCoordinate()
        return await mutate {
            guard activeTrip == nil else { throw AppError.tripAlreadyActive }
            guard waterBodies.contains(where: { $0.id == waterBodyID }) else {
                throw AppError.missingWaterway
            }

            let now = Date()
            let tripID = UUID()
            trips.insert(FishingTrip(
                id: tripID,
                userID: try requiredProfile.id,
                waterBodyID: waterBodyID,
                targetSpeciesID: speciesID,
                startedAt: now,
                endedAt: nil,
                startLatitude: coordinate?.latitude,
                startLongitude: coordinate?.longitude,
                currentLureID: lureID,
                status: .active,
                tripNotes: nil,
                weatherSummary: nil,
                airTemperatureC: nil,
                windSpeedKMH: nil,
                windDirection: nil,
                barometricPressureHPA: nil,
                waterTemperatureC: nil,
                createdAt: now,
                updatedAt: now,
                waterBody: nil,
                targetSpecies: nil,
                currentLure: nil
            ), at: 0)
            try appendEvent(
                tripID: tripID,
                type: .tripStarted,
                lureID: lureID,
                latitude: coordinate?.latitude,
                longitude: coordinate?.longitude,
                time: now
            )
            if let lureID {
                try appendEvent(
                    tripID: tripID,
                    type: .setupSelected,
                    lureID: lureID,
                    latitude: coordinate?.latitude,
                    longitude: coordinate?.longitude,
                    time: now
                )
            }
        }
    }

    func record(_ type: FishingEventType, casts: Int? = nil) async -> Bool {
        guard let trip = activeTrip else { return false }
        let coordinate = await location.currentCoordinate()
        return await mutate {
            try appendEvent(
                tripID: trip.id,
                type: type,
                lureID: trip.currentLureID,
                casts: casts,
                latitude: coordinate?.latitude,
                longitude: coordinate?.longitude
            )
        }
    }

    func changeLure(to lureID: UUID) async -> Bool {
        guard let trip = activeTrip else { return false }
        let coordinate = await location.currentCoordinate()
        return await mutate {
            guard let index = trips.firstIndex(where: { $0.id == trip.id }) else { return }
            trips[index].currentLureID = lureID
            trips[index].updatedAt = Date()
            try appendEvent(
                tripID: trip.id,
                type: .setupSelected,
                lureID: lureID,
                latitude: coordinate?.latitude,
                longitude: coordinate?.longitude
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
            guard species.contains(where: { $0.id == speciesID }) else {
                throw AppError.missingSpecies
            }

            let now = Date()
            let eventID = UUID()
            let photoPath = try imageData.map(store.savePhoto)
            let lure = lures.first(where: { $0.id == trip.currentLureID })
            var lureSnapshot: [String: JSONValue] = [:]
            if let lure {
                lureSnapshot["product_name"] = .string(lure.productName)
                lureSnapshot["category"] = .string(lure.category)
                if let manufacturer = lure.manufacturer {
                    lureSnapshot["manufacturer"] = .string(manufacturer)
                }
                if let colour = lure.primaryColour {
                    lureSnapshot["primary_colour"] = .string(colour)
                }
            }

            try appendEvent(
                id: eventID,
                tripID: trip.id,
                type: .fishCaught,
                lureID: trip.currentLureID,
                latitude: coordinate?.latitude,
                longitude: coordinate?.longitude,
                time: now
            )
            catches.insert(CatchRecord(
                id: UUID(),
                userID: try requiredProfile.id,
                tripID: trip.id,
                eventID: eventID,
                speciesID: speciesID,
                lureID: trip.currentLureID,
                fishingSpotID: nil,
                caughtAt: now,
                latitude: coordinate?.latitude,
                longitude: coordinate?.longitude,
                lengthCM: lengthCM,
                weightKG: weightKG,
                disposition: disposition,
                lureSnapshot: lureSnapshot,
                photoPath: photoPath,
                notes: notes.nilIfBlank,
                createdAt: now,
                updatedAt: now,
                species: nil,
                lure: nil,
                trip: nil
            ), at: 0)
        }
    }

    func markSpot(name: String, structureType: String) async -> Bool {
        guard let trip = activeTrip, let coordinate = await location.currentCoordinate() else {
            errorMessage = "A current location is required to mark a fishing spot."
            return false
        }
        return await mutate {
            let now = Date()
            let spotID = UUID()
            spots.insert(FishingSpot(
                id: spotID,
                userID: try requiredProfile.id,
                waterBodyID: trip.waterBodyID,
                name: name.nilIfBlank,
                description: nil,
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                structureType: structureType.nilIfBlank,
                notes: nil,
                createdAt: now,
                updatedAt: now
            ), at: 0)
            try appendEvent(
                tripID: trip.id,
                type: .spotMarked,
                lureID: trip.currentLureID,
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                spotID: spotID,
                time: now
            )
        }
    }

    func endTrip(notes: String) async -> Bool {
        guard let trip = activeTrip else { return false }
        return await mutate {
            guard let index = trips.firstIndex(where: { $0.id == trip.id }) else { return }
            let now = Date()
            trips[index].endedAt = now
            trips[index].status = .completed
            trips[index].tripNotes = notes.nilIfBlank
            trips[index].updatedAt = now
            try appendEvent(
                tripID: trip.id,
                type: .tripEnded,
                lureID: trip.currentLureID,
                latitude: nil,
                longitude: nil,
                time: now
            )
        }
    }

    func deleteTrip(_ trip: FishingTrip) async -> Bool {
        await mutate {
            catches
                .filter { $0.tripID == trip.id }
                .forEach { store.deletePhoto(at: $0.photoPath) }
            catches.removeAll { $0.tripID == trip.id }
            events.removeAll { $0.tripID == trip.id }
            trips.removeAll { $0.id == trip.id }
        }
    }

    func updateUnits(_ units: PreferredUnits) async -> Bool {
        await mutate {
            guard profile != nil else { throw AppError.localDataUnavailable }
            profile?.preferredUnits = units
            profile?.updatedAt = Date()
        }
    }

    func localPhotoURL(for path: String?) -> URL? {
        store.photoURL(for: path)
    }

    func makeBackupDocument() -> LocalBackupDocument? {
        do {
            hydrateRelationships()
            return LocalBackupDocument(data: try store.makeBackup(database: try databaseSnapshot()))
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func restoreBackup(from url: URL) async -> Bool {
        isLoading = true
        errorMessage = nil
        let hasSecurityAccess = url.startAccessingSecurityScopedResource()
        defer {
            if hasSecurityAccess { url.stopAccessingSecurityScopedResource() }
            isLoading = false
        }

        do {
            let data = try Data(contentsOf: url)
            apply(try store.restoreBackup(from: data))
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func events(for trip: FishingTrip) -> [FishingEvent] {
        events.filter { $0.tripID == trip.id }
    }

    func catches(for trip: FishingTrip) -> [CatchRecord] {
        catches.filter { $0.tripID == trip.id }
    }

    private var requiredProfile: Profile {
        get throws {
            guard let profile else { throw AppError.localDataUnavailable }
            return profile
        }
    }

    private func appendEvent(
        id: UUID = UUID(),
        tripID: UUID,
        type: FishingEventType,
        lureID: UUID?,
        casts: Int? = nil,
        latitude: Double?,
        longitude: Double?,
        spotID: UUID? = nil,
        time: Date = Date()
    ) throws {
        events.append(FishingEvent(
            id: id,
            userID: try requiredProfile.id,
            tripID: tripID,
            eventType: type,
            eventTime: time,
            latitude: latitude,
            longitude: longitude,
            lureID: lureID,
            fishingSpotID: spotID,
            castQuantity: casts,
            metadata: [:],
            createdAt: time
        ))
    }

    private func mutate(_ work: () throws -> Void) async -> Bool {
        errorMessage = nil
        do {
            try work()
            hydrateRelationships()
            try store.save(try databaseSnapshot())
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func apply(_ database: LocalDatabase) {
        profile = database.profile
        waterBodies = database.waterBodies
        species = database.species
        lures = database.lures
        trips = database.trips
        events = database.events
        catches = database.catches
        spots = database.spots
        waterwayTypes = database.waterwayTypes
        hydrateRelationships()
        sortLures()
    }

    private func databaseSnapshot() throws -> LocalDatabase {
        LocalDatabase(
            schemaVersion: LocalDatabase.currentSchemaVersion,
            profile: try requiredProfile,
            waterBodies: waterBodies,
            species: species,
            lures: lures,
            trips: trips,
            events: events,
            catches: catches,
            spots: spots,
            waterwayTypes: waterwayTypes
        )
    }

    private func hydrateRelationships() {
        let waterBodyByID = Dictionary(uniqueKeysWithValues: waterBodies.map { ($0.id, $0) })
        let speciesByID = Dictionary(uniqueKeysWithValues: species.map { ($0.id, $0) })
        let lureByID = Dictionary(uniqueKeysWithValues: lures.map { ($0.id, $0) })

        for index in trips.indices {
            trips[index].waterBody = waterBodyByID[trips[index].waterBodyID]
            trips[index].targetSpecies = trips[index].targetSpeciesID.flatMap { speciesByID[$0] }
            trips[index].currentLure = trips[index].currentLureID.flatMap { lureByID[$0] }
        }

        let tripByID = Dictionary(uniqueKeysWithValues: trips.map { ($0.id, $0) })
        for index in catches.indices {
            catches[index].species = speciesByID[catches[index].speciesID]
            catches[index].lure = catches[index].lureID.flatMap { lureByID[$0] }
            catches[index].trip = tripByID[catches[index].tripID]
        }
    }

    private func sortLures() {
        lures.sort {
            if $0.isFavourite != $1.isFavourite { return $0.isFavourite }
            return $0.updatedAt > $1.updatedAt
        }
    }

    private func cleanedRequired(_ value: String, field: String) throws -> String {
        let clean = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else { throw AppError.requiredField(field) }
        return clean
    }
}

enum AppError: LocalizedError {
    case localDataUnavailable
    case missingSpecies
    case missingWaterway
    case requiredField(String)
    case tripAlreadyActive

    var errorDescription: String? {
        switch self {
        case .localDataUnavailable:
            "The on-device fishing database is not available. Please restart the app."
        case .missingSpecies:
            "Choose a fish species before saving the catch."
        case .missingWaterway:
            "Choose a lake or waterway before starting the trip."
        case .requiredField(let field):
            "\(field) is required."
        case .tripAlreadyActive:
            "End the current trip before starting another one."
        }
    }
}

private extension String {
    var nilIfBlank: String? {
        let clean = trimmingCharacters(in: .whitespacesAndNewlines)
        return clean.isEmpty ? nil : clean
    }
}
