# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Primary user is the owner, an individual in India managing personal money on an
Android phone. Built for personal use now, with a public release intended later,
so the quality bar is "shippable": accessible contrast, real empty states, and
edge cases handled — but no features invented for hypothetical users.

The usage scene is glanceable and repeated: several times a day, one-handed,
often from the home screen widget rather than the app, to answer "can I spend
this?" before paying. Money arrives as UPI and bank notifications, so the app is
frequently opened straight after a payment.

## Product Purpose

BudgetGuard turns a monthly income into a daily spending allowance and tracks
whether the user is on pace. Success is the user knowing, in one glance, how much
they can spend today, and reaching the end of a cycle having saved at least their
reserved amount.

## Positioning

Budget accrues daily rather than unlocking in full on payday: the cycle's
discretionary budget is released day by day, unspent amounts roll forward, and
overspend is visible immediately as a negative day. Detection is on-device only —
payment notifications from Indian banking, UPI and mail apps are parsed locally
with deterministic regex, never uploaded, never sent to an LLM.

## Capabilities

- Cycle-based budgeting anchored to a salary day, with per-category allocation.
- "Others" is a system catch-all that absorbs whatever is unallocated; category
  allocation is capped so it can never go negative.
- Daily accrual and per-day saved/overspent history for the cycle.
- Automatic transaction detection from notifications (31 watched packages
  covering UPI wallets, Indian bank apps, SMS and Gmail), with a confidence
  score; below 0.85 lands in a review queue.
- Five home screen widgets: combined, categories, transactions, savings
  breakdown, daily pace calendar.
- Manual add/edit, recategorise, history by day/week/cycle, past cycles.

## Constraints

- Fully offline. No server, no account, no analytics, no network calls at all.
- React Native 0.87 (New Architecture, Hermes) + TypeScript; SQLite via
  op-sqlite; Kotlin for the notification listener and widget providers.
- Widgets render through react-native-android-widget, which maps to Android
  RemoteViews: no flex-wrap, no percentage sizing, integer-only flex weights,
  hex-only colours, and no runtime SVG tinting.
- Amounts are integer paise throughout; never floats.
- Currency is INR and copy is Indian English.

## Terminology

Cycle, reserved savings (the amount set aside), extra saved (unspent budget plus
ad-hoc income), projected savings, accrued (released so far this cycle),
Others (the system catch-all category), daily pace.

## Accessibility

Shippable bar: text meets normal contrast minimums against its own surface, tap
targets stay finger-sized, colour is never the only carrier of meaning (spend
status pairs colour with an explicit amount and label).
