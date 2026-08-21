import SwiftUI

struct TripDetailView: View {
    @EnvironmentObject private var app: AppModel
    let trip: FishingTrip

    private var tripEvents: [FishingEvent] { app.events(for: trip) }
    private var tripCatches: [CatchRecord] { app.catches(for: trip) }
    private var stats: ActiveTripStats { AnalyticsEngine.activeStats(events: tripEvents, catches: tripCatches) }

    var body: some View {
        List {
            Section {
                LabeledContent("Water", value: trip.waterBody?.name ?? "Unknown")
                LabeledContent("Started", value: trip.startedAt.formatted(date: .abbreviated, time: .shortened))
                if let ended = trip.endedAt {
                    LabeledContent("Ended", value: ended.formatted(date: .abbreviated, time: .shortened))
                }
                LabeledContent("Status", value: trip.status.rawValue.capitalized)
            }
            Section("Activity") {
                LabeledContent("Casts", value: "\(stats.casts)")
                LabeledContent("Bites", value: "\(stats.bites)")
                LabeledContent("Catches", value: "\(stats.catches)")
                LabeledContent(
                    "Landed conversion",
                    value: AnalyticsEngine.landingConversion(bites: stats.bites, catches: stats.catches)
                        .map { $0.formatted(.number.precision(.fractionLength(1))) + "%" } ?? "—"
                )
            }
            Section("Catches") {
                if tripCatches.isEmpty { Text("No catches recorded.").foregroundStyle(.secondary) }
                ForEach(tripCatches) { catchRecord in
                    NavigationLink { CatchDetailView(catchRecord: catchRecord) } label: {
                        VStack(alignment: .leading) {
                            Text(catchRecord.species?.commonName ?? "Catch").font(.headline)
                            Text(catchRecord.caughtAt.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            if let notes = trip.tripNotes, !notes.isEmpty {
                Section("Notes") { Text(notes) }
            }
        }
        .navigationTitle(trip.waterBody?.name ?? "Trip")
        .navigationBarTitleDisplayMode(.inline)
    }
}
