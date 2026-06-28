package com.exampredict.ai

import android.app.Application
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader

/** Application entry point used to initialise PDF parsing resources. */
class ExamPredictApp : Application() {
    override fun onCreate() {
        super.onCreate()
        PDFBoxResourceLoader.init(applicationContext)
    }
}
