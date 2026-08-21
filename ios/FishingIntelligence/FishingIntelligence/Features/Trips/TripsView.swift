import SwiftUI

struct TripsView: View {
    @EnvironmentObject private var app: AppModel
    @State private var showingNewTrip = false
    @State private var pendingDelete: FishingTrip?

    var body: some View {
        List {
            if let active = app.activeTrip {
                Section("Active") {
                    NavigationLink { ActiveFishingView() } label: { TripRow(trip: active) }
                }
            }
            Section("History") {
                ForEach(app.trips.filter { $0.status != .active }) { trip in
                    NavigationLink { TripDetailView(trip: trip) } label: { TripRow(trip: trip) }
                        .swipeActions {
                            Button("Delete", role: .destructive) { pendingDelete = trip }
                        }
                }
            }
        }
        .navigationTitle("Trips")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingNewTrip = true } label: { Image(systemName: "plus") }
                    .disabled(app.activeTrip != nil)
            }
        }
        .sheet(isPresented: $showingNewTrip) { NavigationStack { NewTripView() } }
        .confirmationDialog(
            "Delete this fishing trip? Its events and catches will also be removed.",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete Trip", role: .destructive) {
                guard let trip = pendingDelete else { return }
                Task { _ = await app.deleteTrip(trip); pendingDelete = nil }
            }
        }
    }
}
