import PhotosUI
import SwiftUI
import UIKit

struct PhotoInput: View {
    @Binding var imageData: Data?
    @State private var libraryItem: PhotosPickerItem?
    @State private var showingCamera = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let imageData, let image = UIImage(data: imageData) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity, minHeight: 160, maxHeight: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            HStack {
                if UIImagePickerController.isSourceTypeAvailable(.camera) {
                    Button { showingCamera = true } label: { Label("Camera", systemImage: "camera.fill") }
                }
                PhotosPicker(selection: $libraryItem, matching: .images) {
                    Label("Photo Library", systemImage: "photo.on.rectangle")
                }
                if imageData != nil {
                    Button("Remove", role: .destructive) { imageData = nil; libraryItem = nil }
                }
            }
        }
        .task(id: libraryItem) {
            imageData = try? await libraryItem?.loadTransferable(type: Data.self)
        }
        .sheet(isPresented: $showingCamera) { CameraCaptureView(imageData: $imageData) }
    }
}

private struct CameraCaptureView: UIViewControllerRepresentable {
    @Environment(\.dismiss) private var dismiss
    @Binding var imageData: Data?

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: CameraCaptureView
        init(parent: CameraCaptureView) { self.parent = parent }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage {
                parent.imageData = image.jpegData(compressionQuality: 0.82)
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { parent.dismiss() }
    }
}
