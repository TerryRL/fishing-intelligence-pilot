import Foundation

struct ActiveTripStats: Equatable, Sendable {
    let casts: Int
    let bites: Int
    let hooked: Int
    let lost: Int
    let catches: Int
}

struct LureRankingRow: Identifiable, Equatable, Sendable {
    let lureID: UUID
    let lureName: String
    let casts: Int
    let bites: Int
    let catches: Int
    let activity: Int
    let bitePercent: Double
    let catchPercent: Double
    let activityPercent: Double

    var id: UUID { lureID }
}

enum AnalyticsEngine {
    static func fishPerHour(fish: Int, minutes: Double) -> Double {
        guard minutes > 0 else { return 0 }
        return rounded(Double(fish) / (minutes / 60), places: 2)
    }

    static func per100(count: Int, casts: Int) -> Double? {
        guard casts > 0 else { return nil }
        return rounded((Double(count) / Double(casts)) * 100, places: 2)
    }

    static func interactionCount(bites: Int, catches: Int) -> Int {
        bites + catches
    }

    static func landingConversion(bites: Int, catches: Int) -> Double? {
        let outcomes = interactionCount(bites: bites, catches: catches)
        guard outcomes > 0 else { return nil }
        return rounded((Double(catches) / Double(outcomes)) * 100, places: 1)
    }

    static func activeStats(events: [FishingEvent], catches: [CatchRecord]) -> ActiveTripStats {
        ActiveTripStats(
            casts: events.filter { $0.eventType == .castsRecorded }.reduce(0) { $0 + ($1.castQuantity ?? 0) },
            bites: events.filter { $0.eventType == .bite }.count,
            hooked: events.filter { $0.eventType == .hooked }.count,
            lost: events.filter { $0.eventType == .fishLost }.count,
            catches: catches.count
        )
    }

    static func lureRanking(
        events: [FishingEvent],
        catches: [CatchRecord],
        lures: [Lure],
        allowedTripIDs: Set<UUID>? = nil
    ) -> [LureRankingRow] {
        let filteredEvents = events.filter { allowedTripIDs?.contains($0.tripID) ?? true }
        let filteredCatches = catches.filter { allowedTripIDs?.contains($0.tripID) ?? true }

        return lures.map { lure in
            let lureEvents = filteredEvents.filter { $0.lureID == lure.id }
            let casts = lureEvents.filter { $0.eventType == .castsRecorded }
                .reduce(0) { $0 + ($1.castQuantity ?? 0) }
            let bites = lureEvents.filter { $0.eventType == .bite }.count
            let landed = filteredCatches.filter { $0.lureID == lure.id }.count
            let activity = interactionCount(bites: bites, catches: landed)

            return LureRankingRow(
                lureID: lure.id,
                lureName: lure.productName,
                casts: casts,
                bites: bites,
                catches: landed,
                activity: activity,
                bitePercent: casts > 0 ? Double(bites) / Double(casts) * 100 : 0,
                catchPercent: casts > 0 ? Double(landed) / Double(casts) * 100 : 0,
                activityPercent: casts > 0 ? Double(activity) / Double(casts) * 100 : 0
            )
        }
    }

    private static func rounded(_ value: Double, places: Int) -> Double {
        let factor = pow(10, Double(places))
        return (value * factor).rounded() / factor
    }
}
