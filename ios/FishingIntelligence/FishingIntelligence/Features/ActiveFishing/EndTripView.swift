import SwiftUI

struct EndTripView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel
    @State private var notes = ""

    var body: some View {
        Form {
            Section("Trip notes") {
                TextEditor(text: $notes).frame(minHeight: 140)
            }
            Section {
                Button("End Fishing Trip", role: .destructive) {
                    Task { if await app.endTrip(notes: notes) { dismiss() } }
                }
            }
        }
        .navigationTitle("End Trip")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
    }
}
