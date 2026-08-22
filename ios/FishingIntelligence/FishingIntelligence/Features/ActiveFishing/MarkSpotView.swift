import SwiftUI

struct MarkSpotView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel
    @State private var name = ""
    @State private var structure = ""

    var body: some View {
        Form {
            TextField("Spot name (optional)", text: $name)
            TextField("Structure, e.g. weed edge", text: $structure)
        }
        .navigationTitle("Mark Fishing Spot")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { Task { if await app.markSpot(name: name, structureType: structure) { dismiss() } } }
            }
        }
    }
}
