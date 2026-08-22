import Foundation

enum TripStatus: String, Codable, CaseIterable, Sendable {
    case active
    case completed
    case cancelled
}

enum FishingEventType: String, Codable, CaseIterable, Sendable {
    case tripStarted = "trip_started"
    case setupSelected = "setup_selected"
    case castsRecorded = "casts_recorded"
    case bite
    case hooked
    case fishLost = "fish_lost"
    case fishCaught = "fish_caught"
    case spotMarked = "spot_marked"
    case tripEnded = "trip_ended"
}

enum FishDisposition: String, Codable, CaseIterable, Identifiable, Sendable {
    case released
    case kept
    case unknown

    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

enum PreferredUnits: String, Codable, CaseIterable, Identifiable, Sendable {
    case metric
    case imperial

    var id: String { rawValue }
    var label: String { rawValue.capitalized }
}

enum JSONValue: Codable, Equatable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([String: JSONValue].self) { self = .object(value) }
        else { self = .array(try container.decode([JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

struct Profile: Codable, Identifiable, Sendable {
    let id: UUID
    var displayName: String?
    var preferredUnits: PreferredUnits
    let createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case preferredUnits = "preferred_units"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct WaterBody: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userID: UUID
    var name: String
    var waterType: String
    var provinceState: String?
    var country: String?
    var latitude: Double?
    var longitude: Double?
    var notes: String?
    let createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, country, latitude, longitude, notes
        case userID = "user_id"
        case waterType = "water_type"
        case provinceState = "province_state"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct Species: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userID: UUID?
    let sourceSpeciesID: UUID?
    var commonName: String
    var scientificName: String?
    var photoPath: String?
    var isActive: Bool
    var sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id
        case userID = "user_id"
        case sourceSpeciesID = "source_species_id"
        case commonName = "common_name"
        case scientificName = "scientific_name"
        case photoPath = "photo_path"
        case isActive = "is_active"
        case sortOrder = "sort_order"
    }
}

struct Lure: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userID: UUID
    var manufacturer: String?
    var productName: String
    var category: String
    var model: String?
    var sizeValue: Double?
    var sizeUnit: String?
    var weightValue: Double?
    var weightUnit: String?
    var primaryColour: String?
    var secondaryColour: String?
    var pattern: String?
    var notes: String?
    var quantityOwned: Int
    var storageLocation: String?
    var photoPath: String?
    var isFavourite: Bool
    var isActive: Bool
    let createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, manufacturer, category, model, pattern, notes
        case userID = "user_id"
        case productName = "product_name"
        case sizeValue = "size_value"
        case sizeUnit = "size_unit"
        case weightValue = "weight_value"
        case weightUnit = "weight_unit"
        case primaryColour = "primary_colour"
        case secondaryColour = "secondary_colour"
        case quantityOwned = "quantity_owned"
        case storageLocation = "storage_location"
        case photoPath = "photo_path"
        case isFavourite = "is_favourite"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct FishingTrip: Codable, Identifiable, Hashable, Sendable {
    let id: UUID
    let userID: UUID
    let waterBodyID: UUID
    var targetSpeciesID: UUID?
    let startedAt: Date
    var endedAt: Date?
    var startLatitude: Double?
    var startLongitude: Double?
    var currentLureID: UUID?
    var status: TripStatus
    var tripNotes: String?
    var weatherSummary: String?
    var airTemperatureC: Double?
    var windSpeedKMH: Double?
    var windDirection: String?
    var barometricPressureHPA: Double?
    var waterTemperatureC: Double?
    let createdAt: Date
    var updatedAt: Date
    var waterBody: WaterBody?
    var targetSpecies: Species?
    var currentLure: Lure?

    enum CodingKeys: String, CodingKey {
        case id, status
        case userID = "user_id"
        case waterBodyID = "water_body_id"
        case targetSpeciesID = "target_species_id"
        case startedAt = "started_at"
        case endedAt = "ended_at"
        case startLatitude = "start_latitude"
        case startLongitude = "start_longitude"
        case currentLureID = "current_lure_id"
        case tripNotes = "trip_notes"
        case weatherSummary = "weather_summary"
        case airTemperatureC = "air_temperature_c"
        case windSpeedKMH = "wind_speed_kmh"
        case windDirection = "wind_direction"
        case barometricPressureHPA = "barometric_pressure_hpa"
        case waterTemperatureC = "water_temperature_c"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case waterBody = "water_body"
        case targetSpecies = "target_species"
        case currentLure = "current_lure"
    }
}

struct FishingEvent: Codable, Identifiable, Sendable {
    let id: UUID
    let userID: UUID
    let tripID: UUID
    let eventType: FishingEventType
    let eventTime: Date
    let latitude: Double?
    let longitude: Double?
    let lureID: UUID?
    let fishingSpotID: UUID?
    let castQuantity: Int?
    let metadata: [String: JSONValue]
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, metadata
        case userID = "user_id"
        case tripID = "trip_id"
        case eventType = "event_type"
        case eventTime = "event_time"
        case lureID = "lure_id"
        case fishingSpotID = "fishing_spot_id"
        case castQuantity = "cast_quantity"
        case createdAt = "created_at"
    }
}

struct CatchRecord: Codable, Identifiable, Sendable {
    let id: UUID
    let userID: UUID
    let tripID: UUID
    let eventID: UUID?
    let speciesID: UUID
    let lureID: UUID?
    let fishingSpotID: UUID?
    let caughtAt: Date
    let latitude: Double?
    let longitude: Double?
    let lengthCM: Double?
    let weightKG: Double?
    let disposition: FishDisposition?
    let lureSnapshot: [String: JSONValue]
    let photoPath: String?
    let notes: String?
    let createdAt: Date
    let updatedAt: Date
    var species: Species?
    var lure: Lure?
    var trip: FishingTrip?

    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, disposition, notes, species, lure, trip
        case userID = "user_id"
        case tripID = "trip_id"
        case eventID = "event_id"
        case speciesID = "species_id"
        case lureID = "lure_id"
        case fishingSpotID = "fishing_spot_id"
        case caughtAt = "caught_at"
        case lengthCM = "length_cm"
        case weightKG = "weight_kg"
        case lureSnapshot = "lure_snapshot"
        case photoPath = "photo_path"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct FishingSpot: Codable, Identifiable, Sendable {
    let id: UUID
    let userID: UUID
    let waterBodyID: UUID
    let name: String?
    let description: String?
    let latitude: Double
    let longitude: Double
    let structureType: String?
    let notes: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, description, latitude, longitude, notes
        case userID = "user_id"
        case waterBodyID = "water_body_id"
        case structureType = "structure_type"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct WaterwayType: Codable, Identifiable, Sendable {
    let id: UUID
    let userID: UUID
    let name: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name
        case userID = "user_id"
        case createdAt = "created_at"
    }
}
