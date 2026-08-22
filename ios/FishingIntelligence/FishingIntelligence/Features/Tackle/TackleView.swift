import SwiftUI

struct TackleView: View {
    @EnvironmentObject private var app: AppModel
    @State private var search = ""
    @State private var editingLure: Lure?
    @State private var showingEditor = false
    @State private var pendingDeactivation: Lure?

    private var filtered: [Lure] {
        guard !search.isEmpty else { return app.activeLures }
        return app.activeLures.filter {
            [$0.productName, $0.manufacturer, $0.category, $0.primaryColour]
                .compactMap { $0 }
                .contains { $0.localizedCaseInsensitiveContains(search) }
        }
    }

    var body: some View {
        List(filtered) { lure in
            HStack(spacing: 12) {
                LocalPhoto(path: lure.photoPath, fallback: "shippingbox")
                    .frame(width: 58, height: 58)
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(lure.productName).font(.headline)
                        if lure.isFavourite { Image(systemName: "star.fill").foregroundStyle(.yellow) }
                    }
                    Text([lure.manufacturer, lure.primaryColour, lure.category].compactMap { $0 }.joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Menu {
                    Button("Edit", systemImage: "pencil") { editingLure = lure; showingEditor = true }
                    Button("Deactivate", systemImage: "archivebox", role: .destructive) { pendingDeactivation = lure }
                } label: { Image(systemName: "ellipsis.circle") }
            }
        }
        .searchable(text: $search, prompt: "Search tackle")
        .navigationTitle("Tackle")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { editingLure = nil; showingEditor = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showingEditor) { NavigationStack { LureEditorView(lure: editingLure) } }
        .confirmationDialog(
            "Deactivate this lure? Historical fishing data will be retained.",
            isPresented: Binding(
                get: { pendingDeactivation != nil },
                set: { if !$0 { pendingDeactivation = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Deactivate", role: .destructive) {
                guard let lure = pendingDeactivation else { return }
                Task { _ = await app.deactivateLure(lure); pendingDeactivation = nil }
            }
        }
    }
}
