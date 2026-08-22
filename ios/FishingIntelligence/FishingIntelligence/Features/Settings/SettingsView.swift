import SwiftUI
import UniformTypeIdentifiers

struct SettingsView: View {
    @EnvironmentObject private var app: AppModel
    @State private var units: PreferredUnits = .metric
    @State private var backupDocument: LocalBackupDocument?
    @State private var showingExporter = false
    @State private var showingImporter = false
    @State private var pendingRestoreURL: URL?
    @State private var showingRestoreConfirmation = false

    var body: some View {
        List {
            Section("Setup") {
                NavigationLink { WaterBodiesView() } label: {
                    Label("Lakes & Waterways", systemImage: "water.waves")
                }
                NavigationLink { SpeciesView() } label: {
                    Label("Fish Species", systemImage: "fish.fill")
                }
                NavigationLink { TackleView() } label: {
                    Label("Lures", systemImage: "shippingbox.fill")
                }
            }

            Section("Preferences") {
                Picker("Units", selection: $units) {
                    ForEach(PreferredUnits.allCases) { Text($0.label).tag($0) }
                }
                .onChange(of: units) { _, value in
                    Task { _ = await app.updateUnits(value) }
                }
            }

            Section("Backup & Restore") {
                Button {
                    backupDocument = app.makeBackupDocument()
                    showingExporter = backupDocument != nil
                } label: {
                    Label("Save a Backup", systemImage: "square.and.arrow.up")
                }

                Button {
                    showingImporter = true
                } label: {
                    Label("Restore from Backup", systemImage: "square.and.arrow.down")
                }

                Text("The backup contains your fishing records and photos. Save it in iCloud Drive, on your Mac, or another location you control.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("About") {
                LabeledContent("App", value: "Fishing Intelligence")
                LabeledContent("Storage", value: "On this iPhone")
                Text("The app works without an account or internet connection. Your information is not sent to Fishing Intelligence servers.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Settings")
        .onAppear { units = app.profile?.preferredUnits ?? .metric }
        .fileExporter(
            isPresented: $showingExporter,
            document: backupDocument,
            contentType: .json,
            defaultFilename: "Fishing Intelligence Backup"
        ) { result in
            if case .failure(let error) = result {
                app.errorMessage = error.localizedDescription
            }
        }
        .fileImporter(
            isPresented: $showingImporter,
            allowedContentTypes: [.json],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                pendingRestoreURL = urls.first
                showingRestoreConfirmation = pendingRestoreURL != nil
            case .failure(let error):
                app.errorMessage = error.localizedDescription
            }
        }
        .confirmationDialog(
            "Replace the data on this iPhone?",
            isPresented: $showingRestoreConfirmation,
            titleVisibility: .visible
        ) {
            Button("Restore Backup", role: .destructive) {
                guard let url = pendingRestoreURL else { return }
                Task {
                    _ = await app.restoreBackup(from: url)
                    pendingRestoreURL = nil
                }
            }
            Button("Cancel", role: .cancel) { pendingRestoreURL = nil }
        } message: {
            Text("The selected backup will replace the current fishing records. Save a backup first if you want to keep them.")
        }
    }
}
