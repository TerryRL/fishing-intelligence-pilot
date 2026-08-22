import Foundation
import SwiftData

@Model
final class LocalDatabaseRecord {
    @Attribute(.unique) var key: String
    var payload: Data
    var updatedAt: Date

    init(key: String = "primary", payload: Data, updatedAt: Date = Date()) {
        self.key = key
        self.payload = payload
        self.updatedAt = updatedAt
    }
}

struct LocalDatabase: Codable, Sendable {
    static let currentSchemaVersion = 1

    var schemaVersion: Int
    var profile: Profile
    var waterBodies: [WaterBody]
    var species: [Species]
    var lures: [Lure]
    var trips: [FishingTrip]
    var events: [FishingEvent]
    var catches: [CatchRecord]
    var spots: [FishingSpot]
    var waterwayTypes: [WaterwayType]

    static func starter() -> LocalDatabase {
        let now = Date()
        let ownerID = UUID()
        let commonSpecies = [
            "Largemouth Bass", "Smallmouth Bass", "Walleye", "Northern Pike",
            "Muskellunge", "Lake Trout", "Rainbow Trout", "Brook Trout",
            "Yellow Perch", "Black Crappie", "Bluegill", "Channel Catfish"
        ]
        let types = ["Lake", "River", "Pond", "Reservoir", "Stream"]

        return LocalDatabase(
            schemaVersion: currentSchemaVersion,
            profile: Profile(
                id: ownerID,
                displayName: nil,
                preferredUnits: .metric,
                createdAt: now,
                updatedAt: now
            ),
            waterBodies: [],
            species: commonSpecies.enumerated().map { index, name in
                Species(
                    id: UUID(),
                    userID: ownerID,
                    sourceSpeciesID: nil,
                    commonName: name,
                    scientificName: nil,
                    photoPath: nil,
                    isActive: true,
                    sortOrder: index
                )
            },
            lures: [],
            trips: [],
            events: [],
            catches: [],
            spots: [],
            waterwayTypes: types.map {
                WaterwayType(id: UUID(), userID: ownerID, name: $0, createdAt: now)
            }
        )
    }
}

private struct LocalBackup: Codable {
    static let formatName = "FishingIntelligenceBackup"

    let format: String
    let backupVersion: Int
    let createdAt: Date
    let database: LocalDatabase
    let photos: [String: Data]
}

@MainActor
final class LocalStore {
    private let context: ModelContext
    private let fileManager: FileManager
    private let photosDirectory: URL

    init(
        container: ModelContainer,
        fileManager: FileManager = .default,
        filesDirectory: URL? = nil
    ) {
        context = ModelContext(container)
        self.fileManager = fileManager

        let baseDirectory = filesDirectory ?? fileManager.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first!.appendingPathComponent("FishingIntelligence", isDirectory: true)
        photosDirectory = baseDirectory.appendingPathComponent("Photos", isDirectory: true)
    }

    func load() throws -> LocalDatabase {
        let records = try context.fetch(FetchDescriptor<LocalDatabaseRecord>())
        if let record = records.first(where: { $0.key == "primary" }) {
            let database = try decoder.decode(LocalDatabase.self, from: record.payload)
            guard database.schemaVersion <= LocalDatabase.currentSchemaVersion else {
                throw LocalStoreError.newerDatabase
            }
            return database
        }

        let database = LocalDatabase.starter()
        try save(database)
        return database
    }

    func save(_ database: LocalDatabase) throws {
        let data = try encoder.encode(database)
        let records = try context.fetch(FetchDescriptor<LocalDatabaseRecord>())
        if let record = records.first(where: { $0.key == "primary" }) {
            record.payload = data
            record.updatedAt = Date()
        } else {
            context.insert(LocalDatabaseRecord(payload: data))
        }
        try context.save()
    }

    func savePhoto(_ data: Data) throws -> String {
        try fileManager.createDirectory(
            at: photosDirectory,
            withIntermediateDirectories: true
        )
        let filename = "\(UUID().uuidString.lowercased()).jpg"
        try data.write(to: photosDirectory.appendingPathComponent(filename), options: .atomic)
        return filename
    }

    func photoURL(for path: String?) -> URL? {
        guard let safePath = safePhotoPath(path) else { return nil }
        let url = photosDirectory.appendingPathComponent(safePath)
        return fileManager.fileExists(atPath: url.path) ? url : nil
    }

    func deletePhoto(at path: String?) {
        guard let url = photoURL(for: path) else { return }
        try? fileManager.removeItem(at: url)
    }

    func makeBackup(database: LocalDatabase) throws -> Data {
        let referencedPaths = Set(
            database.lures.compactMap(\.photoPath)
                + database.species.compactMap(\.photoPath)
                + database.catches.compactMap(\.photoPath)
        )
        var photos: [String: Data] = [:]
        for path in referencedPaths {
            guard let url = photoURL(for: path) else { continue }
            photos[path] = try Data(contentsOf: url)
        }

        return try backupEncoder.encode(LocalBackup(
            format: LocalBackup.formatName,
            backupVersion: 1,
            createdAt: Date(),
            database: database,
            photos: photos
        ))
    }

    func restoreBackup(from data: Data) throws -> LocalDatabase {
        let backup = try decoder.decode(LocalBackup.self, from: data)
        guard backup.format == LocalBackup.formatName else {
            throw LocalStoreError.invalidBackup
        }
        guard backup.database.schemaVersion <= LocalDatabase.currentSchemaVersion else {
            throw LocalStoreError.newerDatabase
        }

        try fileManager.createDirectory(
            at: photosDirectory,
            withIntermediateDirectories: true
        )
        for (path, photoData) in backup.photos {
            guard let safePath = safePhotoPath(path) else { continue }
            try photoData.write(
                to: photosDirectory.appendingPathComponent(safePath),
                options: .atomic
            )
        }
        try save(backup.database)
        return backup.database
    }

    private func safePhotoPath(_ path: String?) -> String? {
        guard let path, !path.isEmpty else { return nil }
        let filename = URL(fileURLWithPath: path).lastPathComponent
        return filename == path ? filename : nil
    }

    private var encoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        return encoder
    }

    private var backupEncoder: JSONEncoder {
        let backupEncoder = self.encoder
        backupEncoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return backupEncoder
    }

    private var decoder: JSONDecoder { JSONDecoder() }
}

enum LocalStoreError: LocalizedError {
    case invalidBackup
    case newerDatabase

    var errorDescription: String? {
        switch self {
        case .invalidBackup:
            "That file is not a Fishing Intelligence backup."
        case .newerDatabase:
            "This data was created by a newer version of Fishing Intelligence."
        }
    }
}
