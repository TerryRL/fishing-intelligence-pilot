import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var app: AppModel

    private var completedTrips: [FishingTrip] { app.trips.filter { $0.status == .completed } }
    private var completedTripIDs: Set<UUID> { Set(completedTrips.map(\.id)) }
    private var completedCatches: [CatchRecord] { app.catches.filter { completedTripIDs.contains($0.tripID) } }
    private var completedMinutes: Double {
        completedTrips.reduce(0) { total, trip in
            guard let endedAt = trip.endedAt else { return total }
            return total + max(0, endedAt.timeIntervalSince(trip.startedAt) / 60)
        }
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 18) {
                if let active = app.activeTrip {
                    NavigationLink { ActiveFishingView() } label: {
                        HStack {
                            Image(systemName: "dot.radiowaves.left.and.right")
                            VStack(alignment: .leading) {
                                Text("Fishing now").font(.headline)
                                Text(active.waterBody?.name ?? "Active trip").font(.subheadline)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                        }
                        .padding()
                        .foregroundStyle(.white)
                        .background(.teal.gradient, in: RoundedRectangle(cornerRadius: 18))
                    }
                    .buttonStyle(.plain)
                }

                HStack(spacing: 12) {
                    SummaryCard(title: "Trips", value: "\(completedTrips.count)", icon: "calendar")
                    SummaryCard(title: "Fish", value: "\(completedCatches.count)", icon: "fish.fill")
                    SummaryCard(
                        title: "Fish/hour",
                        value: AnalyticsEngine.fishPerHour(fish: completedCatches.count, minutes: completedMinutes).formatted(.number.precision(.fractionLength(1))),
                        icon: "gauge.with.dots.needle.67percent"
                    )
                }

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Recent trips").font(.title2.bold())
                        Spacer()
                        NavigationLink("See all") { TripsView() }
                    }
                    if app.trips.isEmpty {
                        ContentUnavailableView("No fishing trips yet", systemImage: "water.waves")
                            .frame(minHeight: 180)
                    } else {
                        ForEach(app.trips.prefix(4)) { trip in
                            NavigationLink { TripDetailView(trip: trip) } label: {
                                TripRow(trip: trip)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .sectionCard()
            }
            .padding()
        }
        .navigationTitle("Fishing Intelligence")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { Task { await app.refreshAll() } } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
        .refreshable { await app.refreshAll() }
    }
}

private struct SummaryCard: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon).foregroundStyle(.teal)
            Text(value).font(.title2.bold()).minimumScaleFactor(0.7)
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 100)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct TripRow: View {
    let trip: FishingTrip

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: trip.status == .active ? "dot.radiowaves.left.and.right" : "water.waves")
                .font(.title3)
                .foregroundStyle(trip.status == .active ? .green : .teal)
                .frame(width: 42, height: 42)
                .background(.teal.opacity(0.1), in: Circle())
            VStack(alignment: .leading, spacing: 3) {
                Text(trip.waterBody?.name ?? "Fishing trip").font(.headline)
                Text(trip.startedAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text(trip.status.rawValue.capitalized)
                .font(.caption.bold())
                .foregroundStyle(trip.status == .active ? .green : .secondary)
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
    }
}

extension View {
    func sectionCard() -> some View {
        padding()
            .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: 20))
    }
}
