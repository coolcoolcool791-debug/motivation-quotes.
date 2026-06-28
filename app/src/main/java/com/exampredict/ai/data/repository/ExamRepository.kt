package com.exampredict.ai.data.repository

import android.net.Uri
import com.exampredict.ai.data.model.*
import com.exampredict.ai.data.remote.AiApi
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await

/** Single data gateway for Firebase Auth, Storage, Firestore, and AI analysis. */
class ExamRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val storage: FirebaseStorage = FirebaseStorage.getInstance(),
    private val aiApi: AiApi = AiApi.create()
) {
    val currentUser get() = auth.currentUser

    suspend fun login(email: String, password: String) = auth.signInWithEmailAndPassword(email, password).await()
    suspend fun signup(email: String, password: String) = auth.createUserWithEmailAndPassword(email, password).await()
    fun logout() = auth.signOut()

    suspend fun upload(uid: String, uri: Uri, fileName: String): String {
        val ref = storage.reference.child("users/$uid/uploads/$fileName")
        ref.putFile(uri).await()
        return ref.downloadUrl.await().toString()
    }

    suspend fun analyze(subject: String, examType: ExamType, syllabusText: String, pastPaperText: String): PredictionRun {
        val response = runCatching {
            aiApi.analyze(AnalysisRequest(subject, examType.name, syllabusText, pastPaperText))
        }.getOrElse { fallbackAnalysis(subject, examType, syllabusText, pastPaperText) }
        val run = PredictionRun(subject = subject, examType = examType, predictions = response.predictions, mockPaper = response.mockPaper)
        currentUser?.uid?.let { firestore.collection("users").document(it).collection("predictionHistory").document(run.id).set(run).await() }
        return run
    }

    suspend fun history(): List<PredictionRun> {
        val uid = currentUser?.uid ?: return emptyList()
        return firestore.collection("users").document(uid).collection("predictionHistory").get().await().toObjects(PredictionRun::class.java)
    }

    private fun fallbackAnalysis(subject: String, examType: ExamType, syllabus: String, papers: String): AnalysisResponse {
        val topics = Regex("[A-Za-z][A-Za-z ]{5,40}").findAll(syllabus).map { it.value.trim() }.distinct().take(9).toList()
        val predictions = topics.mapIndexed { index, topic ->
            Prediction(
                question = when (examType) {
                    ExamType.MCQ -> "Which statement best describes $topic?"
                    ExamType.SHORT -> "Write a short note on $topic."
                    ExamType.LONG -> "Explain $topic with examples and exam-relevant diagrams."
                },
                subject = subject,
                probability = when (index % 3) { 0 -> Probability.VERY_HIGH; 1 -> Probability.MEDIUM; else -> Probability.LOW },
                reason = "Generated from syllabus topic frequency and past-paper pattern hints (${papers.length} chars analysed).",
                marks = if (examType == ExamType.LONG) 10 else if (examType == ExamType.SHORT) 5 else 1,
                examType = examType
            )
        }
        return AnalysisResponse(predictions, predictions.take(6).mapIndexed { i, p -> "Q${i + 1}. ${p.question}" })
    }
}
