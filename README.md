# doozi-apk

Seller Admin Mobile (Android APK) — React Native / Expo app for Doozi.

## Setup

```bash
npm install
cp .env.example .env
# Edit EXPO_PUBLIC_API_URL if needed (default: https://api.doozi.bd)
```

## Run

```bash
npm start
npm run android
```

## Build APK (EAS)

```bash
npx eas-cli login
npx eas build -p android --profile preview    # internal APK
npx eas build -p android --profile production # release APK
```

## Env

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_APP_NAME` | App display name |
| `EXPO_PUBLIC_APP_VERSION` | App version string |

## Structure

```
src/
├── app/           # Expo Router
├── components/    # Shared UI
├── hooks/         # Global hooks
├── lib/           # config, print, storage
├── utils/
├── contexts/      # Auth, Realtime
└── types/
```
