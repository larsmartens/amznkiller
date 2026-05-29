<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/banner_dark.png">
    <img src="assets/banner_light.png" alt="AmznKiller" width="520">
  </picture>
</h1>

## Fork Changes

This fork tracks `hxreborn/amznkiller` and keeps a fork-specific layer on top:

- the active public fork, release links, selector feed, and companion app links point at `larsmartens/amznkiller`
- advanced chart work is carried on top of upstream, including Keepa overlay mode and custom interactive chart rendering
- a scheduled workflow merges upstream `main` into this fork daily and rebuilds when upstream changed
- release and CI artifacts are published from the fork so local installs can stay aligned with the fork branch

Xposed module built on the modern LSPosed API that hides ads and sponsored content inside the Amazon Android app.

<p align="center">
  <a href="https://developer.android.com"><img src="https://img.shields.io/badge/Android-10+-3DDC84?style=flat&logo=android&logoColor=white" alt="Android 10+" /></a>
  <img src="https://img.shields.io/badge/LSPosed_API-101-8F00FF?style=flat" alt="LSPosed API 101" />
  <a href="https://kotlinlang.org"><img src="https://img.shields.io/badge/Kotlin-2.3.10-7F52FF?style=flat&logo=kotlin&logoColor=white" alt="Kotlin" /></a>
  <a href="https://developer.android.com/compose"><img src="https://img.shields.io/badge/Compose_BOM-2026.01.01-4285F4?style=flat&logo=jetpackcompose&logoColor=white" alt="Compose BOM" /></a>
  <a href="https://gradle.org"><img src="https://img.shields.io/badge/Gradle-9.4-02303A?style=flat&logo=gradle&logoColor=white" alt="Gradle" /></a>
  <a href="https://developer.android.com/build"><img src="https://img.shields.io/badge/AGP-9.1.0-02303A?style=flat&logo=android&logoColor=white" alt="AGP" /></a>
</p>

<p align="center">
  <a href="https://github.com/larsmartens/amznkiller/actions/workflows/android-ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/larsmartens/amznkiller/android-ci.yml?label=build&style=flat&logo=githubactions&logoColor=white" alt="Build" /></a>
  <a href="https://github.com/larsmartens/amznkiller/actions/workflows/update-selectors.yml"><img src="https://img.shields.io/github/actions/workflow/status/larsmartens/amznkiller/update-selectors.yml?label=selector%20sync&style=flat&logo=githubactions&logoColor=white" alt="Selector Sync" /></a>
  <a href="https://github.com/larsmartens/amznkiller/actions/workflows/validate-selectors.yml"><img src="https://img.shields.io/github/actions/workflow/status/larsmartens/amznkiller/validate-selectors.yml?label=validate&style=flat&logo=githubactions&logoColor=white" alt="Selector Validate" /></a>
</p>

<p align="center">
  <a href="https://github.com/larsmartens/amznkiller/releases/latest"><img src="https://img.shields.io/github/v/release/larsmartens/amznkiller?style=flat&logo=github" alt="Release" /></a>
  <a href="https://github.com/larsmartens/amznkiller/releases"><img src="https://img.shields.io/github/downloads/larsmartens/amznkiller/total?style=flat&logo=github" alt="Downloads" /></a>
  <a href="https://github.com/Xposed-Modules-Repo/eu.hxreborn.amznkiller/releases/latest"><img src="https://img.shields.io/github/v/release/Xposed-Modules-Repo/eu.hxreborn.amznkiller?label=xposed%20repo&style=flat&logo=xdadevelopers" alt="Xposed Repo" /></a>
  <a href="https://github.com/Xposed-Modules-Repo/eu.hxreborn.amznkiller/releases"><img src="https://img.shields.io/github/downloads/Xposed-Modules-Repo/eu.hxreborn.amznkiller/total?label=xposed%20downloads&style=flat&logo=xdadevelopers" alt="Xposed Downloads" /></a>
</p>

<p align="center">
  <a href="https://github.com/larsmartens/amznkiller/stargazers"><img src="https://img.shields.io/github/stars/larsmartens/amznkiller?style=flat&logo=github" alt="Stars" /></a>
  <a href="https://github.com/larsmartens/amznkiller/issues"><img src="https://img.shields.io/github/issues/larsmartens/amznkiller?style=flat&logo=github" alt="Issues" /></a>
  <a href="https://github.com/larsmartens/amznkiller/issues?q=is%3Aissue+is%3Aclosed"><img src="https://img.shields.io/github/issues-closed/larsmartens/amznkiller?style=flat&logo=github" alt="Closed Issues" /></a>
  <a href="https://github.com/larsmartens/amznkiller/commits/main"><img src="https://img.shields.io/github/last-commit/larsmartens/amznkiller?style=flat&logo=github" alt="Last Commit" /></a>
  <a href="https://github.com/larsmartens/amznkiller/blob/main/LICENSE"><img src="https://img.shields.io/github/license/larsmartens/amznkiller?style=flat&logo=gnu" alt="License" /></a>
</p>

## Features

- Strips sponsored cards, video carousels, and ad slots from the Amazon app
- Bundled selector list with remote sync, custom URL, and CSS-injection sanitization
- Price history charts on product pages via Keepa and CamelCamelCamel (US, UK, DE, FR, JP, CA, IT, ES, IN, MX, BR, AU)
- Optional Force Dark for the Amazon UI (experimental, see [below](#force-dark))
- Material 3 Expressive settings UI in Jetpack Compose
- Free and open source (FOSS)

## Requirements

- Android 10 (API 29) or higher
- LSPosed Manager with libxposed API 101 support
- Amazon Shopping (`com.amazon.mShop.android.shopping`)

## Install

1. Grab the APK:

    <a href="../../releases"><img src="https://github.com/user-attachments/assets/d18f850c-e4d2-4e00-8b03-3b0e87e90954" height="60" alt="Get it on GitHub" /></a>
    <a href="http://apps.obtainium.imranr.dev/redirect.html?r=obtainium://app/%7B%22id%22%3A%22eu.hxreborn.amznkiller%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2Flarsmartens%2Famznkiller%22%2C%22author%22%3A%22larsmartens%22%2C%22name%22%3A%22AmznKiller%22%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%7D%22%7D"><img src="https://github.com/user-attachments/assets/dffe8fb9-c0d1-470b-8d69-6d5b38a8aa2d" height="60" alt="Get it on Obtainium" /></a>

2. Enable the module in LSPosed and scope it to `com.amazon.mShop.android.shopping`.
3. Open the AmznKiller app to confirm the module is active and refresh selectors.
4. Force-stop Amazon Shopping and relaunch.

## Screenshots

Search query: _"macbook air m1 16gb 512"_

| Stock (2 real results, rest are ads) | Patched |
| --- | --- |
| <img src="https://github.com/user-attachments/assets/4c2fb092-0e63-4a34-b9ba-afe1a4028b09" width="280" alt="Stock Amazon app" /> | <img src="https://github.com/user-attachments/assets/135e1fec-b0e9-4dc1-9d58-49fabd825262" width="280" alt="Patched Amazon app" /> |

| Force Dark | Price History |
| --- | --- |
| <img src="https://github.com/user-attachments/assets/f24a9ac7-126e-4eff-b5e7-d3b8cc652158" width="280" alt="Force Dark mode" /> | <img src="https://github.com/user-attachments/assets/fbebb479-8bdc-4395-b531-318ac07a68c9" width="280" alt="Price history charts" /> |

| Dashboard | Selectors | Settings | Settings (bottom) |
| --- | --- | --- | --- |
| <img src="https://github.com/user-attachments/assets/d875c580-d81c-4be7-a857-98bc13656432" width="180" /> | <img src="https://github.com/user-attachments/assets/88a5aeee-8184-41c6-bf0a-e4d1fb3c1b13" width="180" /> | <img src="https://github.com/user-attachments/assets/cb69012d-94a0-4ca9-b6d7-9cd97cd5c580" width="180" /> | <img src="https://github.com/user-attachments/assets/a374ccec-9dce-4538-bdad-e89c15e24307" width="180" /> |

## Force Dark

Amazon disables Android force dark via `forceDarkAllowed=false` in its theme. The module hooks `ViewRootImpl.determineForceDarkType` and forces the return to `FORCE_DARK_ALWAYS`, triggering GPU-level darkening across native views and WebViews. Extra hooks paint window backgrounds dark and block white-flash on WebView load. `DarkModeInjector` ships CSS overrides for elements the algorithm gets wrong.

`determineForceDarkType` was introduced in Android 15 (API 35). On Android 10-14 the primary hook does not apply. A fallback on `HardwareRenderer.setForceDark` is attempted but Amazon's theme opt-out blocks darkening on those versions.

Disabled by default. Enable in settings if on Android 15+.

## Troubleshooting

1. Confirm the module is enabled in LSPosed and scoped to Amazon Shopping.
2. Force stop Amazon Shopping and reopen.
3. Check the AmznKiller dashboard: Xposed must be active and selector count above 0.
4. Tap refresh. If it fails, reset the selector URL in settings.
5. If pages render broken, disable CSS injection, refresh selectors, then re-enable.

This is cosmetic blocking only. Network requests still happen. Pair with DNS-based blockers (AdGuard, NextDNS, Pi-hole) for full coverage.

## Build

```bash
git clone --recurse-submodules https://github.com/larsmartens/amznkiller.git
cd amznkiller
./gradlew :app:assembleDebug
```

Requires JDK 21 and Android SDK. Configure `local.properties`:

```properties
sdk.dir=/path/to/android/sdk

# Optional: release signing
RELEASE_STORE_FILE=<path/to/keystore.jks>
RELEASE_STORE_PASSWORD=<store_password>
RELEASE_KEY_ALIAS=<key_alias>
RELEASE_KEY_PASSWORD=<key_password>
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines on pull requests, code style, and commit conventions.

For bugs or feature requests, [open an issue](https://github.com/larsmartens/amznkiller/issues/new/choose).

## License

<a href="LICENSE"><img src="https://github.com/user-attachments/assets/b211cf0d-e255-421c-9213-6b6258676013" height="90" alt="GPLv3"></a>

GPL v3.0. See [LICENSE](LICENSE).
