import Foundation

struct NewWaterBody: Encodable {
    let userID: UUID
    let name: String
    let waterType: String
    let latitude: Double?
    let longitude: Double?

    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude
        case userID = "user_id"
        case waterType = "water_type"
    }
}

struct NewLure: Encodable {
    let userID: UUID
    let manufacturer: String?
    let productName: String
    let category: String
    let primaryColour: String?
    let notes: String?
    let photoPath: String?
    let isFavourite: Bool

    enum CodingKeys: String, CodingKey {
        case manufacturer, category, notes
        case userID = "user_id"
        case productName = "product_name"
        case primaryColour = "primary_colour"
        case photoPath = "photo_path"
        case isFavourite = "is_favourite"
    }
}

struct LureChanges: Encodable {
    let manufacturer: String?
    let productName: String
    let category: String
    let primaryColour: String?
    let notes: String?
    let photoPath: String?
    let isFavourite: Bool
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case manufacturer, category, notes
        case productName = "product_name"
        case primaryColour = "primary_colour"
        case photoPath = "photo_path"
        case isFavourite = "is_favourite"
        case isActive = "is_active"
    }
}

struct NewSpecies: Encodable {
    let userID: UUID
    let commonName: String
    let scientificName: String?
    let photoPath: String?
    let isActive: Bool
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case commonName = "common_name"
        case scientificName = "scientific_name"
        case photoPath = "photo_path"
        case isActive = "is_active"
        case sortOrder = "sort_order"
    }
}

struct NewTrip: Encodable {
    let id: UUID
    let userID: UUID
    let waterBodyID: UUID
    let targetSpeciesID: UUID?
    let startedAt: Date
    let startLatitude: Double?
    let startLongitude: Double?
    let currentLureID: UUID?
    let status: TripStatus

    enum CodingKeys: String, CodingKey {
        case id, status
        case userID = "user_id"
        case waterBodyID = "water_body_id"
        case targetSpeciesID = "target_species_id"
        case startedAt = "started_at"
        case startLatitude = "start_latitude"
        case startLongitude = "start_longitude"
        case currentLureID = "current_lure_id"
    }
}

struct NewFishingEvent: Encodable {
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

    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, metadata
        case userID = "user_id"
        case tripID = "trip_id"
        case eventType = "event_type"
        case eventTime = "event_time"
        case lureID = "lure_id"
        case fishingSpotID = "fishing_spot_id"
        case castQuantity = "cast_quantity"
    }
}

struct NewCatch: Encodable {
    let id: UUID
    let userID: UUID
    let tripID: UUID
    let eventID: UUID?
    let speciesID: UUID
    let lureID: UUID?
    let caughtAt: Date
    let latitude: Double?
    let longitude: Double?
    let lengthCM: Double?
    let weightKG: Double?
    let disposition: FishDisposition?
    let lureSnapshot: [String: JSONValue]
    let photoPath: String?
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, disposition, notes
        case userID = "user_id"
        case tripID = "trip_id"
        case eventID = "event_id"
        case speciesID = "species_id"
        case lureID = "lure_id"
        case caughtAt = "caught_at"
        case lengthCM = "length_cm"
        case weightKG = "weight_kg"
        case lureSnapshot = "lure_snapshot"
        case photoPath = "photo_path"
    }
}

struct NewSpot: Encodable {
    let userID: UUID
    let waterBodyID: UUID
    let name: String?
    let latitude: Double
    let longitude: Double
    let structureType: String?

    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude
        case userID = "user_id"
        case waterBodyID = "water_body_id"
        case structureType = "structure_type"
    }
}

struct NewWaterwayType: Encodable {
    let userID: UUID
    let name: String

    enum CodingKeys: String, CodingKey {
        case name
        case userID = "user_id"
    }
}
