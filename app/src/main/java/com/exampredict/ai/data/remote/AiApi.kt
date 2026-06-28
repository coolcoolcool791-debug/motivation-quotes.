package com.exampredict.ai.data.remote

import com.exampredict.ai.BuildConfig
import com.exampredict.ai.data.model.AnalysisRequest
import com.exampredict.ai.data.model.AnalysisResponse
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

/** Retrofit contract for your AI backend. Implement POST /analyze on the server. */
interface AiApi {
    @POST("analyze")
    suspend fun analyze(@Body request: AnalysisRequest): AnalysisResponse

    companion object {
        fun create(): AiApi {
            val client = OkHttpClient.Builder()
                .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
                .build()
            return Retrofit.Builder()
                .baseUrl(BuildConfig.AI_API_BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(AiApi::class.java)
        }
    }
}
