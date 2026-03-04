# GPS Tracking App (Personal/Consent-Based)

This project is a **personal GPS tracking web app** designed for:

- Tracking **your own phone**
- Tracking **your own vehicle** (when the phone is in your car)
- A **delivery tracking simulation** for learning
- A **college project demo** that emphasizes user consent

> ⚠️ This app is for ethical, consent-based use only. Never track someone without permission.

## Features

- Live location capture with the browser Geolocation API
- Path history and total distance traveled
- One-click start/stop tracking
- Export tracked points as JSON
- Simulation mode for project demos (no real GPS required)

## Run locally

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000`

## Project files

- `index.html` – app layout and controls
- `styles.css` – UI styling
- `app.js` – tracking logic, simulation, distance math, export

## Ideas to extend

- Save sessions in a backend (Flask/FastAPI/Node)
- Add geofencing alerts
- Show speed charts
- Add role-based login for fleet demo projects
