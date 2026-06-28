package com.exampredict.ai.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

@Composable
fun ExamPredictTheme(darkMode: Boolean, content: @Composable () -> Unit) {
    val colors = if (darkMode) darkColorScheme() else lightColorScheme()
    MaterialTheme(colorScheme = colors, typography = androidx.compose.material3.Typography(), content = content)
}
