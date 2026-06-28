package com.exampredict.ai.util

import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import kotlinx.coroutines.tasks.await

/** Extracts text from plain text files, PDFs, and images using ML Kit OCR. */
class TextExtractor(private val context: Context) {
    suspend fun extract(uri: Uri, mimeType: String?): String = when {
        mimeType == "text/plain" -> context.contentResolver.openInputStream(uri)?.bufferedReader()?.readText().orEmpty()
        mimeType?.contains("pdf") == true -> extractPdf(uri)
        mimeType?.startsWith("image") == true -> extractImage(uri)
        else -> ""
    }

    private fun extractPdf(uri: Uri): String = context.contentResolver.openInputStream(uri)?.use { input ->
        PDDocument.load(input).use { document -> PDFTextStripper().getText(document) }
    }.orEmpty()

    private suspend fun extractImage(uri: Uri): String {
        val bitmap = context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) } ?: return ""
        val image = InputImage.fromBitmap(bitmap, 0)
        return TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS).process(image).await().text
    }
}
