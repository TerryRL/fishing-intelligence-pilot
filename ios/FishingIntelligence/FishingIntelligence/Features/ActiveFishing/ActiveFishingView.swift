import SwiftUI

struct ActiveFishingView: View {
    @EnvironmentObject private var app: AppModel
    @State private var showingStart = false
    @State private var showingCatch = false
    @State private var showingLures = false
    @State private var showingSpot = false
    @State private var showingEnd = false

    var body: some View {
        Group {
            if let trip = app.activeTrip {
                activeTrip(trip)
            } else {
                ContentUnavailableView {
                    Label("No active trip", systemImage: "water.waves")
                } description: {
                    Text("Start a trip when you are ready to fish.")
                } actions: {
                    Button("Start Fishing") { showingStart = true }
                        .buttonStyle(.borderedProminent)
                }
            }
        }
        .navigationTitle("Active Fishing")
        .sheet(isPresented: $showingStart) { NavigationStack { NewTripView() } }
        .sheet(isPresented: $showingCatch) { NavigationStack { CatchFormView() } }
        .sheet(isPresented: $showingLures) { NavigationStack { ChangeLureView() } }
        .sheet(isPresented: $showingSpot) { NavigationStack { MarkSpotView() } }
        .sheet(isPresented: $showingEnd) { NavigationStack { EndTripView() } }
    }

    private func activeTrip(_ trip: FishingTrip) -> some View {
        let events = app.events(for: trip)
        let catches = app.catches(for: trip)
        let stats = AnalyticsEngine.activeStats(events: events, catches: catches)

        return ScrollView {
            VStack(spacing: 18) {
                VStack(spacing: 5) {
                    Text(trip.waterBody?.name ?? "Fishing trip").font(.title2.bold())
                    Text("Started \(trip.startedAt.formatted(date: .omitted, time: .shortened))")
                        .foregroundStyle(.secondary)
                    Button {
                        showingLures = true
                    } label: {
                        Label(trip.currentLure?.productName ?? "Choose a lure", systemImage: "arrow.triangle.2.circlepath")
                    }
                    .buttonStyle(.bordered)
                }
                .frame(maxWidth: .infinity)
                .sectionCard()

                HStack(spacing: 10) {
                    StatPill(label: "Casts", value: stats.casts)
                    StatPill(label: "Bites", value: stats.bites)
                    StatPill(label: "Fish", value: stats.catches)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Log casts").font(.headline)
                    HStack {
                        ForEach([1, 5, 10, 25], id: \.self) { count in
                            Button("+\(count)") { Task { _ = await app.record(.castsRecorded, casts: count) } }
                                .buttonStyle(.borderedProminent)
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
                .sectionCard()

                LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: 12) {
                    ActionButton(title: "Bite", icon: "bolt.fill", colour: .orange) {
                        Task { _ = await app.record(.bite) }
                    }
                    ActionButton(title: "Hooked", icon: "link", colour: .blue) {
                        Task { _ = await app.record(.hooked) }
                    }
                    ActionButton(title: "Lost Fish", icon: "arrow.uturn.backward", colour: .red) {
                        Task { _ = await app.record(.fishLost) }
                    }
                    ActionButton(title: "Caught", icon: "fish.fill", colour: .green) {
                        showingCatch = true
                    }
                    ActionButton(title: "Mark Spot", icon: "mappin.and.ellipse", colour: .purple) {
                        showingSpot = true
                    }
                    ActionButton(title: "End Trip", icon: "stop.fill", colour: .gray) {
                        showingEnd = true
                    }
                }
            }
            .padding()
        }
    }
}

private struct StatPill: View {
    let label: String
    let value: Int

    var body: some View {
        VStack {
            Text("\(value)").font(.title.bold())
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 86)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

private struct ActionButton: View {
    let title: String
    let icon: String
    let colour: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon).font(.title2)
                Text(title).font(.headline)
            }
            .frame(maxWidth: .infinity, minHeight: 92)
            .foregroundStyle(.white)
            .background(colour.gradient, in: RoundedRectangle(cornerRadius: 18))
        }
        .buttonStyle(.plain)
    }
}
