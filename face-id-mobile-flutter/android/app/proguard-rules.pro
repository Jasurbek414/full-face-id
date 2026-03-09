# Flutter Wrapper
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep camera plugin
-keep class androidx.camera.** { *; }

# Keep biometrics
-keep class androidx.biometric.** { *; }

# Keep secure storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# Keep geolocator
-keep class com.baseflow.geolocator.** { *; }

# Dio / OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
