import SwiftUI
import UIKit

struct LocalPhoto: View {
    @EnvironmentObject private var app: AppModel
    let path: String?
    let fallback: String

    var body: some View {
        Group {
            if let url = app.localPhotoURL(for: path),
               let image = UIImage(contentsOfFile: url.path) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                fallbackView
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var fallbackView: some View {
        ZStack {
            Color.teal.opacity(0.12)
            Image(systemName: fallback).font(.title).foregroundStyle(.teal)
        }
    }
}
