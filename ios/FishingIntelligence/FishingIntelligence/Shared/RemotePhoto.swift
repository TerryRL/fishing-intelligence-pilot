import SwiftUI

struct RemotePhoto: View {
    @EnvironmentObject private var app: AppModel
    let path: String?
    let fallback: String
    @State private var url: URL?

    var body: some View {
        Group {
            if let url {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFill() }
                    else if phase.error != nil { fallbackView }
                    else { ProgressView() }
                }
            } else {
                fallbackView
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .task(id: path) { url = await app.signedPhotoURL(for: path) }
    }

    private var fallbackView: some View {
        ZStack {
            Color.teal.opacity(0.12)
            Image(systemName: fallback).font(.title).foregroundStyle(.teal)
        }
    }
}
