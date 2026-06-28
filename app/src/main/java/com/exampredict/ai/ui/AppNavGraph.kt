package com.exampredict.ai.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.exampredict.ai.data.model.ExamType
import com.exampredict.ai.data.model.Probability

@Composable
fun AppNavGraph(nav: NavHostController, vm: AppViewModel) {
    NavHost(nav, startDestination = "splash") {
        composable("splash") { Splash { nav.navigate(if (vm.isLoggedIn) "dashboard" else "login") { popUpTo("splash") { inclusive = true } } } }
        composable("login") { AuthScreen("Welcome back", "Login", { e, p -> vm.login(e, p) { nav.navigate("dashboard") } }, { nav.navigate("signup") }, vm) }
        composable("signup") { AuthScreen("Create account", "Sign up", { e, p -> vm.signup(e, p) { nav.navigate("dashboard") } }, { nav.navigate("login") }, vm) }
        composable("dashboard") { Dashboard(nav, vm) }
        composable("syllabus") { UploadScreen("Upload syllabus", true, nav, vm) }
        composable("papers") { UploadScreen("Upload past papers", false, nav, vm) }
        composable("results") { ResultsScreen(vm) }
        composable("settings") { SettingsScreen(nav, vm) }
    }
}

@Composable private fun Splash(next: () -> Unit) { LaunchedEffect(Unit) { kotlinx.coroutines.delay(900); next() }; CenterCard("ExamPredict AI", "AI-powered exam question prediction") }

@Composable private fun AuthScreen(title: String, action: String, submit: (String, String) -> Unit, switch: () -> Unit, vm: AppViewModel) {
    var email by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; val state by vm.state.collectAsState()
    ScreenScaffold(title) {
        OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(password, { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth())
        Button({ submit(email, password) }, Modifier.fillMaxWidth()) { Text(action) }
        TextButton(switch) { Text(if (action == "Login") "Need an account? Sign up" else "Already registered? Login") }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}

@Composable private fun Dashboard(nav: NavHostController, vm: AppViewModel) {
    val state by vm.state.collectAsState()
    ScreenScaffold("Dashboard") {
        Text("Predict likely exam questions from syllabus and previous papers.", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(state.subject, vm::setSubject, label = { Text("Subject filter") }, modifier = Modifier.fillMaxWidth())
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { ExamType.values().forEach { FilterChip(selected = state.examType == it, onClick = { vm.setExamType(it) }, label = { Text(it.name) }) } }
        ActionCard("Syllabus", "PDF, image, or text", Icons.Default.UploadFile) { nav.navigate("syllabus") }
        ActionCard("Past papers", "PDF or image question papers", Icons.Default.HistoryEdu) { nav.navigate("papers") }
        Button({ vm.predict { nav.navigate("results") } }, Modifier.fillMaxWidth(), enabled = state.syllabusText.isNotBlank()) { Text("Analyze & Predict") }
        OutlinedButton({ nav.navigate("settings") }, Modifier.fillMaxWidth()) { Text("Settings / Profile") }
    }
}

@Composable private fun UploadScreen(title: String, syllabus: Boolean, nav: NavHostController, vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let { vm.extract(it, context.contentResolver.getType(it), syllabus) }
    }
    ScreenScaffold(title) {
        Text("Choose a PDF, image, or text file. The app extracts text locally using PDFBox or ML Kit OCR before sending content to the AI backend.")
        Button({ picker.launch(arrayOf("application/pdf", "image/*", "text/plain")) }, Modifier.fillMaxWidth()) { Text("Select file") }
        ElevatedCard(Modifier.fillMaxWidth()) { Text(if (syllabus) state.syllabusText.ifBlank { "No syllabus extracted yet." } else state.pastPaperText.ifBlank { "No past paper extracted yet." }, Modifier.padding(16.dp)) }
        Button({ nav.popBackStack() }, Modifier.fillMaxWidth()) { Text("Done") }
    }
}

@Composable private fun ResultsScreen(vm: AppViewModel) {
    val run = vm.state.collectAsState().value.run
    ScreenScaffold("Prediction results") {
        Probability.values().forEach { probability ->
            Text(probability.name.replace('_', ' '), fontWeight = FontWeight.Bold)
            run?.predictions?.filter { it.probability == probability }?.forEach { p -> ElevatedCard(Modifier.fillMaxWidth().padding(vertical = 4.dp)) { Column(Modifier.padding(14.dp)) { Text(p.question, fontWeight = FontWeight.SemiBold); Text("${p.marks} marks • ${p.subject}"); Text(p.reason) } } }
        }
        Text("Mock question paper", fontWeight = FontWeight.Bold)
        run?.mockPaper?.forEach { Text(it) }
    }
}

@Composable private fun SettingsScreen(nav: NavHostController, vm: AppViewModel) {
    val state by vm.state.collectAsState(); LaunchedEffect(Unit) { vm.loadHistory() }
    ScreenScaffold("Settings") {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Dark mode"); Switch(state.darkMode, { vm.toggleDarkMode() }) }
        Text("Prediction history", fontWeight = FontWeight.Bold)
        LazyColumn { items(state.history) { Text("${it.subject} • ${it.examType} • ${it.predictions.size} predictions") } }
        Button({ vm.logout(); nav.navigate("login") }, Modifier.fillMaxWidth()) { Text("Logout") }
    }
}

@Composable private fun ScreenScaffold(title: String, content: @Composable ColumnScope.() -> Unit) { Surface(Modifier.fillMaxSize()) { Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) { Text(title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold); content() } } }
@Composable private fun CenterCard(title: String, subtitle: String) { ScreenScaffold(title) { Text(subtitle); LinearProgressIndicator(Modifier.fillMaxWidth()) } }
@Composable private fun ActionCard(title: String, subtitle: String, icon: androidx.compose.ui.graphics.vector.ImageVector, click: () -> Unit) { ElevatedCard(onClick = click, modifier = Modifier.fillMaxWidth()) { Row(Modifier.padding(18.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) { Icon(icon, null); Column { Text(title, fontWeight = FontWeight.Bold); Text(subtitle) } } } }
