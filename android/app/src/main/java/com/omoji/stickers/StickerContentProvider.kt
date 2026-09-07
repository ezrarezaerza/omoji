package com.omoji.stickers

import android.content.ContentProvider
import android.content.ContentValues
import android.content.UriMatcher
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.text.TextUtils
import java.io.File
import java.io.FileNotFoundException
import org.json.JSONObject

/**
 * StickerContentProvider
 *
 * Implements the official ContentProvider contract required by WhatsApp Messenger
 * (com.whatsapp) and WhatsApp Business (com.whatsapp.w4b).
 *
 * Authority: com.omoji.stickers.provider
 */
class StickerContentProvider : ContentProvider() {

    companion object {
        const val AUTHORITY = "com.omoji.stickers.provider"

        // Column constants conforming to WhatsApp Sticker API
        const val STICKER_PACK_IDENTIFIER = "sticker_pack_identifier"
        const val STICKER_PACK_NAME = "sticker_pack_name"
        const val STICKER_PACK_PUBLISHER = "sticker_pack_publisher"
        const val STICKER_PACK_ICON = "sticker_pack_icon"
        const val ANDROID_APP_DOWNLOAD_LINK = "android_play_store_link"
        const val IOS_APP_DOWNLOAD_LINK = "ios_app_store_link"
        const val PUBLISHER_EMAIL = "publisher_email"
        const val PUBLISHER_WEBSITE = "publisher_website"
        const val PRIVACY_POLICY_WEBSITE = "privacy_policy_website"
        const val LICENSE_AGREEMENT_WEBSITE = "license_agreement_website"
        const val IMAGE_DATA_VERSION = "image_data_version"
        const val AVOID_CACHE = "avoid_cache"
        const val ANIMATED_STICKER_PACK = "animated_sticker_pack"

        const val STICKER_FILE_NAME = "sticker_file_name"
        const val STICKER_FILE_EMOJI = "sticker_pack_emojis"
        const val STICKER_ACCESSIBILITY_TEXT = "sticker_accessibility_text"

        private const val METADATA_CODE = 1
        private const val METADATA_PACK_CODE = 2
        private const val STICKERS_CODE = 3
        private const val STICKERS_ASSET_CODE = 4

        private val MATCHER = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(AUTHORITY, "metadata", METADATA_CODE)
            addURI(AUTHORITY, "metadata/*", METADATA_PACK_CODE)
            addURI(AUTHORITY, "stickers/*", STICKERS_CODE)
            addURI(AUTHORITY, "stickers_asset/*/*", STICKERS_ASSET_CODE)
        }
    }

    override fun onCreate(): Boolean {
        return true
    }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        val code = MATCHER.match(uri)
        val context = context ?: return null

        return when (code) {
            METADATA_CODE -> getAllPacksCursor()
            METADATA_PACK_CODE -> {
                val packId = uri.lastPathSegment ?: return null
                getPackCursor(packId)
            }
            STICKERS_CODE -> {
                val packId = uri.lastPathSegment ?: return null
                getStickersCursor(packId)
            }
            else -> throw IllegalArgumentException("Unknown URI: $uri")
        }
    }

    override fun getType(uri: Uri): String? {
        return when (MATCHER.match(uri)) {
            METADATA_CODE -> "vnd.android.cursor.dir/vnd.$AUTHORITY.metadata"
            METADATA_PACK_CODE -> "vnd.android.cursor.item/vnd.$AUTHORITY.metadata"
            STICKERS_CODE -> "vnd.android.cursor.dir/vnd.$AUTHORITY.stickers"
            STICKERS_ASSET_CODE -> "image/webp"
            else -> throw IllegalArgumentException("Unknown URI: $uri")
        }
    }

    @Throws(FileNotFoundException::class)
    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
        val match = MATCHER.match(uri)
        if (match == STICKERS_ASSET_CODE) {
            val segments = uri.pathSegments
            val packIdentifier = segments[1]
            val fileName = segments[2]
            val assetFile = getStickerAssetFile(packIdentifier, fileName)
            if (assetFile.exists()) {
                return ParcelFileDescriptor.open(assetFile, ParcelFileDescriptor.MODE_READ_ONLY)
            }
            throw FileNotFoundException("Sticker asset not found: $fileName for pack: $packIdentifier")
        }
        throw IllegalArgumentException("Invalid URI for openFile: $uri")
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int = 0

    private fun getAllPacksCursor(): MatrixCursor {
        val columns = arrayOf(
            STICKER_PACK_IDENTIFIER,
            STICKER_PACK_NAME,
            STICKER_PACK_PUBLISHER,
            STICKER_PACK_ICON,
            ANDROID_APP_DOWNLOAD_LINK,
            IOS_APP_DOWNLOAD_LINK,
            PUBLISHER_EMAIL,
            PUBLISHER_WEBSITE,
            PRIVACY_POLICY_WEBSITE,
            LICENSE_AGREEMENT_WEBSITE,
            IMAGE_DATA_VERSION,
            AVOID_CACHE,
            ANIMATED_STICKER_PACK
        )
        val cursor = MatrixCursor(columns)
        val storageDir = getPacksStorageDir()
        if (storageDir.exists() && storageDir.isDirectory) {
            storageDir.listFiles()?.forEach { dir ->
                if (dir.isDirectory) {
                    val manifestFile = File(dir, "contents.json")
                    if (manifestFile.exists()) {
                        try {
                            val json = JSONObject(manifestFile.readText())
                            val packsArray = json.optJSONArray("sticker_packs")
                            if (packsArray != null && packsArray.length() > 0) {
                                val pack = packsArray.getJSONObject(0)
                                cursor.addRow(arrayOf(
                                    pack.optString("identifier", dir.name),
                                    pack.optString("name", dir.name),
                                    pack.optString("publisher", "Omoji"),
                                    pack.optString("tray_image_file", "tray_icon.png"),
                                    pack.optString("android_play_store_link", ""),
                                    pack.optString("ios_app_store_link", ""),
                                    pack.optString("publisher_email", ""),
                                    pack.optString("publisher_website", ""),
                                    pack.optString("privacy_policy_website", ""),
                                    pack.optString("license_agreement_website", ""),
                                    pack.optString("image_data_version", "1"),
                                    if (pack.optBoolean("avoid_cache", false)) 1 else 0,
                                    if (pack.optBoolean("animated_sticker_pack", false)) 1 else 0
                                ))
                            }
                        } catch (_: Exception) {}
                    }
                }
            }
        }
        return cursor
    }

    private fun getPackCursor(packId: String): MatrixCursor {
        val cursor = getAllPacksCursor()
        val singleCursor = MatrixCursor(cursor.columnNames)
        while (cursor.moveToNext()) {
            if (cursor.getString(cursor.getColumnIndexOrThrow(STICKER_PACK_IDENTIFIER)) == packId) {
                val row = Array<Any?>(cursor.columnCount) { idx -> cursor.getString(idx) }
                singleCursor.addRow(row)
                break
            }
        }
        cursor.close()
        return singleCursor
    }

    private fun getStickersCursor(packId: String): MatrixCursor {
        val columns = arrayOf(
            STICKER_FILE_NAME,
            STICKER_FILE_EMOJI,
            STICKER_ACCESSIBILITY_TEXT
        )
        val cursor = MatrixCursor(columns)
        val packDir = File(getPacksStorageDir(), packId)
        val manifestFile = File(packDir, "contents.json")

        if (manifestFile.exists()) {
            try {
                val json = JSONObject(manifestFile.readText())
                val packsArray = json.optJSONArray("sticker_packs")
                if (packsArray != null && packsArray.length() > 0) {
                    val pack = packsArray.getJSONObject(0)
                    val stickers = pack.optJSONArray("stickers")
                    if (stickers != null) {
                        for (i in 0 until stickers.length()) {
                            val s = stickers.getJSONObject(i)
                            val fileName = s.optString("image_file", "$i.webp")
                            val emojisArray = s.optJSONArray("emojis")
                            val emojis = mutableListOf<String>()
                            if (emojisArray != null) {
                                for (j in 0 until emojisArray.length()) {
                                    emojis.add(emojisArray.getString(j))
                                }
                            }
                            val emojiString = TextUtils.join(",", emojis)
                            cursor.addRow(arrayOf(
                                fileName,
                                emojiString,
                                s.optString("accessibility_text", "Sticker $i")
                            ))
                        }
                    }
                }
            } catch (_: Exception) {}
        }
        return cursor
    }

    private fun getStickerAssetFile(packId: String, fileName: String): File {
        val packDir = File(getPacksStorageDir(), packId)
        return File(packDir, fileName)
    }

    private fun getPacksStorageDir(): File {
        val context = context ?: throw IllegalStateException("Context is null")
        val dir = File(context.filesDir, "whatsapp_sticker_packs")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }
}
