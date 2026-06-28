package com.exampredict.ai.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.exampredict.ai.data.model.*
import com.exampredict.ai.data.repository.ExamRepository
import com.exampredict.ai.util.TextExtractor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class UiState(
    val loading: Boolean = false,
    val error: String? = null,
    val syllabusText: String = "",
    val pastPaperText: String = "",
    val subject: String = "General Studies",
    val examType: ExamType = ExamType.SHORT,
    val darkMode: Boolean = false,
    val run: PredictionRun? = null,
    val history: List<PredictionRun> = emptyList()
)

/** MVVM state holder for auth, uploads, OCR/PDF extraction, settings, and predictions. */
class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = ExamRepository()
    private val extractor = TextExtractor(application)
    private val _state = MutableStateFlow(UiState())
    val state = _state.asStateFlow()
    val isLoggedIn get() = repository.currentUser != null

    fun login(email: String, password: String, onSuccess: () -> Unit) = launchAuth { repository.login(email, password); onSuccess() }
    fun signup(email: String, password: String, onSuccess: () -> Unit) = launchAuth { repository.signup(email, password); onSuccess() }
    fun logout() { repository.logout() }
    fun setSubject(value: String) { _state.value = _state.value.copy(subject = value) }
    fun setExamType(value: ExamType) { _state.value = _state.value.copy(examType = value) }
    fun toggleDarkMode() { _state.value = _state.value.copy(darkMode = !_state.value.darkMode) }

    fun extract(uri: Uri, mimeType: String?, isSyllabus: Boolean) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { extractor.extract(uri, mimeType) }
            .onSuccess { text -> _state.value = if (isSyllabus) _state.value.copy(syllabusText = text, loading = false) else _state.value.copy(pastPaperText = text, loading = false) }
            .onFailure { _state.value = _state.value.copy(error = it.message, loading = false) }
    }

    fun predict(onDone: () -> Unit) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { repository.analyze(_state.value.subject, _state.value.examType, _state.value.syllabusText, _state.value.pastPaperText) }
            .onSuccess { _state.value = _state.value.copy(run = it, loading = false); onDone() }
            .onFailure { _state.value = _state.value.copy(error = it.message, loading = false) }
    }

    fun loadHistory() = viewModelScope.launch { _state.value = _state.value.copy(history = repository.history()) }

    private fun launchAuth(block: suspend () -> Unit) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { block() }.onFailure { _state.value = _state.value.copy(error = it.message) }
        _state.value = _state.value.copy(loading = false)
    }
}
