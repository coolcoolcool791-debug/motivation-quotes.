package com.exampredict.ai.data.model

import java.util.UUID

enum class Probability { VERY_HIGH, MEDIUM, LOW }
enum class ExamType { MCQ, SHORT, LONG }

data class UserProfile(val uid: String = "", val email: String = "", val displayName: String = "")
data class UploadedDocument(val uri: String, val name: String, val mimeType: String, val extractedText: String = "")
data class Prediction(
    val id: String = UUID.randomUUID().toString(),
    val question: String = "",
    val subject: String = "General",
    val probability: Probability = Probability.MEDIUM,
    val reason: String = "",
    val marks: Int = 0,
    val examType: ExamType = ExamType.SHORT
)
data class PredictionRun(
    val id: String = UUID.randomUUID().toString(),
    val subject: String = "General",
    val examType: ExamType = ExamType.SHORT,
    val predictions: List<Prediction> = emptyList(),
    val mockPaper: List<String> = emptyList(),
    val createdAt: Long = System.currentTimeMillis()
)
data class AnalysisRequest(val subject: String, val examType: String, val syllabusText: String, val pastPaperText: String)
data class AnalysisResponse(val predictions: List<Prediction>, val mockPaper: List<String>)
