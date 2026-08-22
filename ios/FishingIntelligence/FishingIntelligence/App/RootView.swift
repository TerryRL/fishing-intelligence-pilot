import SwiftUI

struct RootView: View {
    @EnvironmentObject private var app: AppModel

    var body: some View {
        Group {
            if app.profile == nil, app.isLoading {
                ProgressView("Opening your fishing log…")
            } else {
                MainTabView()
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
