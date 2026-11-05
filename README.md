# Campus Event Discovery & Registration Hub

A responsive web app for finding campus events, registering for a seat, and tracking how full each event is. It is built for CSE326 CA1 with plain HTML, CSS and JavaScript only.

## How to run it

1. Open the folder `CSE-326`.
2. Double-click `index.html`. It opens in your browser.
3. Your changes are saved in that browser. Use a different browser and you will see the sample events again.

## Files

| File | What it does |
|------|--------------|
| `index.html` | The page structure: dashboard, add/edit form, search and filters, event list. |
| `style.css` | Colours, layout and the responsive rules (media queries at 600px and 960px). |
| `script.js` | The logic: storing data, validating forms, filtering, drawing cards, and handling clicks. |
| `README.md` | This explanation. |

## Features and where they are

| Requirement from the CA1 notes | How it is met |
|--------------------------------|---------------|
| Responsive web interface | Mobile first in `style.css`. Cards are one column on phones, two on tablets, three on desktops. |
| Structured forms for adding and updating records | The event form in `index.html`. Its **Edit** button fills the form with the event's data. |
| Search, filtering and categories | Search box, category dropdown and status dropdown. The `getVisibleEvents` function in `script.js` applies them. |
| Status and progress tracking | Each card shows a status: Open, Almost full, Full or Past (`getStatus`). Each registration shows Confirmed or Cancelled. |
| Dashboard or summary view | Four numbers at the top, filled in by `renderDashboard`. |
| Input validation and clear messages | `validateEvent` and `validateRegistration` return the errors. Field errors appear under each box, and a message appears at the bottom of the screen. |
| Registration limits | Each event has a seat count. A registration is refused when the event is full, past, or the student ID is already registered. |

## How the code is organised

- **Data**: one list called `events`. Each event holds its details and a list of registrations.
- **Saving**: `loadEvents` and `saveEvents` use `localStorage`, the browser's built-in storage.
- **Changing data**: functions such as `addEvent`, `updateEvent` and `addRegistration` return a **new** list. They never change the old one. Then `commit` saves the list and redraws the page.
- **Drawing**: `renderAll` calls `renderDashboard` and `renderEventList`. Each card is built as an HTML string by `createEventCard`.
- **Clicks**: one listener on the event list handles every button. This is called event delegation.
- **Safety**: `escapeHtml` is applied to every value the user types before it goes into the page. This stops typed text from running as HTML.

## Words to know for the viva

- **HTML**: the structure of the page.
- **CSS**: how the page looks. Media queries change the layout when the screen gets wider.
- **JavaScript**: makes the page respond to clicks and typing.
- **DOM**: the page as JavaScript sees it. `document.getElementById` finds an element in it.
- **localStorage**: data kept in the browser, even after it is closed. It belongs to one browser on one computer.
- **Validation**: checking input before using it. The form uses `novalidate`, so the browser's own popups are off and our messages are used instead.
- **Event delegation**: one listener on a parent element handles clicks from its children.
- **Immutability**: creating a new list instead of changing the old one. It makes bugs easier to find.

## Limits (say these at viva)

- There is no server, so the data is not shared between computers or users.
- There is no login. Anyone using the browser can register anyone.
- The sample events appear only when storage is empty. Clear them with `localStorage.removeItem('campusEvents')` in the browser console.
- Editing an event that has already passed is blocked, because the date must be in the future.

## Next steps

- Publish the folder on GitHub Pages so it has a public link.
- Record the video presentation and fill in the Excel submission sheet.

## CSE326 Submission Details

- **Project Title**: Campus Event Discovery & Registration Hub
- **GitHub Repo**: https://github.com/arshadhassan5615-sketch/Campus-Event-Discovery-Registration-Hub
- **Deployed Link**: (Add after deployment)
- **Video Presentation**: (Add after recording)
