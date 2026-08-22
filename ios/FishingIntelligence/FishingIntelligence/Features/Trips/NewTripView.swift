import SwiftUI

struct NewTripView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel
    @State private var waterBodyID: UUID?
    @State private var speciesID: UUID?
    @State private var lureID: UUID?

    var body: some View {
        Form {
            Section("Where") {
                Picker("Lake / waterway", selection: $waterBodyID) {
                    Text("Choose one").tag(UUID?.none)
                    ForEach(app.waterBodies) { Text($0.name).tag(Optional($0.id)) }
                }
            }
            Section("Setup") {
                Picker("Target species", selection: $speciesID) {
                    Text("No target").tag(UUID?.none)
                    ForEach(app.activeSpecies) { Text($0.commonName).tag(Optional($0.id)) }
                }
                Picker("Starting lure", selection: $lureID) {
                    Text("Choose later").tag(UUID?.none)
                    ForEach(app.activeLures) { Text($0.productName).tag(Optional($0.id)) }
                }
            }
            if app.waterBodies.isEmpty {
                Section {
                    Text("Add a lake or waterway in More → Settings before starting a trip.")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Start Fishing")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            ToolbarItem(placement: .confirmationAction) {
                Button("Start") {
                    guard let waterBodyID else { return }
                    Task { if await app.startTrip(waterBodyID: waterBodyID, speciesID: speciesID, lureID: lureID) { dismiss() } }
                }
                .disabled(waterBodyID == nil)
            }
        }
    }
}
