import SwiftData
import XCTest
@testable import FishingIntelligence

@MainActor
final class LocalStoreTests: XCTestCase {
    func testLocalDatabasePersistsWithoutACloudService() throws {
        let directory = temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }

        let store = try makeStore(filesDirectory: directory)
        var database = try store.load()
        let waterBodyID = UUID()
        let now = Date()
        database.waterBodies.append(WaterBody(
            id: waterBodyID,
            userID: database.profile.id,
            name: "Test Lake",
            waterType: "Lake",
            provinceState: nil,
            country: nil,
            latitude: 45,
            longitude: -79,
            notes: nil,
            createdAt: now,
            updatedAt: now
        ))

        try store.save(database)
        let reloaded = try store.load()

        XCTAssertEqual(reloaded.waterBodies.first?.id, waterBodyID)
        XCTAssertEqual(reloaded.waterBodies.first?.name, "Test Lake")
    }

    func testBackupRoundTripIncludesPhotos() throws {
        let sourceDirectory = temporaryDirectory()
        let restoredDirectory = temporaryDirectory()
        defer {
            try? FileManager.default.removeItem(at: sourceDirectory)
            try? FileManager.default.removeItem(at: restoredDirectory)
        }

        let sourceStore = try makeStore(filesDirectory: sourceDirectory)
        var database = try sourceStore.load()
        let photoData = Data([0x46, 0x49, 0x53, 0x48])
        let photoPath = try sourceStore.savePhoto(photoData)
        database.species[0].photoPath = photoPath
        try sourceStore.save(database)

        let backup = try sourceStore.makeBackup(database: database)
        let restoredStore = try makeStore(filesDirectory: restoredDirectory)
        let restored = try restoredStore.restoreBackup(from: backup)

        XCTAssertEqual(restored.species[0].photoPath, photoPath)
        let restoredURL = try XCTUnwrap(restoredStore.photoURL(for: photoPath))
        XCTAssertEqual(try Data(contentsOf: restoredURL), photoData)
    }

    private func makeStore(filesDirectory: URL) throws -> LocalStore {
        let configuration = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(
            for: LocalDatabaseRecord.self,
            configurations: configuration
        )
        return LocalStore(container: container, filesDirectory: filesDirectory)
    }

    private func temporaryDirectory() -> URL {
        FileManager.default.temporaryDirectory
            .appendingPathComponent("FishingIntelligenceTests-\(UUID().uuidString)", isDirectory: true)
    }
}
