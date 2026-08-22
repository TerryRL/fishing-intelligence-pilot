import SwiftData
import SwiftUI

@main
struct FishingIntelligenceApp: App {
    private let modelContainer: ModelContainer
    @StateObject private var app: AppModel

    init() {
        do {
            let container = try ModelContainer(for: LocalDatabaseRecord.self)
            modelContainer = container
            _app = StateObject(wrappedValue: AppModel(container: container))
        } catch {
            fatalError("Unable to open the on-device fishing database: \(error.localizedDescription)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(app)
                .task { await app.bootstrap() }
        }
        .modelContainer(modelContainer)
    }
}
