# EcoGiro - Configuración Capacitor para Android/iOS

Esta guía explica cómo compilar la app como aplicación nativa para Android e iOS.

## 📱 Configuración de Íconos y Splash Screen

### Requisitos de Assets

Crea los siguientes archivos en una carpeta `resources/` en la raíz:

```
resources/
├── icon.png              # 1024x1024 px (ícono de la app)
├── icon-foreground.png   # 1024x1024 px (para íconos adaptativos Android)
├── icon-background.png   # 1024x1024 px (fondo para íconos adaptativos)
└── splash.png            # 2732x2732 px (splash screen, centrado)
```

### Generar Assets Automáticamente (Recomendado)

1. Instala la herramienta de assets:
```bash
npm install -g @capacitor/assets
```

2. Genera todos los íconos y splash screens:
```bash
npx capacitor-assets generate
```

Esto creará automáticamente todos los tamaños necesarios para Android e iOS.

### Configuración Manual (Alternativa)

#### Android - Íconos
Coloca los íconos en `android/app/src/main/res/`:
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

#### Android - Splash Screen
El splash se configura en `capacitor.config.ts` (ya configurado con color verde #22C55E).
Para imagen personalizada, coloca `splash.png` en `android/app/src/main/res/drawable/`.

#### iOS - Íconos
1. Abre `ios/App/App.xcworkspace` en Xcode
2. Navega a Assets.xcassets → AppIcon
3. Arrastra los íconos a cada slot según el tamaño requerido

#### iOS - Splash Screen
En Xcode, edita `LaunchScreen.storyboard` o usa el color de fondo configurado en `capacitor.config.ts`.

---

## 📋 Requisitos Previos

### Para Android:
- [Android Studio](https://developer.android.com/studio) instalado
- Java Development Kit (JDK) 17+
- Android SDK con API Level 33+

### Para iOS (solo Mac):
- macOS con [Xcode](https://developer.apple.com/xcode/) instalado
- Xcode Command Line Tools
- CocoaPods (`sudo gem install cocoapods`)

## 🚀 Configuración Inicial

### 1. Clonar el proyecto desde GitHub

```bash
# Exporta tu proyecto a GitHub desde Lovable (botón "Export to GitHub")
git clone https://github.com/tu-usuario/plastic-payoff.git
cd plastic-payoff
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Agregar plataformas nativas

```bash
# Para Android
npx cap add android

# Para iOS (solo Mac)
npx cap add ios
```

### 4. Compilar el proyecto web

```bash
npm run build
```

### 5. Sincronizar con las plataformas nativas

```bash
npx cap sync
```

## 📱 Desarrollo con Hot-Reload

Para desarrollo, puedes usar hot-reload desde Lovable:

1. Edita `capacitor.config.ts` y descomenta las líneas de `server`:

```typescript
server: {
  url: 'https://1099b9a7-8ec7-42a1-b567-11154e5aae82.lovableproject.com?forceHideBadge=true',
  cleartext: true,
}
```

2. Sincroniza y ejecuta:

```bash
npx cap sync
npx cap run android  # o: npx cap run ios
```

Los cambios en Lovable se reflejarán instantáneamente en la app.

## 🏗️ Generar APK/AAB para Android

### Opción A: APK de Debug (para pruebas)

```bash
# Compilar y sincronizar
npm run build
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

En Android Studio:
1. Menú: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Opción B: AAB de Release (para Play Store)

1. **Generar Keystore** (solo una vez):

```bash
keytool -genkey -v -keystore ecogiro-release.keystore -alias ecogiro -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configurar signing** en `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('ecogiro-release.keystore')
            storePassword 'tu_password'
            keyAlias 'ecogiro'
            keyPassword 'tu_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Generar AAB**:

En Android Studio:
- Menú: **Build → Generate Signed Bundle / APK**
- Selecciona **Android App Bundle**
- Sigue el asistente con tu keystore

El AAB estará en: `android/app/build/outputs/bundle/release/app-release.aab`

## 🍎 Generar para iOS (solo Mac)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

En Xcode:
1. Selecciona tu dispositivo o simulador
2. **Product → Archive** para generar el build de distribución
3. **Window → Organizer** para subir a App Store Connect

## 📦 Plugins de Capacitor Incluidos

### Camera (`@capacitor/camera`)
Ya configurado y listo para usar. El código en `src/lib/camera.ts` proporciona:

```typescript
import { takePhoto, pickFromGallery } from '@/lib/camera';

// Tomar foto
const photo = await takePhoto();
if (photo) {
  console.log(photo.dataUrl); // Base64 data URL
}

// Seleccionar de galería
const image = await pickFromGallery();
```

### Plugins Recomendados para Agregar

```bash
# Almacenamiento local persistente
npm install @capacitor/preferences

# Información del dispositivo
npm install @capacitor/device

# Haptic feedback (vibración)
npm install @capacitor/haptics

# Push notifications
npm install @capacitor/push-notifications

# Compartir contenido
npm install @capacitor/share

# Geolocalización
npm install @capacitor/geolocation
```

## 🔧 Detección de Plataforma

Usa las utilidades en `src/lib/platform.ts`:

```typescript
import { isNative, isAndroid, isIOS, isWeb } from '@/lib/platform';

if (isNative()) {
  // Código solo para apps nativas
}

if (isAndroid()) {
  // Código específico de Android
}

if (isWeb()) {
  // Código solo para web
}
```

## 🛠️ Comandos Útiles

```bash
# Compilar web
npm run build

# Sincronizar cambios a plataformas nativas
npx cap sync

# Abrir proyecto en Android Studio
npx cap open android

# Abrir proyecto en Xcode
npx cap open ios

# Ejecutar en dispositivo/emulador conectado
npx cap run android
npx cap run ios

# Ver logs de la app
npx cap run android --target=<device_id> -l
```

## ⚠️ Solución de Problemas

### Error: "Unable to find Android SDK"
Asegúrate de que `ANDROID_HOME` esté configurado:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Error: "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### La cámara no funciona en Android
Verifica que los permisos estén en `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Hot-reload no funciona
1. Asegúrate de que el dispositivo esté en la misma red WiFi
2. Verifica que la URL en `capacitor.config.ts` sea correcta
3. Prueba con `cleartext: true` para conexiones HTTP

## 📄 Estructura del Proyecto

```
plastic-payoff/
├── android/                 # Proyecto Android Studio (generado)
├── ios/                     # Proyecto Xcode (generado)
├── src/
│   ├── lib/
│   │   ├── platform.ts     # Detección de plataforma
│   │   ├── camera.ts       # Utilidades de cámara
│   │   └── utils.ts        # Utilidades generales
│   └── ...
├── capacitor.config.ts     # Configuración de Capacitor
└── CAPACITOR_README.md     # Esta guía
```

## 🎯 Checklist de Producción

- [ ] Cambiar `appId` en `capacitor.config.ts` por uno propio
- [ ] Configurar ícono de la app (usar [Capacitor Assets](https://github.com/ionic-team/capacitor-assets))
- [ ] Configurar splash screen
- [ ] Generar keystore de producción (Android)
- [ ] Configurar signing en Xcode (iOS)
- [ ] Remover la URL de desarrollo de `capacitor.config.ts`
- [ ] Probar en dispositivos reales
- [ ] Optimizar permisos (solo pedir los necesarios)

---

📚 **Documentación oficial**: https://capacitorjs.com/docs
