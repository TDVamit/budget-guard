# Design

<!-- impeccable:design-schema 1 -->

## World

Minimal on true black. Superseded glass, which — like the neumorphism before
it — did not land on device. The panel disappears into an OLED black ground and
only the data is lit. A surface is a hairline and a near-black fill, never a
shadow or a translucency.

The interface itself is monochrome, which is what lets the few coloured things
carry real weight: on this ground a green figure or a red day reads instantly
because nothing else competes for attention.

## Ground and light

- `background` — `#000000` (true black, real OLED pixels off), `#FFFFFF` light.
- `surface` — `#0E0E0E` / `#FFFFFF`; `border` — a hairline at 14% white / 12%
  black. These two do all the separating.
- No shadows, no gradients, no translucency. `track` `#242424` is the only
  mid-tone, for the grooves that bars and rings run in.

## Colour strategy

Monochrome chrome, functional colour. Surfaces, text, borders, buttons and the
FAB are black and white; hue appears only where it carries meaning, so when
something is coloured it means something.

Colour is spent on exactly two things:

- **Spend status.** Untouched stays neutral `#4A4A4A` so an unused category does
  not shout; then green `#3DDC84` on track, amber `#F5C24C` at 80–100%, red
  `#FF6B63` over. Light theme darkens the same ramp for contrast on white.
- **Direction of money.** Savings and under-budget days read green; overspend
  and negative balances read red.

Every coloured state also states its amount and a word (`over`, `left`,
`under`), so nothing depends on hue alone and the system stays usable for
colourblind users. All semantic tones clear 4.5:1 on both grounds — green
11.8:1, amber 12.7:1, red 7.5:1 on true black.

## Type

System stack, the workhorse register Operate wants. Hierarchy comes from weight
and size, never from a display face competing with the numerals.

- Money is the display voice: `display` 34/700 with `-0.5` tracking, tabular.
- `title` 20/700 · `body` 15/500 · `label` 13/600 · `caption` 12/500.
- Amounts always render through `MoneyText` so grouping and sign are consistent.

## Shape

Generous, continuous curvature — the panel is moulded, not cut.

- `card` 26 · `tile` 20 · `control` 16 · `pill` 999.
- Radii never mix within one composition; a raised card holds inset children of
  the next radius down.

## Components

- **Surface** — the single primitive: `raised` (a floating pane), `flat` (the
  same pane, denser, for lists and forms), `inset` (a recess). Everything else
  composes it, so the material is swappable in one file — which is how this
  world replaced the previous one without touching a screen.
- **PressableSurface** — a pane that presses into the light: its lift drops and a
  spring takes the scale down.
- **Ring** — circular progress, drawn as a recessed track with a lit arc.
- **AnimatedMoney** — money that counts to its value.

## Motion

Thesis: *the panel powers on, then responds to touch like a physical control.*

- **Focal moment (once per app open):** the dashboard boots — the hero amount
  counts up from zero while its bar fills, then tiles rise in a 45 ms stagger.
  Runs on cold start, never on every scroll.
- **Signature interaction:** press depresses the surface (raised → inset) with a
  spring, and releases back. Cause and result are unmistakable because the
  material itself moves.
- **Continuity:** category rings fill from zero to their ratio; calendar days
  cascade in cycle order; sections expand with height + fade.
- **Feedback:** 120 ms scale on tap; numbers re-count when data changes.
- Durations: 120 ms feedback, 240 ms state, 420 ms layout, 700 ms focal entrance.
  Ease-out `cubic-bezier(0.16, 1, 0.3, 1)` equivalent; no bounce by reflex.
- **Reduce motion:** Android's "Remove animations" is honoured via
  `AccessibilityInfo`. Values snap to their end state; opacity and colour
  feedback remain so nothing loses meaning.

## Widgets

The same world on an opaque true-black shell, so the widget stays legible over
any wallpaper. Depth is a slightly lifted `#0E0E0E`/`#141414` plane; the action
button is the one solid white block on the screen, and hue appears only on
status bars, day tints and money direction. Colours are
`#RRGGBBAA`: the widget library reads 8-digit hex alpha-last, and an alpha-first
literal silently renders as a different colour.
