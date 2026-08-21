import SwiftUI

struct LureEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel
    let lure: Lure?
    @State private var name: String
    @State private var manufacturer: String
    @State private var category: String
    @State private var colour: String
    @State private var notes: String
    @State private var favourite: Bool
    @State private var imageData: Data?

    init(lure: Lure?) {
        self.lure = lure
        _name = State(initialValue: lure?.productName ?? "")
        _manufacturer = State(initialValue: lure?.manufacturer ?? "")
        _category = State(initialValue: lure?.category ?? "")
        _colour = State(initialValue: lure?.primaryColour ?? "")
        _notes = State(initialValue: lure?.notes ?? "")
        _favourite = State(initialValue: lure?.isFavourite ?? false)
    }

    private var categories: [String] {
        Array(Set(["Crankbait", "Jerkbait", "Jig", "Soft Plastic", "Spinnerbait", "Spoon", "Topwater"] + app.lures.map(\.category))).sorted()
    }
    private var colours: [String] {
        Array(Set(["Black", "Blue", "Chartreuse", "Green", "Orange", "Red", "Silver", "White", "Yellow"] + app.lures.compactMap(\.primaryColour))).sorted()
    }

    var body: some View {
        Form {
            Section("Lure") {
                TextField("Name", text: $name)
                TextField("Manufacturer", text: $manufacturer)
                Picker("Type", selection: $category) {
                    Text("Choose or type below").tag("")
                    ForEach(categories, id: \.self) { Text($0).tag($0) }
                }
                TextField("Custom type", text: $category)
                Picker("Colour", selection: $colour) {
                    Text("Choose or type below").tag("")
                    ForEach(colours, id: \.self) { Text($0).tag($0) }
                }
                TextField("Custom colour", text: $colour)
                Toggle("Favourite", isOn: $favourite)
            }
            Section("Photo") {
                if imageData == nil, lure?.photoPath != nil {
                    RemotePhoto(path: lure?.photoPath, fallback: "shippingbox")
                        .frame(height: 180)
                }
                PhotoInput(imageData: $imageData)
            }
            Section("Notes") { TextEditor(text: $notes).frame(minHeight: 100) }
        }
        .navigationTitle(lure == nil ? "Add Lure" : "Edit Lure")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task {
                        if await app.saveLure(
                            existing: lure, name: name, manufacturer: manufacturer,
                            category: category, colour: colour, notes: notes,
                            imageData: imageData, favourite: favourite
                        ) { dismiss() }
                    }
                }
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || category.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }
}
