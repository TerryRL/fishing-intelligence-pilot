import SwiftUI

struct WaterBodiesView: View {
    @EnvironmentObject private var app: AppModel
    @State private var showingAdd = false

    var body: some View {
        List(app.waterBodies) { water in
            VStack(alignment: .leading) {
                Text(water.name).font(.headline)
                Text(water.waterType.capitalized).font(.caption).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Lakes & Waterways")
        .toolbar { ToolbarItem(placement: .topBarTrailing) { Button { showingAdd = true } label: { Image(systemName: "plus") } } }
        .sheet(isPresented: $showingAdd) { NavigationStack { AddWaterBodyView() } }
    }
}

private struct AddWaterBodyView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel
    @State private var name = ""
    @State private var type = "Lake"
    @State private var customType = ""

    private var types: [String] {
        Array(Set(["Lake", "River", "Bay", "Reservoir", "Pond", "Stream"] + app.waterwayTypes.map(\.name))).sorted()
    }

    var body: some View {
        Form {
            TextField("Name", text: $name)
            Picker("Type", selection: $type) { ForEach(types, id: \.self) { Text($0).tag($0) } }
            TextField("Create another type", text: $customType)
            if !customType.isEmpty {
                Button("Save \"\(customType)\" as a type") {
                    Task { if await app.createWaterwayType(name: customType) { type = customType; customType = "" } }
                }
            }
        }
        .navigationTitle("Add Waterway")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { Task { if await app.createWaterBody(name: name, type: type) { dismiss() } } }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }
}
