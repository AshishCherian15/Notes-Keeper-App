# Notes Keeper App

A lightweight full-stack app for creating, saving, searching, editing, and deleting personal notes with username/password authentication.

## Features

*   **Authentication:** Register and sign in with JWT-backed sessions and bcrypt password hashing.
*   **Create Notes:** Add notes with a title and content.
*   **Auto-Persist:** Notes save immediately and stay in sync with the server.
*   **Manage Notes:** Edit or delete notes from a clean card-based interface.
*   **Search Notes:** Filter notes instantly by keyword.
*   **Responsive UI:** Works on desktop and mobile screens.

## Tech Stack

*   **Frontend:** React, Vite, CSS, Lucide React, motion.
*   **Backend:** Node.js, Express.js.
*   **Database:** SQLite with better-sqlite3.
*   **Authentication:** JWT and bcryptjs.

## Setup

1. Install Node.js.
2. Run \`npm install\`.
3. Run \`npm run dev\` to start the app locally.
4. Open the local URL shown in the terminal.

## Production Build

Run \`npm run build\` to create the production bundle, then \`npm start\` to launch the built server.

## Notes

The app creates a local SQLite database file on first run. The generated database files are ignored so they do not need to be pushed to GitHub.
