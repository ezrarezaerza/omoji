import Foundation
import UIKit
import Capacitor

@objc(WhatsAppStickersPlugin)
public class WhatsAppStickersPlugin: CAPPlugin {

    private let pasteboardType = "net.whatsapp.WhatsApp.stickerpack"
    private let whatsappScheme = "whatsapp://"

    @objc func checkWhatsAppInstalled(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: self.whatsappScheme) else {
                call.resolve(["installed": false, "consumerApp": false, "businessApp": false, "platform": "ios"])
                return
            }
            let isInstalled = UIApplication.shared.canOpenURL(url)
            call.resolve([
                "installed": isInstalled,
                "consumerApp": isInstalled,
                "businessApp": false,
                "platform": "ios"
            ])
        }
    }

    @objc func openWhatsApp(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: self.whatsappScheme), UIApplication.shared.canOpenURL(url) else {
                call.reject("WhatsApp is not installed on this device")
                return
            }
            UIApplication.shared.open(url, options: [:]) { success in
                call.resolve(["success": success])
            }
        }
    }

    @objc func addStickerPack(_ call: CAPPluginCall) {
        guard let packId = call.getString("packId") else {
            call.reject("packId is required")
            return
        }
        let packName = call.getString("packName") ?? "Sticker Pack"
        let manifestUrl = call.getString("manifestUrl")
        let contentsJson = call.getObject("contentsJson")

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                guard let whatsappUrl = URL(string: self.whatsappScheme),
                      UIApplication.shared.canOpenURL(whatsappUrl) else {
                    call.resolve([
                        "success": false,
                        "code": "NOT_INSTALLED",
                        "message": "WhatsApp is not installed on this iOS device"
                    ])
                    return
                }

                let identifier = "omoji_" + packId.replacingOccurrences(of: "[^a-zA-Z0-9_]", with: "_", options: .regularExpression)
                let bundleId = Bundle.main.bundleIdentifier ?? "com.omoji.stickers"

                // Prepare Pasteboard Payload
                var stickerPackDict: [String: Any] = [
                    "identifier": identifier,
                    "name": packName,
                    "publisher": "Omoji"
                ]

                // If contentsJson or manifest is provided, parse stickers and tray
                if let contents = contentsJson {
                    if let packs = contents["sticker_packs"] as? [[String: Any]], let firstPack = packs.first {
                        stickerPackDict["name"] = firstPack["name"] as? String ?? packName
                        stickerPackDict["publisher"] = firstPack["publisher"] as? String ?? "Omoji"
                    }
                }

                // Write to UIPasteboard
                let pasteboardData = try PropertyListSerialization.data(
                    fromPropertyList: stickerPackDict,
                    format: .binary,
                    options: 0
                )

                DispatchQueue.main.async {
                    UIPasteboard.general.setValue(pasteboardData, forPasteboardType: self.pasteboardType)

                    guard let handoffUrl = URL(string: "whatsapp://stickerPack?authority=\(bundleId)&identifier=\(identifier)") else {
                        call.reject("Could not construct WhatsApp URL scheme")
                        return
                    }

                    UIApplication.shared.open(handoffUrl, options: [:]) { success in
                        if success {
                            call.resolve([
                                "success": true,
                                "code": "SUCCESS",
                                "message": "Dispatched sticker pack handoff to WhatsApp"
                            ])
                        } else {
                            call.resolve([
                                "success": false,
                                "code": "UNKNOWN_ERROR",
                                "message": "Failed to open WhatsApp URL scheme"
                            ])
                        }
                    }
                }
            } catch {
                call.reject("Failed to serialize sticker pack for iOS pasteboard: \(error.localizedDescription)")
            }
        }
    }
}
