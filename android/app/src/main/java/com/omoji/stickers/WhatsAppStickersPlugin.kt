package com.omoji.stickers

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

@CapacitorPlugin(name = "WhatsAppStickers")
class WhatsAppStickersPlugin : Plugin() {

    companion object {
        const val WHATSAPP_PACKAGE_NAME = "com.whatsapp"
        const val WHATSAPP_BUSINESS_PACKAGE_NAME = "com.whatsapp.w4b"
        const val EXTRA_STICKER_PACK_ID = "extra_sticker_pack_id"
        const val EXTRA_STICKER_PACK_AUTHORITY = "extra_sticker_pack_authority"
        const val EXTRA_STICKER_PACK_NAME = "extra_sticker_pack_name"
        const val ACTION_ENABLE_STICKER_PACK = "com.whatsapp.intent.action.ENABLE_STICKER_PACK"
    }

    private fun isPackageInstalled(packageName: String, context: Context): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        }
    }

    @PluginMethod
    fun checkWhatsAppInstalled(call: PluginCall) {
        val context = context ?: return call.reject("Context is unavailable")
        val consumerInstalled = isPackageInstalled(WHATSAPP_PACKAGE_NAME, context)
        val businessInstalled = isPackageInstalled(WHATSAPP_BUSINESS_PACKAGE_NAME, context)

        val ret = JSObject().apply {
            put("installed", consumerInstalled || businessInstalled)
            put("consumerApp", consumerInstalled)
            put("businessApp", businessInstalled)
            put("platform", "android")
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun openWhatsApp(call: PluginCall) {
        val context = context ?: return call.reject("Context is unavailable")
        val launchIntent = context.packageManager.getLaunchIntentForPackage(WHATSAPP_PACKAGE_NAME)
            ?: context.packageManager.getLaunchIntentForPackage(WHATSAPP_BUSINESS_PACKAGE_NAME)

        if (launchIntent != null) {
            context.startActivity(launchIntent)
            call.resolve(JSObject().put("success", true))
        } else {
            call.reject("WhatsApp is not installed on this device")
        }
    }

    @PluginMethod
    fun triggerAndroidIntent(call: PluginCall) {
        val intentUriString = call.getString("intentUri")
            ?: return call.reject("intentUri is required")
        try {
            val intent = Intent.parseUri(intentUriString, Intent.URI_INTENT_SCHEME)
            activity.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Failed to trigger intent: ${e.message}")
        }
    }

    @PluginMethod
    fun addStickerPack(call: PluginCall) {
        val context = context ?: return call.reject("Context is unavailable")
        val packId = call.getString("packId") ?: return call.reject("packId is required")
        val packName = call.getString("packName") ?: "Sticker Pack"
        val manifestUrl = call.getString("manifestUrl")
        val contentsJson = call.getObject("contentsJson")

        val targetPackage = when {
            isPackageInstalled(WHATSAPP_PACKAGE_NAME, context) -> WHATSAPP_PACKAGE_NAME
            isPackageInstalled(WHATSAPP_BUSINESS_PACKAGE_NAME, context) -> WHATSAPP_BUSINESS_PACKAGE_NAME
            else -> {
                val ret = JSObject().apply {
                    put("success", false)
                    put("code", "NOT_INSTALLED")
                    put("message", "Neither WhatsApp nor WhatsApp Business is installed")
                }
                return call.resolve(ret)
            }
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Ensure pack files and contents.json are prepared in app local storage
                val identifier = prepareStickerPackFiles(context, packId, manifestUrl, contentsJson)

                withContext(Dispatchers.Main) {
                    val intent = Intent(ACTION_ENABLE_STICKER_PACK).apply {
                        setPackage(targetPackage)
                        putExtra(EXTRA_STICKER_PACK_ID, identifier)
                        putExtra(EXTRA_STICKER_PACK_AUTHORITY, StickerContentProvider.AUTHORITY)
                        putExtra(EXTRA_STICKER_PACK_NAME, packName)
                    }

                    startActivityForResult(call, intent, "handleAddStickerResult")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    val ret = JSObject().apply {
                        put("success", false)
                        put("code", "UNKNOWN_ERROR")
                        put("message", e.message ?: "Failed to prepare sticker pack")
                    }
                    call.resolve(ret)
                }
            }
        }
    }

    @ActivityCallback
    private fun handleAddStickerResult(call: PluginCall, result: androidx.activity.result.ActivityResult) {
        val ret = JSObject()
        if (result.resultCode == Activity.RESULT_OK) {
            ret.put("success", true)
            ret.put("code", "SUCCESS")
            ret.put("message", "Sticker pack added to WhatsApp successfully!")
        } else {
            val data = result.data
            var errorMsg = "User cancelled adding the sticker pack to WhatsApp"
            var code = "USER_CANCELLED"

            if (data != null && data.hasExtra("validation_error")) {
                val validationError = data.getStringExtra("validation_error")
                if (!validationError.isNullOrBlank()) {
                    errorMsg = "WhatsApp validation error: $validationError"
                    code = "VALIDATION_FAILED"
                }
            }

            ret.put("success", false)
            ret.put("code", code)
            ret.put("message", errorMsg)
        }
        call.resolve(ret)
    }

    private fun prepareStickerPackFiles(
        context: Context,
        packId: String,
        manifestUrl: String?,
        contentsJson: JSObject?
    ): String {
        val rootDir = File(context.filesDir, "whatsapp_sticker_packs")
        val identifier = "omoji_${packId.replace("[^a-zA-Z0-9_]".toRegex(), "_")}"
        val packDir = File(rootDir, identifier)
        if (!packDir.exists()) {
            packDir.mkdirs()
        }

        val jsonString: String = if (contentsJson != null) {
            contentsJson.toString()
        } else if (!manifestUrl.isNullOrBlank()) {
            val url = URL(manifestUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            connection.inputStream.bufferedReader().use { it.readText() }
        } else {
            throw IllegalArgumentException("Either manifestUrl or contentsJson must be provided")
        }

        // Parse contents.json and download sticker files if needed
        val manifestObj = JSONObject(jsonString)
        val contentsToSave = if (manifestObj.has("contents")) {
            manifestObj.getJSONObject("contents")
        } else {
            manifestObj
        }

        File(packDir, "contents.json").writeText(contentsToSave.toString(2))

        val packsArray = contentsToSave.optJSONArray("sticker_packs")
        if (packsArray != null && packsArray.length() > 0) {
            val pack = packsArray.getJSONObject(0)

            // Tray icon download
            val trayUrl = pack.optString("tray_image_url")
            val trayFileName = pack.optString("tray_image_file", "tray_icon.png")
            if (trayUrl.isNotBlank() && (trayUrl.startsWith("http://") || trayUrl.startsWith("https://"))) {
                downloadFile(trayUrl, File(packDir, trayFileName))
            }

            // Stickers download
            val stickers = pack.optJSONArray("stickers")
            if (stickers != null) {
                for (i in 0 until stickers.length()) {
                    val s = stickers.getJSONObject(i)
                    val imgUrl = s.optString("image_url")
                    val fileName = s.optString("image_file", "$i.webp")
                    if (imgUrl.isNotBlank() && (imgUrl.startsWith("http://") || imgUrl.startsWith("https://"))) {
                        downloadFile(imgUrl, File(packDir, fileName))
                    }
                }
            }
        }

        return identifier
    }

    private fun downloadFile(fileUrl: String, destFile: File) {
        if (destFile.exists() && destFile.length() > 0) return
        val url = URL(fileUrl)
        val conn = url.openConnection() as HttpURLConnection
        conn.connectTimeout = 15000
        conn.readTimeout = 15000
        conn.inputStream.use { input ->
            FileOutputStream(destFile).use { output ->
                input.copyTo(output)
            }
        }
    }
}
