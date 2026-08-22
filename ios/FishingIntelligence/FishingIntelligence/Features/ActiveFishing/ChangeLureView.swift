import SwiftUI

struct ChangeLureView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var app: AppModel

    var body: some View {
        List(app.activeLures) { lure in
            Button {
                Task { if await app.changeLure(to: lure.id) { dismiss() } }
            } label: {
                HStack {
                    LocalPhoto(path: lure.photoPath, fallback: "shippingbox")
                        .frame(width: 52, height: 52)
                    VStack(alignment: .leading) {
                        Text(lure.productName).font(.headline)
                        Text([lure.manufacturer, lure.primaryColour, lure.category].compactMap { $0 }.joined(separator: " · "))
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    if lure.id == app.activeTrip?.currentLureID { Image(systemName: "checkmark.circle.fill") }
                }
            }
            .buttonStyle(.plain)
        }
        .navigationTitle("Change Lure")
        .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
    }
}
