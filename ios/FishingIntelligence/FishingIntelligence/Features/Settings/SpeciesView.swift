import SwiftUI

struct SpeciesView: View {
    @EnvironmentObject private var app: AppModel
    @State private var showingAdd = false

    var body: some View {
        List(app.species) { fish in
            HStack(spacing: 12) {
                LocalPhoto(path: fish.photoPath, fallback: "fish.fill").frame(width: 54, height: 54)
                VStack(alignment: .leading) {
                    Text(fish.commonName).font(.headline)
                    if let scientificName = fish.scientificName {
                        Text(scientificName).font(.caption).italic().foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Fish Species")
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button { showingAdd = true } label: { Image(systemName: "plus") } } }
        .sheet(isPresented: $showingAdd) { NavigationStack { AddSpeciesView() } }
    }
}

private struct AddSpeciesView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel
    @State private var name = ""
    @State private var scientificName = ""
    @State private var imageData: Data?

    var body: some View {
        Form {
            TextField("Common name", text: $name)
            TextField("Scientific name", text: $scientificName)
            Section("Photo") { PhotoInput(imageData: $imageData) }
        }
        .navigationTitle("Add Fish")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task { if await app.createSpecies(commonName: name, scientificName: scientificName, imageData: imageData) { dismiss() } }
                }
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }
}
