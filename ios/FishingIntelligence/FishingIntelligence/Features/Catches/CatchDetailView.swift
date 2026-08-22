import MapKit
import SwiftUI

struct CatchDetailView: View {
    let catchRecord: CatchRecord

    var body: some View {
        List {
            Section {
                LocalPhoto(path: catchRecord.photoPath, fallback: "fish.fill")
                    .frame(maxWidth: .infinity, minHeight: 220, maxHeight: 300)
                    .listRowInsets(EdgeInsets())
            }
            Section("Catch details") {
                LabeledContent("Species", value: catchRecord.species?.commonName ?? "Unknown")
                LabeledContent("Lake", value: catchRecord.trip?.waterBody?.name ?? "Unknown")
                LabeledContent("Date", value: catchRecord.caughtAt.formatted(date: .long, time: .omitted))
                LabeledContent("Time", value: catchRecord.caughtAt.formatted(date: .omitted, time: .shortened))
                LabeledContent("Lure", value: catchRecord.lure?.productName ?? "Unknown")
                if let length = catchRecord.lengthCM { LabeledContent("Length", value: "\(length.formatted()) cm") }
                if let weight = catchRecord.weightKG { LabeledContent("Weight", value: "\(weight.formatted()) kg") }
                if let disposition = catchRecord.disposition { LabeledContent("Disposition", value: disposition.label) }
            }
            if let notes = catchRecord.notes, !notes.isEmpty { Section("Notes") { Text(notes) } }
            if let latitude = catchRecord.latitude, let longitude = catchRecord.longitude {
                Section("Location") {
                    Map(initialPosition: .region(MKCoordinateRegion(
                        center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
                        span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
                    ))) {
                        Marker(catchRecord.species?.commonName ?? "Catch", coordinate: .init(latitude: latitude, longitude: longitude))
                    }
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
            }
        }
        .navigationTitle(catchRecord.species?.commonName ?? "Catch")
        .navigationBarTitleDisplayMode(.inline)
    }
}
