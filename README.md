# Campus Event Discovery & Registration Hub

A responsive campus event discovery and registration application built for the CSE 326 problem-statement project by Team Obsidian. It uses plain HTML, CSS and JavaScript.

## Run locally

Open `index.html` in a modern browser. No build tools or packages are required. Event data is saved in that browser with `localStorage`; it is not synchronized between users or devices. Sample events appear on a first visit. To reset them, run `localStorage.removeItem('campusEvents')` in the browser console and reload.

## Features

- Responsive dashboard: total events, upcoming events, confirmed registrations and available seats.
- Add, edit and delete event records with validation and clear feedback.
- Search by title, venue or description; filter by category or status.
- Open, Almost full, Full and Past status tracking.
- Student registration with name, student ID and email validation, duplicate prevention and capacity limits.
- Cancel confirmed registrations; update event status and dashboard counts.
- About dialog with team information; user-entered text is escaped before display.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, dashboard, forms, event list and About dialog. |
| `style.css` | Responsive layout, visual styles and component states. |
| `script.js` | Validation, workflows, rendering and browser-local storage. |

## Important limitation

This is a front-end demonstration, not a multi-user production service. There is no server, authentication or shared database. Each browser stores its own data. Registration entries are demonstration records, not official campus bookings.

## Team Obsidian

| Team member | Registration number |
| --- | --- |
| Akshay R Pillai | 12606521 |
| Arshad Hasanulbanna | 12610513 |
| Rishabh Kumar | 12612282 |

- Course: CSE 326
- Project: Campus Event Discovery & Registration Hub
- Technology: HTML, CSS and JavaScript

## Submission links

- GitHub repository: https://github.com/arshadhassan5615-sketch/Campus-Event-Discovery-Registration-Hub
- Deployed project: Add the verified public URL after deployment.
- Team video presentation: Add the verified video URL after recording with all three members.
