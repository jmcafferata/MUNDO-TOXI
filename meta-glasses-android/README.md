# Meta Glasses (minimal)

Tiny Android app built on the Meta Wearables Device Access Toolkit (`mwdat` 1.0.1). It registers with the Meta AI app, connects to Ray-Ban/Oakley Meta glasses, streams the camera and shows a photo captured from the glasses.

## Requirements
- Android Studio (open this folder), Android 10+ phone, Meta AI app installed
- Glasses paired in Meta AI, with **Developer Mode** on (Settings > App Info > tap version 5 times)

## Run
1. Open `meta-glasses-android` in Android Studio and run on the phone (or `./gradlew installDebug`).
2. Tap **Register with Meta AI**, accept in Meta AI.
3. Tap **Connect glasses** and grant the camera permission.
4. Tap **Take photo** — the picture appears in the app.

`mwdat_application_id` / `mwdat_client_token` are `"0"` in `app/build.gradle.kts` (Developer Mode only).
