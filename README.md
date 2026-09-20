# BudgetGuard

BudgetGuard is an offline-first Android budgeting app that turns income, fixed costs, planned expenses, and savings goals into a daily spending allowance you can check in the app or from an Android home-screen widget.

## Highlights

- Salary-day or custom-date budget cycles with automatic rollover.
- Daily accrual, saved/overspent pace, category allowances, and a protected `Others` remainder category.
- Manual income, fixed-expense, planned-expense, and transaction tracking.
- On-device transaction detection from selected payment, banking, SMS, and mail notifications using deterministic Kotlin parsing; no LLM or server is involved.
- Five Android widgets: budget overview, categories, transactions, savings, and cycle calendar.
- Local SQLite persistence with integer paise arithmetic throughout.

## Architecture

```text
React Native / TypeScript screens
        -> Zustand store + selectors
        -> op-sqlite repositories + MMKV settings
        -> Android Kotlin notification listener and widget providers
```

The shared budgeting functions under [`src/budget/`](src/budget/) calculate accrual, allowances, savings, rollover, and widget snapshots. Native Android code writes detected transactions to the same local database and exposes widget/notification integration. Product and design decisions are documented in [`PRODUCT.md`](PRODUCT.md) and [`DESIGN.md`](DESIGN.md).

## Technology

React Native 0.87, React 19, TypeScript, React Navigation, Zustand, `op-sqlite`, MMKV, `date-fns`, `zod`, `react-native-android-widget`, Kotlin, Android widgets, Jest, and native Android/iOS project scaffolding.

## Development setup

Install Node.js `>=22.11.0`, Android Studio/SDK for Android development, and Ruby/CocoaPods for iOS development. Then:

```bash
npm install
npm start
```

In a second terminal, run one target:

```bash
npm run android
# or
bundle install && bundle exec pod install
npm run ios
```

Useful checks:

```bash
npm test
npm run lint
```

The notification listener is Android-specific. To enable automatic detection on a device, complete onboarding and grant BudgetGuard notification-listener access in Android settings; the app will only process packages selected in its watch list. iOS builds do not provide that Android listener behavior.

## Privacy and limitations

The intended product constraint is fully local: no account, server, analytics, or network-backed data sync. Android notification access is sensitive and should be granted only on a device you control. The repository contains development-only native assets and does not provide a signed release, store listing, CI/CD pipeline, or production distribution instructions.

## Current status

**Active early-stage product prototype.** The app has a broad implemented surface, native Android integrations, and unit tests for budgeting, parsing, and components. It remains pre-release: platform/device coverage, release signing, migration hardening, accessibility verification, and end-to-end testing still need to be completed before public distribution.
