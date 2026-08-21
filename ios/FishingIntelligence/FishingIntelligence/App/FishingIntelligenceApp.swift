import SwiftUI

@main
struct FishingIntelligenceApp: App {
    @StateObject private var app = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(app)
                .task { await app.bootstrap() }
                .onOpenURL { url in Task { await app.handleAuthCallback(url) } }
        }
    }
}
