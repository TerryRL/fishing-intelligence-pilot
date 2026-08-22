import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack { HomeView() }
                .tabItem { Label("Home", systemImage: "house.fill") }

            NavigationStack { TripsView() }
                .tabItem { Label("Trips", systemImage: "clock.arrow.circlepath") }

            NavigationStack { ActiveFishingView() }
                .tabItem { Label("Fish", systemImage: "dot.radiowaves.left.and.right") }

            NavigationStack { FishingMapView() }
                .tabItem { Label("Map", systemImage: "map.fill") }

            NavigationStack { MoreView() }
                .tabItem { Label("More", systemImage: "square.grid.2x2.fill") }
        }
        .tint(.teal)
    }
}

private struct MoreView: View {
    var body: some View {
        List {
            NavigationLink { TackleView() } label: {
                Label("Tackle", systemImage: "shippingbox.fill")
            }
            NavigationLink { AnalyticsView() } label: {
                Label("Insights", systemImage: "chart.bar.xaxis")
            }
            NavigationLink { SettingsView() } label: {
                Label("Settings", systemImage: "gearshape.fill")
            }
        }
        .navigationTitle("More")
    }
}
