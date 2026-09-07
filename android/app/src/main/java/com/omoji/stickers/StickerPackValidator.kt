package com.omoji.stickers

import android.content.Context
import android.graphics.BitmapFactory
import java.io.File
import java.io.FileInputStream

object StickerPackValidator {
    private const val STATIC_STICKER_FILE_LIMIT_KB = 100
    private const val ANIMATED_STICKER_FILE_LIMIT_KB = 500
    private const val TRAY_IMAGE_FILE_SIZE_MAX_KB = 50
    private const val STICKER_SIZE_PIXELS = 512
    private const val TRAY_IMAGE_SIZE_PIXELS = 96
    private const val CHAR_LIMIT = 128

    fun verifyPackMetadata(packName: String, publisher: String, identifier: String): List<String> {
        val errors = mutableListOf<String>()
        if (identifier.isBlank()) errors.add("Pack identifier cannot be empty")
        if (packName.isBlank()) errors.add("Pack name cannot be empty")
        if (packName.length > CHAR_LIMIT) errors.add("Pack name exceeds $CHAR_LIMIT characters")
        if (publisher.isBlank()) errors.add("Publisher cannot be empty")
        if (publisher.length > CHAR_LIMIT) errors.add("Publisher exceeds $CHAR_LIMIT characters")
        return errors
    }

    fun verifyStickerFile(file: File, isAnimated: Boolean): List<String> {
        val errors = mutableListOf<String>()
        val fileSizeKb = file.length() / 1024
        val maxKb = if (isAnimated) ANIMATED_STICKER_FILE_LIMIT_KB else STATIC_STICKER_FILE_LIMIT_KB

        if (fileSizeKb > maxKb) {
            errors.add("Sticker ${file.name} size (${fileSizeKb}KB) exceeds limit of ${maxKb}KB")
        }

        if (!isAnimated) {
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeStream(FileInputStream(file), null, options)
            if (options.outWidth != STICKER_SIZE_PIXELS || options.outHeight != STICKER_SIZE_PIXELS) {
                errors.add("Sticker ${file.name} dimensions must be ${STICKER_SIZE_PIXELS}x${STICKER_SIZE_PIXELS} (found ${options.outWidth}x${options.outHeight})")
            }
        }
        return errors
    }

    fun verifyTrayIcon(file: File): List<String> {
        val errors = mutableListOf<String>()
        val fileSizeKb = file.length() / 1024
        if (fileSizeKb > TRAY_IMAGE_FILE_SIZE_MAX_KB) {
            errors.add("Tray icon (${fileSizeKb}KB) exceeds limit of ${TRAY_IMAGE_FILE_SIZE_MAX_KB}KB")
        }
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeStream(FileInputStream(file), null, options)
        if (options.outWidth != TRAY_IMAGE_SIZE_PIXELS || options.outHeight != TRAY_IMAGE_SIZE_PIXELS) {
            errors.add("Tray icon dimensions must be ${TRAY_IMAGE_SIZE_PIXELS}x${TRAY_IMAGE_SIZE_PIXELS} (found ${options.outWidth}x${options.outHeight})")
        }
        return errors
    }
}
