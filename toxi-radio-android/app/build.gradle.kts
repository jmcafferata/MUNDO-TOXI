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
            storeFile = file("C:/Users/JM/toxi tv.jks")
            storePassword = "tT16033544!"
            keyAlias = "key0"
            keyPassword = "tT16033544!"
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
