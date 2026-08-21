import SwiftUI

struct RootView: View {
    @EnvironmentObject private var app: AppModel

    var body: some View {
        Group {
            if !app.isConfigured {
                ConfigurationHelpView()
            } else if app.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .overlay(alignment: .top) {
            if let error = app.errorMessage {
                ErrorBanner(message: error) { app.errorMessage = nil }
                    .padding()
            }
        }
    }
}

private struct ConfigurationHelpView: View {
    var body: some View {
        ContentUnavailableView {
            Label("Connect Supabase", systemImage: "externaldrive.connected.to.line.below")
        } description: {
            Text("Open SupabaseConfig.plist in Xcode and replace YOUR_PUBLISHABLE_KEY with the same publishable key used by the web app.")
        }
        .padding()
    }
}
