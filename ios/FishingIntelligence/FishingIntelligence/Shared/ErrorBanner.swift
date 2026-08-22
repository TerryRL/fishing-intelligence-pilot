import SwiftUI

struct ErrorBanner: View {
    let message: String
    let dismiss: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
            Text(message).font(.footnote).frame(maxWidth: .infinity, alignment: .leading)
            Button(action: dismiss) { Image(systemName: "xmark") }
        }
        .foregroundStyle(.white)
        .padding()
        .background(.red.gradient, in: RoundedRectangle(cornerRadius: 14))
        .shadow(radius: 8)
    }
}
