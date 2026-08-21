import Foundation

struct SupabaseConfiguration: Sendable {
    let projectURL: URL
    let publishableKey: String
    let callbackURL: URL

    static func load(bundle: Bundle = .main) -> SupabaseConfiguration? {
        guard
            let url = bundle.url(forResource: "SupabaseConfig", withExtension: "plist"),
            let data = try? Data(contentsOf: url),
            let raw = try? PropertyListSerialization.propertyList(from: data, format: nil),
            let values = raw as? [String: String],
            let project = values["SUPABASE_URL"],
            let key = values["SUPABASE_PUBLISHABLE_KEY"],
            !key.isEmpty,
            key != "YOUR_PUBLISHABLE_KEY",
            let projectURL = URL(string: project),
            let callbackURL = URL(string: values["AUTH_CALLBACK_URL"] ?? "fishing-intelligence://auth-callback")
        else { return nil }

        return SupabaseConfiguration(
            projectURL: projectURL,
            publishableKey: key,
            callbackURL: callbackURL
        )
    }
}
