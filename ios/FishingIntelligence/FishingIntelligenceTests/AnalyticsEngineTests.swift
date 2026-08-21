import XCTest
@testable import FishingIntelligence

final class AnalyticsEngineTests: XCTestCase {
    func testFishPerHour() {
        XCTAssertEqual(AnalyticsEngine.fishPerHour(fish: 5, minutes: 120), 2.5)
        XCTAssertEqual(AnalyticsEngine.fishPerHour(fish: 5, minutes: 0), 0)
    }

    func testPerHundredCastsIsSafe() {
        XCTAssertEqual(AnalyticsEngine.per100(count: 4, casts: 80), 5)
        XCTAssertNil(AnalyticsEngine.per100(count: 4, casts: 0))
    }

    func testBitesPlusCatchesAndLandingConversion() {
        XCTAssertEqual(AnalyticsEngine.interactionCount(bites: 3, catches: 3), 6)
        XCTAssertEqual(AnalyticsEngine.interactionCount(bites: 2, catches: 2), 4)
        XCTAssertEqual(AnalyticsEngine.landingConversion(bites: 3, catches: 3), 50)
        XCTAssertNil(AnalyticsEngine.landingConversion(bites: 0, catches: 0))
    }

    func testRankingFiltersOutEventsFromExcludedTrips() {
        let includedTrip = UUID()
        let excludedTrip = UUID()
        let lure = fixtureLure()
        let events = [
            fixtureEvent(tripID: includedTrip, lureID: lure.id, type: .castsRecorded, casts: 20),
            fixtureEvent(tripID: includedTrip, lureID: lure.id, type: .bite),
            fixtureEvent(tripID: excludedTrip, lureID: lure.id, type: .bite)
        ]
        let catches = [
            fixtureCatch(tripID: includedTrip, lureID: lure.id),
            fixtureCatch(tripID: excludedTrip, lureID: lure.id)
        ]

        let row = AnalyticsEngine.lureRanking(
            events: events,
            catches: catches,
            lures: [lure],
            allowedTripIDs: [includedTrip]
        )[0]

        XCTAssertEqual(row.casts, 20)
        XCTAssertEqual(row.bites, 1)
        XCTAssertEqual(row.catches, 1)
        XCTAssertEqual(row.activity, 2)
        XCTAssertEqual(row.bitePercent, 5)
        XCTAssertEqual(row.catchPercent, 5)
        XCTAssertEqual(row.activityPercent, 10)
    }

    private func fixtureLure() -> Lure {
        let now = Date()
        return Lure(
            id: UUID(), userID: UUID(), manufacturer: nil, productName: "Test Lure",
            category: "Jig", model: nil, sizeValue: nil, sizeUnit: nil,
            weightValue: nil, weightUnit: nil, primaryColour: "Green",
            secondaryColour: nil, pattern: nil, notes: nil, quantityOwned: 1,
            storageLocation: nil, photoPath: nil, isFavourite: false, isActive: true,
            createdAt: now, updatedAt: now
        )
    }

    private func fixtureEvent(
        tripID: UUID, lureID: UUID, type: FishingEventType, casts: Int? = nil
    ) -> FishingEvent {
        let now = Date()
        return FishingEvent(
            id: UUID(), userID: UUID(), tripID: tripID, eventType: type,
            eventTime: now, latitude: nil, longitude: nil, lureID: lureID,
            fishingSpotID: nil, castQuantity: casts, metadata: [:], createdAt: now
        )
    }

    private func fixtureCatch(tripID: UUID, lureID: UUID) -> CatchRecord {
        let now = Date()
        return CatchRecord(
            id: UUID(), userID: UUID(), tripID: tripID, eventID: nil,
            speciesID: UUID(), lureID: lureID, fishingSpotID: nil, caughtAt: now,
            latitude: nil, longitude: nil, lengthCM: nil, weightKG: nil,
            disposition: .released, lureSnapshot: [:], photoPath: nil, notes: nil,
            createdAt: now, updatedAt: now, species: nil, lure: nil, trip: nil
        )
    }
}
