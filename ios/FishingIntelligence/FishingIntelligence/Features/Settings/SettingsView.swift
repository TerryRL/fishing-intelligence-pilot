import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var app: AppModel
    @State private var units: PreferredUnits = .metric

    var body: some View {
        List {
            Section("Setup") {
                NavigationLink { WaterBodiesView() } label: { Label("Lakes & Waterways", systemImage: "water.waves") }
                NavigationLink { SpeciesView() } label: { Label("Fish Species", systemImage: "fish.fill") }
                NavigationLink { TackleView() } label: { Label("Lures", systemImage: "shippingbox.fill") }
            }
            Section("Preferences") {
                Picker("Units", selection: $units) {
                    ForEach(PreferredUnits.allCases) { Text($0.label).tag($0) }
                }
                .onChange(of: units) { _, value in Task { _ = await app.updateUnits(value) } }
            }
            Section {
                Button("Sign Out", role: .destructive) { Task { await app.signOut() } }
            }
            Section("About") {
                LabeledContent("App", value: "Fishing Intelligence")
                LabeledContent("Backend", value: "Supabase")
                Text("Fishing locations and photos remain private under the existing row-level security policies.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Settings")
        .onAppear { units = app.profile?.preferredUnits ?? .metric }
    }
}
