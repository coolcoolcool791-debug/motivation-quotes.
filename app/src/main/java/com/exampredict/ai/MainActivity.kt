package com.exampredict.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.exampredict.ai.ui.AppNavGraph
import com.exampredict.ai.ui.AppViewModel
import com.exampredict.ai.ui.theme.ExamPredictTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val vm: AppViewModel = viewModel()
            val state = vm.state.collectAsState()
            ExamPredictTheme(state.value.darkMode) {
                AppNavGraph(rememberNavController(), vm)
            }
        }
    }
}
