import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var app: AppModel
    @State private var email = ""
    @State private var password = ""
    @State private var creatingAccount = false
    @State private var confirmationMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                Image(systemName: "fish.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.teal.gradient)
                VStack(spacing: 6) {
                    Text("Fishing Intelligence").font(.largeTitle.bold())
                    Text("Fish. Record. Analyze. Improve.")
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 14) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                    SecureField("Password", text: $password)
                        .textContentType(creatingAccount ? .newPassword : .password)
                        .textFieldStyle(.roundedBorder)
                }

                Button {
                    Task {
                        confirmationMessage = nil
                        if creatingAccount {
                            if await app.signUp(email: email, password: password) {
                                confirmationMessage = "Check your email to confirm the account, then return to this app."
                            }
                        } else {
                            _ = await app.signIn(email: email, password: password)
                        }
                    }
                } label: {
                    Group {
                        if app.isLoading { ProgressView().tint(.white) }
                        else { Text(creatingAccount ? "Create Account" : "Sign In") }
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(email.isEmpty || password.count < 6 || app.isLoading)

                Button(creatingAccount ? "Already have an account? Sign in" : "New here? Create an account") {
                    creatingAccount.toggle()
                    confirmationMessage = nil
                }
                .buttonStyle(.plain)
                .foregroundStyle(.teal)

                if let confirmationMessage {
                    Text(confirmationMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                Spacer()
            }
            .padding(28)
        }
    }
}
