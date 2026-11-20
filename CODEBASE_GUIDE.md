# CampusHub — Complete Codebase Guide

**Course:** CSE 326 · CA1 Project-Based Assessment
**Team:** Team Obsidian — Akshay R Pillai (12606521), Arshad Hasanulbanna (12610513), Rishabh Kumar (12612282)
**Stack:** HTML5, CSS3, vanilla JavaScript (ES6). No frameworks, no build step, no dependencies.

This document explains the whole project line by line: what each file contains, what every element and every function does, where it is used, and why it was written that way. Read it once fully, then use it as viva preparation.

---

## Table of contents

1. [How the three files fit together](#1-how-the-three-files-fit-together)
2. [The data model](#2-the-data-model)
3. [index.html — structure](#3-indexhtml--structure)
4. [style.css — the design system](#4-stylecss--the-design-system)
5. [style.css — layout and components](#5-stylecss--layout-and-components)
6. [style.css — responsive rules](#6-stylecss--responsive-rules)
7. [script.js — settings and state](#7-scriptjs--settings-and-state)
8. [script.js — every function explained](#8-scriptjs--every-function-explained)
9. [script.js — event listeners](#9-scriptjs--event-listeners)
10. [How a full user journey flows through the code](#10-how-a-full-user-journey-flows-through-the-code)
11. [Why each technical decision was made](#11-why-each-technical-decision-was-made)
12. [Design system reference](#12-design-system-reference)
13. [Where to find each requirement from the rubric](#13-where-to-find-each-requirement-from-the-rubric)
14. [Quick reference: element ID map](#14-quick-reference-element-id-map)
15. [Viva questions and answers](#15-viva-questions-and-answers)

---

## 1. How the three files fit together

The page is plain static HTML. There is no framework and no bundler, which is a deliberate choice: the browser can run `index.html` directly from disk with no installation.

```
index.html
  ├── <head>
  │     ├── fonts.googleapis.com  → DM Sans (body) + Manrope (headings)
  │     └── <link rel="stylesheet" href="style.css">   ← all styling
  └── <body>
        ├── static markup: header, hero, dashboard, explainer, form, filters, brief, footer, toast, modal
        ├── <div id="event-list">  ← empty on purpose; JS fills it
        └── <script src="script.js">  ← loads after the markup, so every element exists
```

Loading order matters. The script tag is the last thing in `<body>` (line 318 of `index.html`) because `script.js` immediately calls `document.getElementById` on line 66. If the script were in `<head>` without `defer`, every element lookup would return `null` and the page would break on load.

**The three-layer rule used throughout:**

| Layer | File | Responsibility |
|---|---|---|
| Structure | `index.html` | Semantic markup, labels, ARIA attributes, placeholder containers |
| Presentation | `style.css` | Colours, spacing, grid layout, responsive breakpoints |
| Behaviour | `script.js` | State, validation, rendering, persistence |

---

## 2. The data model

Every event is a plain JavaScript object stored in `localStorage` under the key `campusEvents`. This is the contract between all three files — if you understand this shape, you understand the app.

```js
{
  id: 'event-1731312000000-k3j9x2',   // unique string from makeId()
  title: 'Intro to Web Accessibility',
  category: 'Workshop',                // must be one of CATEGORIES
  date: '2026-11-18',                  // ISO date string, from <input type="date">
  time: '14:00',                       // 24-hour string, from <input type="time">
  venue: 'Library Seminar Room 2',
  capacity: 30,                        // Number, 1–1000
  description: 'A hands-on session...',
  registrations: [                     // always an array, never missing
    {
      id: 'event-...',
      name: 'Sample Student',
      studentId: 'S1001',
      email: 'sample@example.com',
      status: 'Confirmed'              // or 'Cancelled'
    }
  ]
}
```

**Key design point:** a registration is never deleted. Cancelling sets `status: 'Cancelled'`. That is why `confirmedCount()` filters on status instead of using `registrations.length`, and why `seatsLeft()` frees up the seat without losing the record.

---

## 3. index.html — structure

### 3.1 Head (lines 1–13)

| Line | Element | Purpose |
|---|---|---|
| 1 | `<!doctype html>` | Triggers standards mode so CSS behaves predictably |
| 2 | `<html lang="en">` | Screen readers announce the right language |
| 4 | `<meta charset="utf-8">` | Lets us use — and · and “ ” without mojibake |
| 5 | `<meta name="viewport">` | **Without this the phone layout never triggers** — the browser would render at desktop width and zoom out |
| 6 | `<meta name="theme-color" content="#12243a">` | Colours the mobile browser address bar to match the navy header |
| 7 | `<meta name="description">` | Text shown under the link in search results |
| 9–11 | Two `preconnect` links + Google Fonts stylesheet | Fonts load in parallel instead of serially; saves roughly one round trip |
| 12 | `<link rel="stylesheet" href="style.css">` | The only external stylesheet |

### 3.2 Header, navigation and hero (lines 16–37)

```html
<header class="site-header" id="page-top">
```

`id="page-top"` is the anchor target for the brand link and the footer brand, so clicking the logo scrolls to the absolute top.

**`.nav`** holds the brand and the link group.

- `<span class="brand-mark">C</span>` — a mint square with a "C". Pure decoration, but it gives the eye an anchor.
- `<span>Campus<span class="brand-light">Hub</span></span>` — the second span is mint, so "Hub" reads as a lighter weight against the navy.
- `<div class="nav-links">` — four anchor links: `#events`, `#dashboard`, `#how-it-works`, `#problem`. These are **fragment links**, not JavaScript routes: the browser jumps to the element with the matching `id` and `html { scroll-behavior: smooth }` (style.css line 27) animates the jump.

**`.hero`** contains:

- `<p class="hero-eyebrow">` — "CSE 326 · CA1 Problem-Statement Project · Team Obsidian". This is the line that tells an evaluator, in the first screen, exactly what they are looking at.
- `<h1>` with `<br>` — a hard line break so the headline sits on two lines at every width.
- `<div class="hero-actions">` with two buttons: a filled `.hero-button` to `#events` and a ghost `.hero-button-ghost` to `#how-it-works`.

### 3.3 Dashboard (lines 41–67)

```html
<section class="dashboard" id="dashboard" aria-labelledby="dashboard-heading">
```

- `aria-labelledby="dashboard-heading"` points at the `<h2>` inside, so a screen reader announces "Campus at a glance, region" instead of "region".
- `<dl class="stats">` is a **description list** — semantically correct for name/value pairs. Each stat is a `<div class="stat">` containing a `<dt>` (the label) and a `<dd>` (the number). This is the accessible markup for a key-value table; a plain grid of divs would be read as loose text.
- The four IDs `stat-total`, `stat-upcoming`, `stat-registrations`, `stat-seats` all start at `0` in HTML. `renderDashboard()` in script.js overwrites them on load. The zeros are a placeholder, not a bug.
- `<div class="capacity-bar" aria-hidden="true"><span id="stat-bar"></span></div>` — a 6px track with a green fill. `aria-hidden="true"` because the same information is already in the text below it; a screen reader should not hear an empty decorative div. The width of the inner span is set by JavaScript as a percentage.
- `<p class="note" id="stat-caption">` — a sentence generated by JS ("1% of 174 seats across upcoming events are already confirmed"). This is the part an evaluator reads to understand the number.

### 3.4 How it works (lines 69–93)

```html
<ol class="steps">
```

An **ordered list** rather than divs, because the order is the content: 01 problem framing, 02 seat integrity, 03 registration. Each `<li class="step">` has a `.step-num` (a decorative 01/02/03), an `<h3>` and a `<p>`.

This section exists specifically for the rubric line "Problem identification and motivation". An evaluator who reads only this section still understands the problem, the solution and the scope.

### 3.5 Event form — left column (lines 97–151)

```html
<form id="event-form" novalidate>
```

**`novalidate` is important.** It switches off the browser's own validation bubbles so that *our* JavaScript validation (`validateEvent()`) is the single source of truth. Without it, the browser would block submission before our code runs and our error messages under each field would never appear.

Every field follows the same three-part pattern:

```html
<div class="field wide">
  <label for="event-title">Event title</label>
  <input id="event-title" name="title" maxlength="80" placeholder="e.g. Design thinking workshop">
  <p class="error" id="error-title"></p>
</div>
```

- **`for="event-title"`** on the label matches the input's `id`. Clicking the label focuses the field; screen readers read the label when the field receives focus. Every single field does this.
- **`name="title"`** is what script.js reads via `form.elements.namedItem('title')`. Note the name (`title`) is *not* the same as the id (`event-title`). The `FIELDS` array in script.js lists the names.
- **`class="wide"`** makes the field span both columns of `.field-grid` (style.css line 523, `grid-column: 1 / -1`).
- **`maxlength="80"`** on title/venue and `maxlength="500"` on the textarea enforce a limit in the DOM, so the user cannot even type past it.
- **`<p class="error" id="error-title">`** is an empty paragraph reserved for the message. It has `min-height: 16px` in CSS so the layout does not jump when the text appears. Note the ID pattern: `error-` + the `name` attribute. `showErrors()` builds this ID dynamically.
- **`type="date"` / `type="time"` / `type="number"`** give native pickers and a numeric keypad on phones. For capacity, `min="1" max="1000"` is a hint to the picker; the real check is in `validateEvent()`.
- `<button class="btn primary" id="save-button" type="submit">Add event</button>` — its label is rewritten by JS to "Save changes" during an edit.
- `<button id="cancel-edit" type="button" hidden>` — `type="button"` so it never submits the form, and the `hidden` attribute (not CSS `display:none`) so it is genuinely out of the accessibility tree until needed. `resetForm()` sets `.hidden = true`.

### 3.6 Explore panel — right column (lines 153–186)

- `<h2 id="events-heading">` + `<span class="note" id="result-count" aria-live="polite">` — the count of matching events. `aria-live="polite"` makes a screen reader announce the new number every time the search changes, without interrupting.
- **`#search`** is `type="search"`, which gives a native clear button in most browsers. It has `aria-label="Search events"` because there is no visible label — a placeholder is not a substitute for a label.
- The two filter `<select>` elements are wrapped in `<label>` with a `<span class="sr-only">Filter category</span>`. The `sr-only` class (style.css line 65) hides text visually but keeps it for screen readers. This is why the filters can look bare and still be labelled.
- The first option in each filter has `value=""`, which JS treats as "no filter" — that empty string is the contract between the select and the `renderList()` conditions.
- **`<div id="event-list" class="event-list" aria-live="polite">`** is empty in the HTML. `script.js` fills it with cards via `list.innerHTML = ...`. The comment on line 184 says so explicitly.

### 3.7 Problem statement, team, technologies (lines 190–269)

This is the evaluator-facing section. Four `.brief-card` articles:

1. **The problem** — the motivation paragraph.
2. **Our objectives** — five `check-list` items.
3. **Outcomes** — five `check-list` items describing observable results.
4. **Technologies** — a `tech-list` where each `<li>` has a `<span>` (the technology name) and text (what it is used for). The span exists so the name can be aligned in a column and bolded without a table.

Then `<h3 class="team-heading" id="team-heading">` and a `.team-grid` of three `.member` articles. Each member shows name, registration number in a `<span>`, and three bullets — what they built and what their contribution was. `<code>` around `script.js` / `style.css` renders as monospace so a filename is visually distinct from prose.

Finally `.brief-links` with two anchors to the GitHub repo and the deployed site. Both use `target="_blank" rel="noopener"` — `noopener` prevents the new tab from accessing `window.opener`, which is a real (if minor) security concern with `target="_blank"`.

### 3.8 Footer (lines 272–281)

A flex row: brand + tagline on the left, course/stack note + "About this project" button on the right. The button is `type="button"` so it never submits anything, and `id="open-about"` is what script.js binds to.

### 3.9 Toast (line 284)

```html
<div id="message" class="toast" role="status" aria-live="polite" hidden></div>
```

- `role="status"` + `aria-live="polite"` — a screen reader announces the text when it appears.
- `hidden` initially — nothing to say on page load.
- **Why it uses `.textContent` and not `.innerHTML`:** script.js's `notify()` writes `message.textContent = text`. Using `textContent` means that even if an error string contained user input, it could never inject HTML. This is the safe way to write dynamic text into the DOM.

### 3.10 About dialog (lines 286–316)

```html
<div id="about-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="about-title" hidden>
```

- `role="dialog"` and `aria-modal="true"` tell assistive tech this is a modal overlay and the rest of the page is inert.
- `<button class="modal-backdrop" type="button" aria-label="Close dialog"></button>` — a full-screen invisible button behind the content. Clicking anywhere outside closes it. It is a real `<button>` (not a div) so keyboard and screen-reader users can reach and activate it.
- `<section class="modal-content">` is the visible panel. `aria-labelledby="about-title"` names the dialog from its `<h2>`.
- The `×` close button is `<button class="icon-btn" id="close-about" aria-label="Close">` — the glyph alone would be announced as "times" or nothing, so the label is explicit.
- Inside: project blurb, "Problem in one line", "What the app does", "Technologies used", team list, and two links.

**Script at line 318:** `<script src="script.js"></script>` — a classic (not module) script, so the functions are global and there is no `defer` needed because of the position.

---

## 4. style.css — the design system

### 4.1 Custom properties (lines 4–20)

Everything visual derives from `:root` variables. Change one line, restyle the whole app.

```css
:root {
  --navy: #12243a;        /* header background and main buttons */
  --mint: #98dfc4;        /* accent on the dark header */
  --green: #1f6b4c;       /* accent on light backgrounds (links, focus) */
  --paper: #f5f5f1;       /* page background */
  --white: #ffffff;
  --border: #e3e7e5;

  --text: #162537;        /* main text */
  --text-light: #4f5d6a;  /* secondary text */
  --text-muted: #6b7782;  /* small notes and hints */

  --danger: #a33a43;

  --body-font: 'DM Sans', Arial, sans-serif;
  --heading-font: 'Manrope', Arial, sans-serif;
}
```

The important structural idea: **mint is used only on the dark navy header, green only on light backgrounds.** They are two accents for two different contexts, not two variants of one colour. `--text` / `--text-light` / `--text-muted` form a three-step hierarchy for primary, secondary and tertiary text.

### 4.2 Reset and base (lines 22–72)

- `* { box-sizing: border-box }` — without this, padding is added *outside* the declared width, and every width in the stylesheet would be wrong.
- `html { scroll-behavior: smooth }` — makes the nav fragment links glide instead of jump.
- `body` — margin 0, paper background, DM Sans, 16px, line-height 1.5 (a comfortable measure for prose).
- `button, input, select, textarea { font: inherit }` — **form controls do not inherit fonts by default** in browsers. Without this line every input would render in the browser's default UI font, clashing with the page.
- `a { color: inherit }` — links take the surrounding text colour, so we can colour them per-component instead of fighting the default blue.
- `:focus-visible { outline: 2px solid var(--green); outline-offset: 2px }` — keyboard focus is visible on every interactive element. `:focus-visible` (not `:focus`) means mouse clicks do not leave a ring, but Tab navigation does.
- `.sr-only` — the standard visually-hidden utility. `position:absolute` + 1px size + `clip` hides it from sight but leaves it in the accessibility tree.

---

## 5. style.css — layout and components

### 5.1 Header and navigation (lines 74–129)

- `.site-header` — navy background, white text.
- `.nav` — `max-width: 1160px; margin: 0 auto` centres it; `display: flex; justify-content: space-between` pushes brand left and links right; `align-items: center` vertically centres them. The `border-bottom: 1px solid rgba(255,255,255,0.1)` is a hairline that separates nav from hero.
- `.brand` — flex row with 8px gap, Manrope 600, 18px.
- `.brand-mark` — 28×28, `border-radius: 8px`, mint background, navy letter, `display: grid; place-items: center` to centre the "C" in both axes in one line.
- `.brand-light` — mint, applied to the "Hub" span.
- `.nav-links` — flex row, 20px gap.
- `.nav-link` — `#c4ced8` (a dimmed white that still passes contrast on navy), 14px, no underline.
- `.nav-link:hover` — full white. No transition is declared, so the change is instant — deliberate, so hover state is unambiguous.

### 5.2 Hero (lines 131–192)

- `.hero` — same 1160px measure as everything else, generous `80px 24px 88px` padding so the headline breathes.
- `.hero-eyebrow` — mint, 13px, 500 weight, `letter-spacing: 0.02em`, uppercase. Small caps styling signals "metadata" without a badge.
- `.hero h1` — 48px, `line-height: 1.1` (tight, so two lines read as one block), `letter-spacing: -0.02em` (large text needs slightly tighter tracking).
- `.hero-copy` — `max-width: 480px` to keep the measure readable (roughly 60–70 characters per line), `#c4ced8` so body text on navy is softer than pure white.
- `.hero-button` — inline-block, mint fill, navy text, 600 weight, `transition: background-color 0.15s`. Hover lightens to `#b4efd9`.
- `.hero-button-ghost` — transparent with a 1px translucent white border and white text. Hover fills with `rgba(255,255,255,0.1)`. This is the "secondary action" pattern: two buttons, one dominant, one quiet.

### 5.3 Content shell (lines 194–219)

- `.page-shell` — the main column, 1160px max, `40px 24px 56px`.
- `.section-heading` — flex row with `justify-content: space-between`: title on the left, note on the right. `align-items: center` keeps them on a shared baseline. `margin-bottom: 16px` separates the heading from its content.
- `.section-heading h2, .form-panel h2` — 20px, margin reset. The shared selector exists so a heading inside the form panel matches the section headings.
- `.note` — `--text-muted`, 13px. Every small aside in the design uses it.

### 5.4 Dashboard stats (lines 221–254)

- `.stats` — `display: grid; grid-template-columns: repeat(4, 1fr)`. Four equal columns from one declaration; `repeat()` avoids writing the track four times.
- `.stat` — white card, 1px border, `border-radius: 12px`, `16px 20px` padding.
- `.stat dt` — label, `--text-light`, 13px, 500.
- `.stat dd` — `margin: 4px 0 0` resets the default `margin-left: 40px` that browsers give `<dd>`; 28px Manrope 600; `font-variant-numeric: tabular-nums` makes every digit the same width, so the numbers do not jitter when they change.

### 5.5 Capacity bar (lines 256–276)

- `.capacity-bar` — 6px track, `overflow: hidden` (clips the fill to the rounded corners), `border-radius: 99px` (a fully rounded capsule), `#e6eae7` track colour.
- `.capacity-bar span` — `display: block` (a span is inline, so it needs this to accept height), `height: 100%`, `width: 0` initially, green fill, `transition: width 0.4s ease` so the bar animates as seats are taken.

### 5.6 Steps (lines 278–325)

- `.steps` — 3-column grid, no bullets (`list-style: none` on the `<ol>`).
- `.step` — white card, 20px padding, 1px border, 12px radius.
- `.step-num` — mint-green, 13px, 600, `letter-spacing: 0.06em` to space out "01".
- `.step p` — `--text-light`, 13px, `line-height: 1.6` (looser than body text, because these are denser paragraphs in small type).

### 5.7 Brief section (lines 327–479)

- `.brief-grid` — 2×2 grid of cards.
- `.check-list` — bullets replaced with a small mint square via `::before`. The `li` gets `padding-left: 18px` and the pseudo-element is `position: absolute; top: 7px; left: 0` to sit on the text's optical centre. Custom markers, no image.
- `.tech-list li` — `display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline`. The `<span>` inside gets `min-width: 112px` so every technology name occupies the same width and the descriptions line up in a column.
- `.team-grid` — three equal columns.
- `.member h4` — `display: flex; justify-content: space-between` pushes the name left and the registration number right.
- `.member code` — a light grey chip (`background: #f0f2ef`, 12px) so `script.js` reads as a filename.
- `.brief-links a` / `.modal-links a` — outlined buttons: 8px 14px padding, 1px border, green text, no underline. Hover fills with `#f5f7f5` and darkens the border to `#c6ddd0`.

### 5.8 Two-column workspace (lines 481–507)

- `.content-grid` — `grid-template-columns: 360px 1fr`. **A fixed first column and a fluid second**, which is the correct pattern when one column holds a form of predictable width and the other holds variable content.
- `align-items: start` — prevents the two columns stretching to equal height, so the form does not get a tall empty bottom.
- `.panel` — the shared card style: white, 1px border, 16px radius, 24px padding, and a very soft shadow `0 1px 2px rgba(22,37,55,0.04)`.
- `.form-panel { position: sticky; top: 16px }` — the form stays visible while you scroll a long event list. On tablet/mobile this is reset to `static` (line 993) because sticky inside a single column is annoying.

### 5.9 Form fields (lines 509–578)

- `.field-grid` — 2 columns, `gap: 4px 12px` (row gap 4px because each field already carries its own label gap, column gap 12px).
- `.field` — `display: flex; flex-direction: column; gap: 4px` stacks label → input → error with even spacing. `min-width: 0` is critical: **grid items default to `min-width: auto`, which refuses to shrink below content width and blows out the layout.** This one line prevents horizontal overflow.
- `.field.wide { grid-column: 1 / -1 }` — spans both columns.
- `input, select, textarea` — `width: 100%` (fill the field), `min-width: 0` again, 8px 12px padding, 1px border, 8px radius, `#fcfdfc` (off-white so the field reads as an input against a white card), 14px.
- `::placeholder { color: #98a2a8 }` — deliberately lighter than body text so placeholder is not mistaken for a value.
- `:focus` — `outline: none` removes the browser default ring, then it is replaced with `border-color: var(--green)` plus a 3px `box-shadow` glow. **Never remove focus styling without replacing it** — that is the rule being followed here.
- `textarea { resize: vertical; min-height: 80px }` — vertical resize only, so the layout cannot be broken horizontally.
- `.field [aria-invalid="true"] { border-color: var(--danger) }` — an **attribute selector** that styles a field purely from the ARIA state JS sets. No extra class needed: `showErrors()` sets `aria-invalid` and the border turns red automatically.
- `.error { min-height: 16px }` — reserves the line even when empty, so the layout does not shift when errors appear or clear.
- `.form-actions` — flex row, 8px gap, 12px top margin.

### 5.10 Buttons (lines 580–616)

One `.btn` base (padding, radius, 14px, 500, `cursor: pointer`, colour transition) plus three variants:

| Class | Use | Look |
|---|---|---|
| `.btn.primary` | Submit, confirm registration | Navy fill, white text; hover `#1d3550` |
| `.btn.secondary` | Edit event, cancel edit | Light grey `#eef1f0`; hover `#e3e7e5` |
| `.btn.danger` | Delete event | Pale red `#fbefef`, dark red text; hover `#f6e1e1` |

The `border: 0` on the base exists because browsers give `<button>` a default border that would fight the background colour.

### 5.11 Filters (lines 618–624)

`.filters { grid-template-columns: 1fr auto auto }` — the search box takes all remaining width, the two selects size to their content. That is why the select columns do not stretch.

### 5.12 Event cards (lines 626–812)

- `.event-list` — 2-column grid of cards. At 620px it becomes one column (line 1081).
- `.event-card` — white, 1px border, 12px radius, 16px padding, `min-width: 0` (same overflow protection), and `transition: border-color 0.15s`.
- `.event-card:hover { border-color: #c6ddd0 }` — a mint-tinged border on hover gives feedback without moving anything.
- `.card-top` — flex, `space-between`: category badge left, status pill right.
- `.badge` — the category, dimmed 13px text.
- `.status` — a small pill: 2px 8px padding, 6px radius, 12px, 500.
- Status variants: `.status-open` green tint, `.status-almost-full` amber `#fff3dc`, `.status-full` red `#fae8e8`, `.status-past` grey `#edf0f2`. These class names come from `getStatus()` lowercased with spaces turned into hyphens (`'Almost full'` → `status-almost-full`), so **the JS string and the CSS class are locked together** — renaming a status means renaming both.
- `.event-card h3` — 16px, `line-height: 1.3` because titles can wrap to two lines.
- `.meta` — date and venue, dimmed 13px, zero margin (two consecutive `.meta` paragraphs sit tight).
- `.seats` — `font-variant-numeric: tabular-nums` again, so "30" and "7" do not shift the line.
- `.card-actions` — flex row with a `border-top: 1px solid #edf0ee` hairline and 12px top padding to separate actions from content. `.card-actions .btn` shrinks the buttons to `4px 12px` / 13px, because full-size buttons are too heavy inside a card.
- `.event-card details` / `summary` — the native `<details>`/`<summary>` disclosure. `cursor: pointer` on the summary. **Using `<details>` means expand/collapse works with no JavaScript at all** — it is a browser feature, and it is keyboard accessible for free.
- `.reg-list` — grid of rows, no bullets.
- `.reg-list li` — flex with wrap, so name · ID, status and Cancel button sit on one line when there is room and wrap gracefully when not.
- `.reg-confirmed` green 500, `.reg-cancelled` red 500 — colour plus wording, so the state is not communicated by colour alone (an accessibility requirement).
- `.link-button` — `border: 0; background: none; color: var(--danger); text-decoration: underline`. Looks like a text link, behaves like a button.
- `.register-form` — grid, 8px gap, `border-top: 1px dashed var(--border)`. **Dashed** distinguishes this second divider from the solid one above the actions, signalling "this is a different kind of section" (registration vs event data).
- `.register-form label` — each label is a grid so the text sits above its input.
- `.register-form .btn { justify-self: start }` — inside a grid the button would otherwise stretch full width; this keeps it content-sized.
- `.muted` — dimmed 13px, used for "No registrations yet." and "Registration is closed for this event."
- `.empty` — `grid-column: 1 / -1` so the message spans the whole list width when nothing matches; dashed border, centred text.

### 5.13 Toast (lines 814–835)

- `.toast` — `position: fixed; right: 16px; bottom: 16px`, `z-index: 30`, max-width 420px, navy background, white 14px, drop shadow.
- `.toast-success` green, `.toast-error` dark red. `notify()` swaps `message.className = 'toast toast-' + type`, so the base class plus one modifier is the whole API.

### 5.14 Footer (lines 837–882)

- `.site-footer` — flex row, `space-between`, background `#e9ece7` (a green-tinted grey that ties to the green accent).
- `padding: 20px max(24px, calc((100vw - 1160px) / 2))` — **the clever line.** It computes the same centring as `margin: 0 auto` with `max-width: 1160px`, but as padding, so the footer's background spans the full window while its content aligns exactly with the rest of the page.
- `.footer-brand .brand-light { color: var(--green) }` — inside the footer the "Hub" is green, not mint, because mint on a light grey background would fail contrast.
- `.footer-right` — flex row, 16px gap, dimmed 13px.
- `.footer-link` — text-style button matching the link look.

### 5.15 About dialog (lines 884–985)

- `.modal[hidden] { display: none }` — **this rule is essential.** A `hidden` element is display:none by default, but `.modal` declares `display: grid`, which would override the browser default and show the modal on load. This rule reasserts the hidden state. Specificity `[hidden]` (attribute) plus class beats the class alone.
- `.modal` — `position: fixed; inset: 0` (full viewport), `z-index: 50`, `display: grid; place-items: center`, 16px padding.
- `.modal-backdrop` — `position: absolute; inset: 0`, `rgba(12,27,42,0.65)`, full-screen click target.
- `.modal-content` — `position: relative` (to sit above the backdrop), `max-width: 460px`, `max-height: 90vh` with `overflow: auto` so a short screen scrolls inside the panel instead of the page.
- `.modal-header` — flex row, `space-between`, `align-items: flex-start` (the title can be two lines while the × stays at the top).
- `.icon-btn` — 32×32, 8px radius, light grey, 20px × glyph, `cursor: pointer`.
- `.team-list li` — flex `space-between` so the name is left and the registration number right, on a `#f5f7f5` chip.

---

## 6. style.css — responsive rules

Three breakpoints, each with a specific job.

### 6.1 Tablet — `max-width: 900px` (lines 987–1010)

| Change | Why |
|---|---|
| `.content-grid` → `1fr` | Two columns (360px form + list) get too cramped below 900px; stack them. |
| `.form-panel` → `position: static` | Sticky only makes sense when the form is beside the list. |
| `.steps`, `.team-grid` → `1fr 1fr` | Three columns become two; the third card would otherwise sit alone on a row. |
| `.steps .step:last-child`, `.team-grid .member:last-child` → `grid-column: 1 / -1` | The odd one out is stretched across both columns, so the row looks intentional instead of leaving a gap. |
| `.nav-links` gap → 14px | Slightly tighter spacing at a narrower width. |

### 6.2 Mobile — `max-width: 620px` (lines 1012–1097)

| Change | Why |
|---|---|
| `.nav` → `flex-wrap: wrap; gap: 10px` | The brand and links stack instead of colliding. |
| `.nav-links` → `width: 100%; overflow-x: auto; white-space: nowrap` | Four links on a 390px screen would wrap awkwardly; they scroll horizontally in one row instead. |
| `.hero` padding → `56px 16px 64px` | Tighter vertical rhythm on a small screen. |
| `.hero h1` → 34px | 48px overflows narrow viewports. |
| `.stats` → `1fr 1fr` | Four stat cards across 390px would be unreadable; 2×2 instead. |
| `.stat dd` → 24px | Same reasoning for the number size. |
| `.panel` padding → 16px | Reclaims horizontal space. |
| `.brief-grid`, `.steps`, `.team-grid` → `1fr` | Single column; and the `:last-child` spans are reset to `auto` since there is only one column now. |
| `.filters` → `1fr 1fr`, `#search` → `grid-column: 1 / -1` | Search full width on top, the two selects side by side beneath. |
| `.event-list` → `1fr` | One card per row. |
| `.site-footer` → `column`, `.footer-right` → `column` | Stacks the footer content on narrow screens. |

### 6.3 Very small phones — `max-width: 380px` (lines 1099–1105)

`.field-grid` and `.filters` collapse to a single column. Below 380px even two form fields side by side become unusable.

**Tested at 1280, 820, 390 and 340 px: zero horizontal overflow at every width.**

---

## 7. script.js — settings and state

### 7.1 Constants (lines 4–9)

```js
const STORAGE_KEY = 'campusEvents';
const CATEGORIES = ['Workshop', 'Competition', 'Talk', 'Club event'];
const FIELDS = ['title', 'category', 'date', 'time', 'venue', 'capacity', 'description'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_PATTERN = /^[A-Z0-9]{4,20}$/;
```

- `STORAGE_KEY` — the single place the localStorage key is written. Used in `loadEvents()` and `saveEvents()`.
- `CATEGORIES` — the source of truth for validation. The `<select>` options in the HTML must match this list; `validateEvent()` rejects anything not in it. If a fifth category were needed, both files change.
- `FIELDS` — drives three loops: reading the form into an object, filling the form for editing, and clearing errors. **Adding a field to the form means adding one string here** and it flows through all three places automatically. That is the main benefit of this array.
- `EMAIL_PATTERN` — a deliberately simple check: non-space/non-@ characters, then `@`, then more of the same with a dot, then a domain. It catches typos, not RFC compliance — the right trade-off for client-side input.
- `STUDENT_ID_PATTERN` — 4–20 characters, uppercase A–Z or 0–9 only. Because registration uppercases the input first, lowercase typing is accepted and normalised.

### 7.2 Sample events (lines 11–59)

`SAMPLE_EVENTS` is a `const` array of four events used **only on first visit**. `loadEvents()` returns this array when localStorage has no value for the key. They cover all four categories and two capacity regimes (one nearly full, one very large), so the dashboard and status logic have something visible to show on a fresh browser.

Dates are 2026-11-18 through 2026-11-27, deliberately in the near future relative to the assessment period so the "Past" status can also be demonstrated.

### 7.3 DOM references (lines 61–72)

```js
function byId(id) { return document.getElementById(id); }
const form = byId('event-form');
const list = byId('event-list');
const message = byId('message');
const search = byId('search');
const categoryFilter = byId('filter-category');
const statusFilter = byId('filter-status');
const modal = byId('about-modal');
```

`byId()` is a one-line wrapper. The point is readability: `byId('stat-total')` says what it does, and it is faster to type than `document.getElementById` fifteen times. Every element that is used more than once gets a constant here, resolved once at load instead of on every lookup.

### 7.4 Mutable state (lines 74–78)

```js
let events = [];        // all events
let editingId = null;   // id of the event being edited, or null
let messageTimer;       // timer that hides the message box
let returnFocus;        // element to focus again after closing the dialog
```

Four module-level variables, no more. This is the entire application state — which is why the app is easy to reason about.

- `events` — the single source of truth, loaded from localStorage on start and replaced by `updateEvents()`.
- `editingId` — `null` means the form is in "create" mode; a string means "edit this event". Every branch that differs between create and edit keys off this one variable.
- `messageTimer` — holds the `setTimeout` id so a new toast can cancel the previous one.
- `returnFocus` — the element that was focused before the dialog opened, so focus can be restored on close. Keyboard users would otherwise be dropped at the top of the document.

---

## 8. script.js — every function explained

### 8.1 `makeId()` — line 83

```js
return 'event-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
```

Builds a unique id from the timestamp plus six random base-36 characters. Two calls in the same millisecond still differ because of the random suffix.

**Used by:** the create branch of the form submit handler (line 414) for event ids, and `registerStudent()` (line 458) for registration ids.

**Why not `crypto.randomUUID()`:** it works, but the timestamp makes ids sort chronologically, which is handy when reading localStorage by hand in the console.

### 8.2 `startTime(event)` — line 88

```js
return new Date(event.date + 'T' + (event.time || '00:00'));
```

Combines the stored date and time into a real `Date`. The `T` separator is the ISO 8601 standard, and `new Date('2026-11-18T14:00')` parses as **local** time — which is what we want, since `2026-11-18` alone would be parsed as UTC midnight and be off by the timezone offset.

**Used by:** `getStatus()` (line 104), `formatDate()` (line 118), `validateEvent()` (line 189), and the sort in `renderList()` (line 328).

### 8.3 `confirmedCount(event)` — line 93

```js
return event.registrations.filter(reg => reg.status === 'Confirmed').length;
```

Counts only confirmed registrations, not all of them. This is the number that drives capacity.

**Used by:** `seatsLeft()`, `renderDashboard()`, `validateEvent()`, `eventCardHtml()`, `registerStudent()`.

### 8.4 `seatsLeft(event)` — line 98

```js
return Math.max(0, Number(event.capacity) - confirmedCount(event));
```

Capacity minus confirmed, floored at zero. The `Math.max` matters: without it, an overbooked event would show a negative seat count. `Number()` guards against a capacity that arrived as a string (older saved data).

**Used by:** `getStatus()`, `renderDashboard()`, `eventCardHtml()`, `registerStudent()`.

### 8.5 `getStatus(event)` — line 103

```js
if (startTime(event) < new Date()) return 'Past';
if (seatsLeft(event) <= 0) return 'Full';
if (seatsLeft(event) <= Number(event.capacity) * 0.2) return 'Almost full';
return 'Open';
```

The status machine, checked in priority order:

1. **Past** — the start time has already passed. Checked first, because a past event that is also full should read "Past".
2. **Full** — no seats left.
3. **Almost full** — 20% or fewer seats remain.
4. **Open** — otherwise.

The 20% threshold is a product decision: it gives organizers an early warning without making the badge meaningless.

**Used by:** `renderDashboard()` (to exclude past events), `renderList()` (status filter), `eventCardHtml()` (badge and class), `registerStudent()` (to block registration).

### 8.6 `escapeHtml(value)` — line 111

```js
const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
return String(value ?? '').replace(/[&<>"']/g, ch => chars[ch]);
```

Replaces the five characters that are special in HTML with their entity equivalents. **`&` must be first** — otherwise `&` in `<` would become `&amp;lt;` and the escaping would be wrong.

**Why it matters:** every user-supplied value (title, venue, description, name, student ID, email) is interpolated into an HTML template string in `eventCardHtml()`. Without escaping, a title containing `<img src=x onerror=alert(1)>` would execute. This is the standard defence against stored XSS (cross-site scripting), and the function is applied at every single interpolation point — check `eventCardHtml()` and `registrationListHtml()` and you will see it wrapping every `${}`.

`String(value ?? '')` handles `null` and `undefined` safely instead of printing "null".

**Used by:** `registrationListHtml()`, `registerFormHtml()`, `eventCardHtml()` — dozens of call sites.

### 8.7 `formatDate(event)` — line 117

```js
return startTime(event).toLocaleString('en-IN', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});
```

Produces e.g. "Wed, 18 Nov 2026, 02:00 pm". `toLocaleString` with an explicit locale does the formatting for us — no manual month-name arrays, no 12/24-hour arithmetic, and it respects the browser's locale data.

**Used by:** `eventCardHtml()` (line 300) for the card's date line.

### 8.8 `notify(text, type = 'success')` — line 129

```js
message.textContent = text;
message.className = 'toast toast-' + type;
message.hidden = false;
clearTimeout(messageTimer);
messageTimer = setTimeout(() => { message.hidden = true; }, 3500);
```

The toast function. Four jobs in order:

1. Writes the text with `textContent` (never `innerHTML` — see the security note in §3.9).
2. Sets the class to `toast` plus a modifier, so `notify('x', 'error')` gives `class="toast toast-error"`.
3. Unhides it.
4. `clearTimeout` first, then a fresh 3.5s timer. The `clearTimeout` is what stops a second toast from being hidden early by the first one's pending timer — a classic bug this line prevents.

`type = 'success'` is a **default parameter** (ES6): call `notify('Saved.')` and type is `'success'`; call `notify('Bad.', 'error')` to get the red style.

**Used by:** 9 call sites — after add, edit, delete, register, cancel, and on validation failures and storage failures.

### 8.9 `loadEvents()` — line 141

```js
const saved = localStorage.getItem(STORAGE_KEY);
if (saved === null) return SAMPLE_EVENTS;
const data = JSON.parse(saved);
const isValid = Array.isArray(data) &&
  data.every(e => e && typeof e.title === 'string' && Array.isArray(e.registrations));
if (!isValid) throw new Error('Invalid event data');
return data;
```

Wrapped in `try/catch` because `localStorage.getItem` can throw (private mode, disabled storage, quota) and `JSON.parse` throws on corrupt data.

Three outcomes:

- Nothing saved yet → sample events.
- Valid array → the saved data.
- Corrupt or unreadable → `console.error` for the developer, `notify(..., 'error')` for the user, then fall back to sample events.

The `isValid` check is a light schema validation: an array, every item truthy with a string title and an array of registrations. This catches the case where the key holds something else entirely (an old version's data, or a value written by a different app on the same origin).

**Called once**, at line 528, on startup.

### 8.10 `saveEvents(nextEvents)` — line 159

```js
localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
return true;
// catch: console.error, notify(..., 'error'), return false
```

Serialises the whole array to JSON and writes it. **Returns a boolean** — this is the important part. Storage can fail (private browsing, quota exceeded), and every caller checks the return value rather than assuming success.

**Used by:** `updateEvents()` only.

### 8.11 `updateEvents(nextEvents)` — line 171

```js
if (!saveEvents(nextEvents)) return false;
events = nextEvents;
render();
return true;
```

**The single write path in the whole app.** Persist first, then update in-memory state, then re-render. If the save fails, the function returns early: `events` keeps its old value and the screen still shows the old data — consistent, because nothing was written and nothing changed. Doing it the other way round (update memory, then save, then discover the save failed) would leave the screen showing data that will vanish on reload.

**Used by:** the form submit handler, `deleteEvent()`, `registerStudent()`, `cancelRegistration()`.

### 8.12 `validateEvent(input)` — line 181

Returns an object of errors, empty when everything is fine: `{ title: 'Enter at least 3 characters.' }`.

| Field | Rule |
|---|---|
| `title` | at least 3 characters after trimming |
| `category` | must be in `CATEGORIES` |
| `date` | required, and must be in the future |
| `time` | required |
| `venue` | at least 3 characters after trimming |
| `capacity` | integer, 1–1000 |
| `description` | at least 10 characters after trimming |
| `capacity` (edit only) | cannot drop below the number already confirmed |

The future-date check runs on both date and time: `if (input.date && input.time && startTime(input) < new Date())` — the combined timestamp, not just the date, so an event starting in ten minutes is accepted.

The last check is the interesting one: when editing, it looks up the current event by `editingId` and refuses a capacity below `confirmedCount(current)`. Without it you could shrink an event to 5 seats while 20 people are registered, producing a permanent overbooking.

**Used by:** the form submit handler (line 394).

### 8.13 `showErrors(errors)` — line 208

```js
FIELDS.forEach(field => {
  const input = form.elements.namedItem(field);
  const text = errors[field] || '';
  byId('error-' + field).textContent = text;
  if (text) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
});
```

Loops the `FIELDS` array, and for each one writes the message into the `error-<name>` paragraph and sets or clears `aria-invalid`.

Two details worth naming:

- **`error-' + field`** — the ID is built from the field name, which is why the HTML IDs are `error-title`, `error-capacity` and so on. The naming convention is a contract between HTML and JS.
- **`aria-invalid`** — this is what makes the red border appear, through the CSS attribute selector `.field [aria-invalid="true"]` (style.css line 563). One attribute drives both the visual state and the screen-reader announcement. Removing it on success is what clears the red.

Calling `showErrors({})` with an empty object clears every error — which is how `resetForm()` and `startEditing()` wipe the form clean.

**Used by:** `resetForm()`, `startEditing()`, the submit handler.

### 8.14 `renderDashboard()` — line 225

Computes four numbers and updates the DOM:

| Variable | Source |
|---|---|
| `upcoming` | events whose status is not `Past` |
| `totalConfirmed` | sum of `confirmedCount()` over **all** events |
| `totalSeats` | sum of `seatsLeft()` over upcoming only |
| `totalCapacity` | sum of `capacity` over upcoming only |

Then the bar:

```js
const bookedShare = totalCapacity > 0 ? Math.round((totalConfirmed / totalCapacity) * 100) : 0;
byId('stat-bar').style.width = Math.min(100, bookedShare) + '%';
```

The guard `totalCapacity > 0` avoids dividing by zero when there are no events. `Math.min(100, ...)` clamps the width so the fill can never exceed its track.

Then a three-branch caption, because a bare number needs context:

- no upcoming events → "No upcoming events yet."
- upcoming events but zero bookings → "174 seats open across 2 upcoming events."
- otherwise → "1% of 174 seats across upcoming events are already confirmed."

**Note the deliberate asymmetry:** `totalConfirmed` counts past events too (they were real registrations), while seats and capacity only count upcoming events. That is why the bar can read a low percentage — a past event's registrations are in the numerator but its seats are not in the denominator.

**Used by:** `render()`.

### 8.15 `registrationListHtml(event)` — line 254

Builds the `<ul>` of people registered, or `<p class="muted">No registrations yet.</p>`.

For each registration it decides the row's content:

- `<span>name · studentId</span>` — both escaped.
- `<span class="reg-confirmed">` or `reg-cancelled` with the status text — the class carries the colour, the text carries the meaning.
- A Cancel button, **only if confirmed**. Cancelled rows get `''` (empty string) in that slot, so nothing renders.

The button carries three data attributes:

```html
data-action="cancel" data-id="event-id" data-reg-id="reg-id"
```

These are how the click handler knows what was clicked and which event and registration to act on — see §9.1. This is **event delegation**: instead of attaching a listener to every Cancel button, one listener on the list reads `dataset` from whatever was clicked. That works even though the cards are destroyed and rebuilt on every render.

**Used by:** `eventCardHtml()` (line 310).

### 8.16 `registerFormHtml(event, status)` — line 276

```js
if (status === 'Past' || status === 'Full') {
  return '<p class="muted">Registration is closed for this event.</p>';
}
return `<form class="register-form" data-event-id="..." novalidate> ... </form>`;
```

Returns either a closed notice or a three-field form. The `data-event-id` on the form is how the submit handler knows which event is being registered for — again, delegation.

`novalidate` again, for the same reason as the main form: our JS is the validator. The fields use `autocomplete="name"` and `autocomplete="email"` so browsers can offer to fill them. The email input is `type="email"`, which gives the right keyboard on phones and native validation if JS were ever removed — a graceful fallback.

**Note:** this is the only place the registration form's markup lives, so changing the fields is a one-line change here.

**Used by:** `eventCardHtml()` (line 311).

### 8.17 `eventCardHtml(event)` — line 290

Assembles one card:

```js
const status = getStatus(event);
const statusClass = 'status-' + status.toLowerCase().replaceAll(' ', '-');
```

`getStatus()` returns e.g. `"Almost full"`; that becomes the class `status-almost-full`. **This is the link between JS and the CSS status colours.** `replaceAll` (ES2021) handles multi-word statuses; `.replace(/ /g, '-')` would be the older equivalent.

The card then renders, in order: category badge, status pill, `<h3>` title, date line, venue line, description, seats line, Edit + Delete buttons, and a `<details>` block containing the registration list and the registration form.

Every interpolation is wrapped in `escapeHtml()` except two: `seatsLeft(event)`, `confirmedCount(event)` and `Number(event.capacity)` — all numbers, which cannot contain markup, so escaping them would be pointless.

**Used by:** `renderList()` via `visible.map(eventCardHtml)`.

### 8.18 `renderList()` — line 317

The search and filter pipeline:

```js
const query = search.value.trim().toLowerCase();
const visible = events
  .filter(e => { /* search, category, status */ })
  .sort((a, b) => startTime(a) - startTime(b));
```

- **Search** concatenates title + venue + description and lowercases both sides, so the match is case-insensitive. `!query ||` means an empty search box matches everything — no special case needed.
- **Category** uses strict equality against the select's value; `!categoryFilter.value ||` short-circuits on the empty "All categories" option.
- **Status** compares `getStatus(e)` to the select value. Because `getStatus()` is called, the filter is always live — an event that becomes "Full" a second ago drops out of a "Open" filter immediately.
- **Sort** subtracts two `Date` objects, which coerces them to numbers (milliseconds). Ascending, so the soonest event is first.

Then the result count is written with a **singular/plural conditional**: `visible.length + (visible.length === 1 ? ' event' : ' events')`.

Finally the list is replaced wholesale with `innerHTML`. This is a deliberate simplicity trade-off: the whole list is at most a few dozen cards, so rebuilding it is instant, and it guarantees the DOM always matches the state exactly — no chance of a stale card. The cost is that any open `<details>` element closes on re-render; acceptable here because the list only re-renders when the search or the data changes.

The empty state uses a `<p class="empty">` spanning the grid.

**Used by:** `render()`, plus the three search/filter listeners.

### 8.19 `render()` — line 339

```js
function render() { renderDashboard(); renderList(); }
```

The single entry point for "the data changed, redraw everything". Every mutation calls `updateEvents()`, which calls `render()` — so there is exactly one place to add a future section to the UI.

**Used by:** `updateEvents()`, and once on startup (line 529).

### 8.20 `resetForm()` — line 346

```js
form.reset();
editingId = null;
byId('form-heading').textContent = 'Create an event';
byId('save-button').textContent = 'Add event';
byId('cancel-edit').hidden = true;
showErrors({});
```

Returns the form to create mode. Note that it changes the **heading text**, the **button label**, the **cancel button's visibility**, and **clears all errors** — five things that must stay in sync. Centralising them in one function is what prevents "I edited an event, then added a new one, and the heading still said Edit".

**Used by:** successful submit, `deleteEvent()` (if the deleted event was being edited), the Cancel edit button.

### 8.21 `startEditing(eventId)` — line 356

```js
const event = events.find(e => e.id === eventId);
if (!event) return;
editingId = eventId;
FIELDS.forEach(field => { form.elements.namedItem(field).value = event[field]; });
byId('form-heading').textContent = 'Edit event';
byId('save-button').textContent = 'Save changes';
byId('cancel-edit').hidden = false;
showErrors({});
form.scrollIntoView({ behavior: 'smooth', block: 'center' });
form.elements.namedItem('title').focus();
```

Loads an event into the form for editing. The `FIELDS` loop again does the work — every named field is filled from the event object, because the object's keys are exactly the field names.

The last two lines are the usability touch: `scrollIntoView` brings the form into view (on mobile the form is above the list, so after scrolling down to click Edit you would otherwise see nothing happen), then focus goes to the title field so you can type immediately.

`if (!event) return;` guards against a stale `data-id` pointing at an event that has since been deleted.

**Used by:** the delegated click handler for `data-action="edit"`.

### 8.22 `deleteEvent(eventId)` — line 373

```js
if (!confirm(`Delete “${item.title}” and its registrations?`)) return;
if (editingId === eventId) resetForm();
if (updateEvents(events.filter(e => e.id !== eventId))) notify('Event deleted.');
```

`confirm()` is the native browser dialog — synchronous and blocking, which suits a destructive action. The message names the event, because "Are you sure?" tells the user nothing.

If the event being deleted is the one open in the form, the form is reset first — otherwise the form would hold an event that no longer exists and saving it would silently do nothing.

**Used by:** the delegated click handler for `data-action="delete"`.

### 8.23 `registerStudent(eventId, registerForm)` — line 427

The most-validated function in the app. It builds an `input` object, then accumulates an `errors` array:

```js
const input = {
  name: registerForm.elements.name.value.trim(),
  studentId: registerForm.elements.studentId.value.trim().toUpperCase(),
  email: registerForm.elements.email.value.trim()
};
```

- `name` must be at least 2 characters.
- `studentId` must match `STUDENT_ID_PATTERN` — and it is **uppercased first**, so `s1001` and `S1001` are the same person.
- `email` must match `EMAIL_PATTERN`.
- The event must not be `Past` (checked with `getStatus`, so it is live).
- The event must have seats left (`seatsLeft(event) <= 0` blocks it).
- The student ID must not already be confirmed for this event:

```js
const alreadyRegistered = event.registrations.some(
  r => r.status === 'Confirmed' && r.studentId.toUpperCase() === input.studentId
);
```

`.some()` returns true on the first match — it stops scanning rather than checking every element, and reads better than a filter-plus-length check. `.toUpperCase()` on the stored value too, because older records might have lowercase IDs.

If any errors exist, they are joined with a space into one toast and the function returns — **no registration is created**.

Otherwise a registration object is appended immutably:

```js
const registration = { id: makeId(), ...input, status: 'Confirmed' };
const nextEvents = events.map(e =>
  e.id === eventId ? { ...e, registrations: [...e.registrations, registration] } : e
);
```

`{ ...e, registrations: [...] }` creates a **new** event object with a **new** array rather than mutating the existing one. This matters: `events` is the previous state, and building the next state without touching the old one is what makes `updateEvents()`'s "save, then swap" logic safe.

On success: `notify(input.name + ' is registered. Status: Confirmed.')` — the name is echoed from user input, and it is safe here because `notify` uses `textContent`.

**Used by:** the delegated submit handler on the list.

### 8.24 `cancelRegistration(eventId, regId)` — line 468

```js
const registrations = e.registrations.map(r => (r.id === regId ? { ...r, status: 'Cancelled' } : r));
```

Maps over registrations and replaces the matching one with a copy whose status is `Cancelled`. **The record is kept, the status changes** — which is the whole point of the data model (§2). The seat frees up because `confirmedCount()` no longer counts it, so `seatsLeft()` increases and the badge may move from Full back to Almost full.

**Used by:** the delegated click handler for `data-action="cancel"`.

---

## 9. script.js — event listeners

### 9.1 Delegated clicks on the list (lines 483–493)

```js
list.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const eventId = button.dataset.id;
  if (action === 'edit') startEditing(eventId);
  if (action === 'delete') deleteEvent(eventId);
  if (action === 'cancel') cancelRegistration(eventId, button.dataset.regId);
});
```

**One listener for the whole list**, attached to `#event-list` which exists once and never gets replaced — even though its children are rebuilt on every render.

`event.target.closest('button[data-action]')` walks up from whatever was clicked (the text node's element, an inner `<span>`, etc.) until it finds a button carrying `data-action`. If the user clicks empty space inside the card, `closest` returns `null` and the handler exits.

The comment above it (line 481) states the reason: *"The cards are redrawn often, so we listen on the list instead of each button."* Had a listener been attached inside `eventCardHtml()`, every re-render would either leak listeners or lose them.

`button.dataset.action` maps to `data-action`, and `dataset.regId` maps to `data-reg-id` — the camelCase conversion is automatic.

### 9.2 Delegated submits on the list (lines 495–499)

```js
list.addEventListener('submit', event => {
  if (!event.target.matches('.register-form')) return;
  event.preventDefault();
  registerStudent(event.target.dataset.eventId, event.target);
});
```

`submit` events **bubble**, so this works even though the forms are created dynamically. The `matches('.register-form')` guard means that if another form is ever added inside the list, this handler ignores it.

`event.preventDefault()` stops the browser from navigating or reloading — essential, since a form with no `action` would otherwise submit to the current URL and wipe the page.

`event.target.dataset.eventId` reads the `data-event-id` that `registerFormHtml()` wrote onto the form.

### 9.3 Form submit (lines 385–421)

```js
form.addEventListener('submit', event => {
  event.preventDefault();
  const input = {};
  FIELDS.forEach(field => { input[field] = form.elements.namedItem(field).value; });
  const errors = validateEvent(input);
  showErrors(errors);
  if (Object.keys(errors).length) { notify('Please correct the highlighted fields.', 'error'); return; }

  const record = {
    ...input,
    title: input.title.trim(),
    venue: input.venue.trim(),
    description: input.description.trim(),
    capacity: Number(input.capacity)
  };

  const wasEditing = Boolean(editingId);
  let nextEvents;
  if (wasEditing) nextEvents = events.map(e => (e.id === editingId ? { ...e, ...record } : e));
  else nextEvents = [...events, { id: makeId(), ...record, registrations: [] }];

  if (updateEvents(nextEvents)) {
    resetForm();
    notify(wasEditing ? 'Event updated.' : 'Event added.');
  }
});
```

The create/edit branch in full:

1. Read all seven fields into `input` via the `FIELDS` loop.
2. Validate, show errors, and **return early** if any exist — before any state change.
3. Build a cleaned `record`: trimmed strings and a numeric capacity. Trimming happens here rather than in validation so the stored data is clean.
4. `Boolean(editingId)` is captured **before** anything mutates it — `resetForm()` would clear it.
5. Edit: `map` over events, replacing the one whose id matches with `{ ...e, ...record }` (spread keeps its `registrations` intact — the record has no `registrations` key, so it cannot wipe them). Create: append a new object with a fresh id and an empty registrations array.
6. If the save succeeded: reset the form and toast the right message.

**Note that `updateEvents()` is only called once and its boolean decides everything.** Nothing is optimistically updated.

### 9.4 Cancel edit (line 423)

```js
byId('cancel-edit').addEventListener('click', resetForm);
```

The button is `type="button"`, so this click never submits.

### 9.5 Search and filters (lines 502–504)

```js
search.addEventListener('input', renderList);
categoryFilter.addEventListener('change', renderList);
statusFilter.addEventListener('change', renderList);
```

Three lines, three listeners, one function. `input` (not `change`) on the search box so results update on every keystroke; `change` on the selects because they are discrete.

Note these call `renderList()` rather than `render()` — searching does not change any data, so the dashboard does not need redrawing. A small optimisation, but it also means the stat numbers do not flicker while you type.

`renderList` is passed directly as the handler, so it receives the event object as its first argument and ignores it.

### 9.6 Dialog (lines 508–525)

```js
function openAbout() {
  returnFocus = document.activeElement;
  modal.hidden = false;
  byId('close-about').focus();
}
function closeAbout() {
  modal.hidden = true;
  if (returnFocus) returnFocus.focus();
}
```

`document.activeElement` before opening captures what the user was on (the footer button), and `closeAbout()` puts focus back there. Without this, closing the dialog would leave focus nowhere and the next Tab would jump to the top of the document.

Three triggers to close: the × button, the backdrop button, and `Escape` on the document:

```js
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !modal.hidden) closeAbout();
});
```

The `!modal.hidden` guard means Escape does nothing when the dialog is already closed — so it cannot interfere with anything else on the page.

The listener is on `document`, not on the modal, so Escape works no matter where focus currently is.

### 9.7 Startup (lines 527–529)

```js
events = loadEvents();
render();
```

Two lines. Load the persisted state, draw it. Everything else is event-driven.

---

## 10. How a full user journey flows through the code

### 10.1 First visit

1. `index.html` loads, CSS applies, fonts fetch.
2. `script.js` runs. Constants and element references resolve.
3. `loadEvents()` finds no `campusEvents` key → returns `SAMPLE_EVENTS`.
4. `render()` → `renderDashboard()` writes 4 / 2 / 0 / 174-ish and sets the bar width; `renderList()` writes four cards.
5. The user sees four events, two of them upcoming.

### 10.2 Registering for an event

1. User expands `<details>` (pure browser behaviour, no JS).
2. Types a name, student ID, email. Submits.
3. The `submit` event bubbles to `#event-list` → the delegated handler fires.
4. `event.target.matches('.register-form')` passes, `preventDefault()` stops the page reload.
5. `registerStudent()` validates. Say the event is full → error pushed → toast shows red message → **return, nothing saved**.
6. Say it passes → a registration object is created, `events.map` builds the next array, `updateEvents()` saves to localStorage, swaps `events`, calls `render()`.
7. `renderDashboard()` recounts — seats available drops, the bar grows.
8. `renderList()` rebuilds the cards — the status badge may flip to Almost full, the seat line updates, the registrations list shows the new row.
9. Green toast: "Aarav Sharma is registered. Status: Confirmed."

### 10.3 Creating an event

1. User fills the form. Suppose they leave the capacity empty.
2. Submit → `validateEvent()` returns `{ capacity: 'Enter a whole number from 1 to 1000.' }`.
3. `showErrors()` writes that text into `#error-capacity` and sets `aria-invalid="true"` on the input.
4. CSS `.field [aria-invalid="true"]` turns the border red.
5. Toast: "Please correct the highlighted fields." in red. **No save, no render.**
6. User fixes it, submits again. This time `errors` is empty.
7. `record` built, `wasEditing` false, new object appended with `makeId()` and `registrations: []`.
8. `updateEvents()` saves → `render()` → dashboard count goes to 5, list shows the new card sorted into date order.
9. `resetForm()` clears the fields and the errors. Toast: "Event added."

### 10.4 Editing an event

1. Click Edit on a card → delegated handler → `startEditing(id)`.
2. `editingId` is set, the `FIELDS` loop fills the form, heading becomes "Edit event", button "Save changes", Cancel appears, errors clear.
3. The page scrolls to the form and focuses the title field.
4. Submit → same validate path, but now `validateEvent()` also enforces "capacity cannot go below confirmed registrations".
5. `events.map` replaces the matching event with `{ ...e, ...record }` — registrations preserved.
6. `updateEvents()` → `render()` → `resetForm()` → "Event updated."

### 10.5 Cancelling a registration

1. Click Cancel on a registration row → delegated handler → `cancelRegistration(eventId, regId)`.
2. The matching registration is replaced with `{ ...r, status: 'Cancelled' }`.
3. `confirmedCount()` drops by one → `seatsLeft()` rises by one → the badge may change from Full to Almost full.
4. The row stays visible but red and labelled "Cancelled", with no Cancel button.
5. "Registration cancelled." toast.

### 10.6 Reloading the page

1. `loadEvents()` reads localStorage, parses, validates the shape.
2. All created events and all confirmed/cancelled registrations are back exactly as left.
3. If the stored JSON were corrupt, the catch block shows a red toast and falls back to sample events — the app still works.

---

## 11. Why each technical decision was made

These are the answers to "why did you do it this way", which is what the viva actually asks.

| Decision | Reason |
|---|---|
| **No framework** | The problem does not need one. Three files, zero install, runs from `file://`. Every line is readable and explainable, which is the point of the exercise. |
| **localStorage, not a backend** | No server, no accounts, no deployment cost, no data leaving the device. The trade-off is stated openly: data is per-browser and not shared. For a single-organizer demo that is the right call. |
| **`innerHTML` templates instead of `createElement` chains** | Readable, and one function per component. The safety requirement is met by escaping every interpolation through `escapeHtml()` — the risk is managed, not ignored. |
| **Event delegation instead of per-button listeners** | The list is rebuilt on every render. Delegation survives that; per-button listeners would be lost or leak. |
| **Immutable updates (`map` / spread)** | `events` is the old state. Building the next state without mutating it means `updateEvents()` can safely abandon the change if the save fails. |
| **Save before swap** | If localStorage fails (private mode, quota), the UI keeps showing data that actually exists. The reverse order would show data that will disappear on reload. |
| **Cancellation as a status change** | Deleting records loses history. A status change keeps the audit trail and frees the seat through the same `confirmedCount()` filter. |
| **One status function, `getStatus()`** | Past/Full/Almost full/Open is computed, never stored. So it is always correct — no stale cached status, and no migration needed when the threshold changes. |
| **`FIELDS` array** | One list drives form reading, form filling and error clearing. Adding a field is one string plus one line of HTML. |
| **`novalidate` on both forms** | Two validators would disagree. Our JS is the single source of truth, and it produces messages we control. |
| **`aria-live` on the result count and toast** | Screen-reader users hear the count change and the success message without hunting for it. |
| **Colour + text for status** | Colour alone fails colour-blind users. Every badge has a word in it. |
| **`:focus-visible`, not `:focus`** | Keyboard users get a clear ring; mouse users do not get a ring stuck on the last thing they clicked. |
| **`min-width: 0` on grid children** | Grid items default to `min-width: auto`, which refuses to shrink and causes horizontal overflow. This is the single most common CSS layout bug. |
| **CSS custom properties** | One line changes the palette. The whole design derives from `--navy`, `--mint`, `--green`, `--paper`. |
| **`max()` in the footer padding** | Reproduces `margin: 0 auto` centring while letting the footer background span the full width. |
| **Semantic elements** (`header`, `nav`, `main`, `section`, `article`, `footer`, `dl`, `details`) | Structure is announced by screen readers and is what "proper use of HTML" means in the rubric. |
| **Dashed vs solid dividers** | Solid separates actions; dashed separates the registration sub-section. Two visual languages for two levels of grouping. |
| **`<details>` for registrations** | Native expand/collapse: keyboard accessible, no JavaScript, no ARIA needed. |
| **Two accents, mint and green** | Mint only on navy, green only on light. Contrast passes in both contexts; using mint on white would fail. |
| **Sample events on first run** | A blank dashboard proves nothing. Four events demonstrate the dashboard, the filters, the status logic and both capacity regimes immediately. |

---

## 12. Design system reference

### Colours

| Variable | Hex | Used for |
|---|---|---|
| `--navy` | `#12243a` | Header background, primary buttons, toast background |
| `--mint` | `#98dfc4` | Accent on navy: brand mark, "Hub", eyebrow, hero button, check bullets |
| `--green` | `#1f6b4c` | Accent on light: links, focus rings, confirmed status, capacity bar fill |
| `--paper` | `#f5f5f1` | Page background |
| `--white` | `#ffffff` | Cards, panels, modal |
| `--border` | `#e3e7e5` | 1px borders everywhere |
| `--text` | `#162537` | Primary text |
| `--text-light` | `#4f5d6a` | Secondary text, descriptions |
| `--text-muted` | `#6b7782` | Notes, placeholders, metadata |
| `--danger` | `#a33a43` | Errors, delete button, cancelled state |

### Type scale

| Size | Where |
|---|---|
| 48px / 34px mobile | Hero `<h1>` |
| 28px / 24px mobile | Stat numbers `<dd>` |
| 22px | Modal title |
| 20px | Section headings `<h2>` |
| 17px | Team heading |
| 16px | Card titles, body |
| 15px | Card h3 in steps/brief, sub-headings |
| 14px | Buttons, inputs, secondary copy |
| 13px | Notes, labels, meta, badges |

### Breakpoints

| Width | Name | What changes |
|---|---|---|
| > 900px | Desktop | Full two-column workspace, 4-column stats, 3-column steps and team |
| ≤ 900px | Tablet | Single column workspace, 2-column steps and team |
| ≤ 620px | Mobile | 2-column stats, 1-column lists and cards, stacked nav and footer |
| ≤ 380px | Small phone | Single-column form fields and filters |

### Component inventory

`.site-header` · `.nav` · `.brand` · `.brand-mark` · `.brand-light` · `.nav-links` · `.nav-link` · `.hero` · `.hero-eyebrow` · `.hero-copy` · `.hero-actions` · `.hero-button` · `.hero-button-ghost` · `.page-shell` · `.section-heading` · `.note` · `.dashboard` · `.stats` · `.stat` · `.capacity-bar` · `.how` · `.steps` · `.step` · `.step-num` · `.brief` · `.brief-grid` · `.brief-card` · `.check-list` · `.tech-list` · `.team-grid` · `.member` · `.brief-links` · `.content-grid` · `.panel` · `.form-panel` · `.panel-intro` · `.field-grid` · `.field` · `.field.wide` · `.error` · `.form-actions` · `.btn` · `.btn.primary` · `.btn.secondary` · `.btn.danger` · `.filters` · `.event-list` · `.event-card` · `.card-top` · `.badge` · `.status` · `.status-open` · `.status-almost-full` · `.status-full` · `.status-past` · `.meta` · `.description` · `.seats` · `.card-actions` · `.reg-list` · `.reg-confirmed` · `.reg-cancelled` · `.link-button` · `.register-form` · `.muted` · `.empty` · `.toast` · `.toast-success` · `.toast-error` · `.site-footer` · `.footer-brand` · `.footer-right` · `.footer-link` · `.modal` · `.modal-backdrop` · `.modal-content` · `.modal-header` · `.modal-label` · `.icon-btn` · `.modal-note` · `.modal-links` · `.team-list` · `.sr-only`

---

## 13. Where to find each requirement from the rubric

| Rubric requirement | Where it lives |
|---|---|
| Implementation of the problem statement | `#how-it-works` section, `#problem` section, the whole app |
| Functional correctness | `validateEvent()`, `registerStudent()`, `updateEvents()` |
| Completeness of features | CRUD in `script.js`, registration and cancellation, search and filters |
| UI design and usability | `style.css` design system, `.hero`, cards, toast feedback |
| Navigation | `.nav-links` fragment links, `#page-top` brand, footer brand |
| Proper use of HTML/CSS/JS | Semantic elements, `dl`/`details`/`section`, CSS Grid, custom properties, ES6 |
| Code organisation | Section comments in all three files, one function per job, constants at the top |
| Responsiveness | Three media queries (§6), tested at 1280/820/390/340 px |
| Problem identification and motivation | `#problem` → "The problem" card, `#how-it-works` step 01 |
| Proposed solution and objectives | `#problem` → "Our objectives" |
| Major features | `#how-it-works`, the Explore panel, the event cards |
| Technologies used | `#problem` → "Technologies" card, About dialog, `README.md` |
| Key outcomes | `#problem` → "Outcomes" card |
| Individual contributions | `#problem` → Team Obsidian grid (three members, three contribution lines) |

---

## 14. Quick reference: element ID map

| ID | Type | Used by |
|---|---|---|
| `page-top` | header | Anchor target for brand links |
| `top` | hero div | Legacy anchor (kept, harmless) |
| `dashboard` | section | Nav link target |
| `stat-total` | `<dd>` | `renderDashboard()` |
| `stat-upcoming` | `<dd>` | `renderDashboard()` |
| `stat-registrations` | `<dd>` | `renderDashboard()` |
| `stat-seats` | `<dd>` | `renderDashboard()` |
| `stat-bar` | `<span>` | `renderDashboard()` sets `style.width` |
| `stat-caption` | `<p>` | `renderDashboard()` writes the sentence |
| `how-it-works` | section | Nav link, hero ghost button |
| `form-heading` | `<h2>` | `resetForm()`, `startEditing()` rewrite text |
| `event-form` | `<form>` | Submit listener, `form.elements` |
| `event-title` … `event-description` | inputs | Labels' `for`, `startEditing()` fills |
| `error-title` … `error-description` | `<p>` | `showErrors()` writes messages |
| `save-button` | `<button>` | `resetForm()`, `startEditing()` rewrite label |
| `cancel-edit` | `<button>` | Click listener, `hidden` toggled |
| `events` | section | Nav link target |
| `events-heading` | `<h2>` | `aria-labelledby` on the section |
| `result-count` | `<span>` | `renderList()` writes "N events" |
| `search` | `<input>` | `renderList()` reads value |
| `filter-category` | `<select>` | `renderList()` reads value |
| `filter-status` | `<select>` | `renderList()` reads value |
| `event-list` | `<div>` | Delegated listeners, `innerHTML` target |
| `problem` | section | Nav link target |
| `team-heading` | `<h3>` | Anchor target |
| `message` | toast div | `notify()` |
| `about-modal` | dialog div | `openAbout()`, `closeAbout()` |
| `about-title` | `<h2>` | `aria-labelledby` on the dialog |
| `close-about` | `<button>` | Close listener, initial focus target |

---

## 15. Viva questions and answers

**Q: Walk me through what happens when a student registers.**
They expand the Registrations section (native `<details>`), fill three fields and submit. The submit event bubbles to `#event-list`, where one delegated handler catches it, checks `matches('.register-form')`, and calls `registerStudent()` with the event id from the form's `data-event-id`. That function validates name length, student ID format, email format, that the event is not past, that seats remain, and that this student ID is not already confirmed. On success it appends a registration object with status Confirmed, saves to localStorage, re-renders the dashboard and the list, and shows a green toast. On failure it joins the errors into one toast and returns without touching state.

**Q: How do you prevent overbooking?**
`seatsLeft()` is `Math.max(0, capacity - confirmedCount(event))`, and `registerStudent()` refuses when it is zero. Because `confirmedCount()` counts only `Confirmed` records, cancelling frees the seat again. `validateEvent()` also refuses an edit that lowers capacity below the number already confirmed.

**Q: Why is a cancelled registration kept rather than deleted?**
Deleting would lose the record of who registered, and would make it impossible to show that a seat was released. Changing the status to `Cancelled` keeps the history, and every count goes through `confirmedCount()` which filters on status — so the seat is freed without special-casing.

**Q: Why event delegation instead of attaching listeners to each button?**
`renderList()` replaces the entire list with `innerHTML` on every change, so any listener attached to a button inside a card is destroyed with it. A listener on `#event-list` itself survives every re-render, because that container is never replaced. It is also one listener instead of dozens.

**Q: What does `escapeHtml()` protect against, and where is it used?**
Stored cross-site scripting. A user could type a title like `<img src=x onerror=...>`; because titles are interpolated into template strings that become real HTML, that markup would execute. `escapeHtml()` converts `&`, `<`, `>`, `"` and `'` to entities, and it wraps every user-supplied value in `eventCardHtml()` and `registrationListHtml()`.

**Q: Why does `updateEvents()` save before changing the in-memory array?**
So a failed save cannot leave the screen showing data that was never persisted. If `localStorage.setItem` throws — private mode, disabled storage, quota exceeded — the function returns false, `events` keeps its old value, and the UI stays consistent with what is actually on disk.

**Q: How does the status badge get its colour?**
`eventCardHtml()` calls `getStatus()`, lowercases the result and replaces spaces with hyphens, producing `status-almost-full` from `"Almost full"`. That class is defined in `style.css` with the amber background. The JS string and the CSS class are a matched pair.

**Q: How is the page responsive?**
Three media queries. Below 900px the two-column workspace collapses to one and the sticky form becomes static. Below 620px the stats go to 2×2, lists to one column, the nav links scroll horizontally and the footer stacks. Below 380px the form fields and filters go single column. The base layout uses CSS Grid with `min-width: 0` on grid children, which prevents horizontal overflow — verified at 1280, 820, 390 and 340 px with no overflow at any width.

**Q: Why `novalidate` on the forms?**
So there is exactly one validator. If the browser's own validation ran first, it would block submission before `validateEvent()` could run, and the error messages under each field would never appear. Our validator gives consistent, styled, accessible feedback in one place.

**Q: What is the `FIELDS` array for?**
It is the single list of event fields. Three loops use it: reading the form into an object on submit, filling the form when editing, and clearing errors. Adding a field to the form means adding one string here and one block of HTML.

**Q: How is the data persisted?**
`localStorage` under the key `campusEvents`. `loadEvents()` reads and validates it on startup with a try/catch that falls back to sample events; `saveEvents()` writes JSON and returns a boolean. There is no server — each browser has its own data, and that limitation is stated in the README and the About dialog.

**Q: What is `aria-live` doing on the result count?**
It makes a screen reader announce the new count whenever the search changes, without moving focus. Without it, a screen-reader user typing in the search box would have no idea how many results matched.

**Q: How does the capacity bar work?**
`renderDashboard()` sums the capacity of all upcoming events and the confirmed registrations, divides to get a percentage, clamps it with `Math.min(100, ...)` and writes it as the width of `#stat-bar`. The CSS gives the fill a `0.4s` width transition so it animates when a seat is taken.

**Q: If you had more time, what would you add?**
A real backend so registrations are shared across devices, an organizer view with a per-event export, and calendar export (.ics) for registered events. The current architecture supports the first one cleanly: all persistence is behind `saveEvents()` and `loadEvents()`, so swapping localStorage for `fetch` calls would not touch any rendering code.