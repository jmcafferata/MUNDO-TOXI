plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "media.toxi.radio"
    compileSdk = 34

    defaultConfig {
        applicationId = "media.toxi.radio"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        // Default Media Receiver is the most broadly compatible option.
        buildConfigField("String", "CAST_APP_ID", "\"CC1AD845\"")
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("KEYSTORE_PATH") ?: (project.findProperty("RELEASE_STORE_FILE") as? String) ?: "keystore.jks"
            storeFile = file(keystorePath)
            storePassword = System.getenv("KEYSTORE_PASSWORD") ?: (project.findProperty("RELEASE_STORE_PASSWORD") as? String) ?: ""
            keyAlias = System.getenv("KEY_ALIAS") ?: (project.findProperty("RELEASE_KEY_ALIAS") as? String) ?: "key0"
            keyPassword = System.getenv("KEY_PASSWORD") ?: (project.findProperty("RELEASE_KEY_PASSWORD") as? String) ?: ""
        }
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.media3.exoplayer)
    implementation(libs.media3.exoplayer.hls)
    implementation(libs.media3.ui)
    implementation(libs.media3.cast)
    implementation(libs.cast.framework)
    implementation(libs.androidx.mediarouter)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
