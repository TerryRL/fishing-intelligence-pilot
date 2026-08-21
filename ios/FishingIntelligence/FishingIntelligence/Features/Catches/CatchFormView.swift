import SwiftUI

struct CatchFormView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel
    @State private var speciesID: UUID?
    @State private var length = ""
    @State private var weight = ""
    @State private var disposition: FishDisposition = .released
    @State private var notes = ""
    @State private var imageData: Data?

    var body: some View {
        Form {
            Section("Fish") {
                Picker("Species", selection: $speciesID) {
                    Text("Choose species").tag(UUID?.none)
                    ForEach(app.species) { Text($0.commonName).tag(Optional($0.id)) }
                }
                TextField("Length (cm)", text: $length).keyboardType(.decimalPad)
                TextField("Weight (kg)", text: $weight).keyboardType(.decimalPad)
                Picker("Disposition", selection: $disposition) {
                    ForEach(FishDisposition.allCases) { Text($0.label).tag($0) }
                }
            }
            Section("Photo") { PhotoInput(imageData: $imageData) }
            Section("Notes") { TextEditor(text: $notes).frame(minHeight: 100) }
        }
        .navigationTitle("Log Catch")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    guard let speciesID else { return }
                    Task {
                        if await app.createCatch(
                            speciesID: speciesID,
                            lengthCM: Double(length),
                            weightKG: Double(weight),
                            disposition: disposition,
                            notes: notes,
                            imageData: imageData
                        ) { dismiss() }
                    }
                }
                .disabled(speciesID == nil)
            }
        }
    }
}
