import MapKit
import SwiftUI

struct FishingMapView: View {
    @EnvironmentObject private var app: AppModel
    @State private var position: MapCameraPosition = .automatic
    @State private var selectedCatch: CatchRecord?
    @State private var selectedYear: Int?

    private var years: [Int] {
        Array(Set(app.catches.map { Calendar.current.component(.year, from: $0.caughtAt) })).sorted(by: >)
    }

    private var visibleCatches: [CatchRecord] {
        app.catches.filter { row in
            row.latitude != nil && row.longitude != nil &&
            (selectedYear == nil || Calendar.current.component(.year, from: row.caughtAt) == selectedYear)
        }
    }

    var body: some View {
        Map(position: $position) {
            ForEach(visibleCatches) { catchRecord in
                if let latitude = catchRecord.latitude, let longitude = catchRecord.longitude {
                    Annotation(
                        catchRecord.species?.commonName ?? "Catch",
                        coordinate: CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
                    ) {
                        Button { selectedCatch = catchRecord } label: {
                            Image(systemName: "fish.fill")
                                .padding(9)
                                .foregroundStyle(.white)
                                .background(.green.gradient, in: Circle())
                                .shadow(radius: 3)
                        }
                    }
                }
            }
            ForEach(app.spots) { spot in
                Marker(
                    spot.name ?? spot.structureType ?? "Fishing spot",
                    systemImage: "mappin.and.ellipse",
                    coordinate: CLLocationCoordinate2D(latitude: spot.latitude, longitude: spot.longitude)
                )
                .tint(.purple)
            }
            UserAnnotation()
        }
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
        .safeAreaInset(edge: .top) {
            Picker("Activity period", selection: $selectedYear) {
                Text("All years").tag(Int?.none)
                ForEach(years, id: \.self) { Text(String($0)).tag(Optional($0)) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
        }
        .navigationTitle("Fishing Map")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedCatch) { catchRecord in
            NavigationStack { CatchDetailView(catchRecord: catchRecord) }
        }
    }
}
