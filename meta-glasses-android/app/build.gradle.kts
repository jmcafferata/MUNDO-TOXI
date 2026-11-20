plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "media.toxi.glasses"
    compileSdk = 35

    defaultConfig {
        applicationId = "media.toxi.glasses"
        minSdk = 29
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        // "0" is valid in Developer Mode. Use real credentials from the Wearables Developer Center for production.
        manifestPlaceholders["mwdat_application_id"] = "0"
        manifestPlaceholders["mwdat_client_token"] = "0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(libs.mwdat.core)
    implementation(libs.mwdat.camera)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.lifecycle.runtime)
}
