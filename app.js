const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const simulateBtn = document.getElementById("simulateBtn");
const exportBtn = document.getElementById("exportBtn");

const trackingState = document.getElementById("trackingState");
const pointCount = document.getElementById("pointCount");
const distanceLabel = document.getElementById("distance");
const latest = document.getElementById("latest");

const canvas = document.getElementById("trackCanvas");
const ctx = canvas.getContext("2d");

let watchId = null;
let points = [];
let totalDistanceKm = 0;
let simulationTimer = null;

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

function setTrackingUi(isRunning) {
  trackingState.textContent = isRunning ? "Running" : "Not running";
  startBtn.disabled = isRunning;
  stopBtn.disabled = !isRunning;
}

function updateStats() {
  pointCount.textContent = points.length;
  distanceLabel.textContent = `${totalDistanceKm.toFixed(2)} km`;

  if (points.length === 0) {
    latest.textContent = "N/A";
    exportBtn.disabled = true;
  } else {
    const p = points[points.length - 1];
    latest.textContent = `${p.lat.toFixed(6)}, ${p.lon.toFixed(6)} @ ${new Date(p.timestamp).toLocaleTimeString()}`;
    exportBtn.disabled = false;
  }
}

function drawPath() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (points.length < 1) return;

  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const pad = 20;
  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;

  const project = (p) => {
    const x = pad + ((p.lon - minLon) / lonRange) * (canvas.width - 2 * pad);
    const y = canvas.height - (pad + ((p.lat - minLat) / latRange) * (canvas.height - 2 * pad));
    return { x, y };
  };

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();

  points.forEach((p, idx) => {
    const { x, y } = project(p);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  const first = project(points[0]);
  const last = project(points[points.length - 1]);

  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(first.x, first.y, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function addPoint(lat, lon) {
  const nextPoint = { lat, lon, timestamp: Date.now() };
  const prevPoint = points[points.length - 1];

  if (prevPoint) {
    totalDistanceKm += haversineKm(prevPoint, nextPoint);
  }

  points.push(nextPoint);
  updateStats();
  drawPath();
}

function stopAllTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (simulationTimer) {
    clearInterval(simulationTimer);
    simulationTimer = null;
  }
  setTrackingUi(false);
}

startBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported in this browser.");
    return;
  }

  stopAllTracking();
  setTrackingUi(true);

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      addPoint(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      alert(`GPS error: ${error.message}`);
      stopAllTracking();
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
});

stopBtn.addEventListener("click", stopAllTracking);

simulateBtn.addEventListener("click", () => {
  stopAllTracking();
  setTrackingUi(true);

  if (points.length === 0) {
    addPoint(37.7749, -122.4194);
  }

  simulationTimer = setInterval(() => {
    const last = points[points.length - 1];
    const latJitter = (Math.random() - 0.5) * 0.002;
    const lonJitter = (Math.random() - 0.5) * 0.002;
    addPoint(last.lat + latJitter, last.lon + lonJitter);
  }, 1000);
});

exportBtn.addEventListener("click", () => {
  const payload = {
    createdAt: new Date().toISOString(),
    totalDistanceKm,
    points,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gps-track-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

updateStats();
drawPath();
