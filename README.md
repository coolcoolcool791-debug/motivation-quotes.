# ExamPredict AI

ExamPredict AI is a Kotlin Android app scaffold for predicting likely exam questions from uploaded syllabus files and previous year papers. It uses MVVM, Jetpack Compose Material 3, Firebase Authentication, Firebase Storage, Firebase Firestore, ML Kit OCR, PDFBox, and a Retrofit backend API integration.

## Folder structure

- `app/src/main/java/com/exampredict/ai/MainActivity.kt` - Compose host activity and app theme entry.
- `app/src/main/java/com/exampredict/ai/ExamPredictApp.kt` - application-level PDFBox initialization.
- `app/src/main/java/com/exampredict/ai/data/model` - prediction, upload, user, request, and response models.
- `app/src/main/java/com/exampredict/ai/data/remote` - Retrofit AI backend API client.
- `app/src/main/java/com/exampredict/ai/data/repository` - Firebase and backend integration gateway.
- `app/src/main/java/com/exampredict/ai/util` - OCR and PDF/text extraction utilities.
- `app/src/main/java/com/exampredict/ai/ui` - MVVM ViewModel, navigation graph, and Compose screens.
- `app/src/main/java/com/exampredict/ai/ui/theme` - Material theme and dark-mode support.

## Setup instructions

1. Open this folder in Android Studio Hedgehog or newer.
2. Create a Firebase project, add an Android app with package `com.exampredict.ai`, and download `google-services.json`.
3. Place `google-services.json` in the `app/` directory.
4. Enable Email/Password sign-in in Firebase Authentication.
5. Create Firebase Storage and Firestore databases with rules appropriate for authenticated users.
6. Replace `AI_API_BASE_URL` in `app/build.gradle.kts` with your backend URL. The app calls `POST /analyze`.
7. Implement the backend endpoint to accept `subject`, `examType`, `syllabusText`, and `pastPaperText`, then return predictions and a mock paper.
8. Sync Gradle and run the `app` configuration on an emulator or physical device.

## Backend contract

`POST /analyze`

Request:

```json
{
  "subject": "Physics",
  "examType": "SHORT",
  "syllabusText": "...",
  "pastPaperText": "..."
}
```

Response:

```json
{
  "predictions": [
    {
      "id": "q1",
      "question": "Explain Newton's laws with examples.",
      "subject": "Physics",
      "probability": "VERY_HIGH",
      "reason": "Repeated in 3 of 5 papers and central to syllabus unit 2.",
      "marks": 5,
      "examType": "SHORT"
    }
  ],
  "mockPaper": ["Q1. Explain Newton's laws with examples."]
}
```

If the backend is unavailable, the repository includes a deterministic fallback analyzer so the UI can still be demonstrated.
