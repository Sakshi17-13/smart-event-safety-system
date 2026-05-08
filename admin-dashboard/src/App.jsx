import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const socket = io("http://localhost:5000");

const defaultCenter = [20.5937, 78.9629];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function formatTimestamp(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function isValidCoordinate(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function getSeverity(alert) {
  const status = (alert.status || "").toLowerCase();
  const type = (alert.alertType || "").toLowerCase();
  const message = (alert.message || "").toLowerCase();

  if (status.includes("critical") || type.includes("critical") || message.includes("critical")) {
    return "critical";
  }

  if (status.includes("warning") || type.includes("warning")) {
    return "warning";
  }

  if (status.includes("resolved") || status.includes("safe")) {
    return "resolved";
  }

  return "active";
}

function getSeverityLabel(severity) {
  if (severity === "critical") return "Critical";
  if (severity === "warning") return "Warning";
  if (severity === "resolved") return "Resolved";
  return "Active";
}

function AutoCenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);

  return null;
}

function App() {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onNewAlert(data) {
      const latitude = Number(data?.latitude);
      const longitude = Number(data?.longitude);

      setAlerts((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          message: data?.message || "SOS alert received",
          username: data?.username || "anonymous",
          status: data?.status || "Active",
          alertType: data?.alertType || "SOS",
          timestamp: data?.timestamp || new Date().toISOString(),
          location: data?.location || "unknown",
          latitude,
          longitude,
          safeRadiusMeters: Number(data?.safeRadiusMeters ?? 0),
          safeCenterLatitude: Number(data?.safeCenterLatitude),
          safeCenterLongitude: Number(data?.safeCenterLongitude)
        },
        ...prev
      ]);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new-alert", onNewAlert);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new-alert", onNewAlert);
    };
  }, []);

  const activeCount = useMemo(
    () => alerts.filter((alert) => getSeverity(alert) === "active").length,
    [alerts]
  );

  const warningCount = useMemo(
    () => alerts.filter((alert) => getSeverity(alert) === "warning").length,
    [alerts]
  );

  const criticalCount = useMemo(
    () => alerts.filter((alert) => getSeverity(alert) === "critical").length,
    [alerts]
  );

  const resolvedCount = useMemo(
    () => alerts.filter((alert) => getSeverity(alert) === "resolved").length,
    [alerts]
  );

  const markerAlerts = useMemo(
    () => alerts.filter((alert) => isValidCoordinate(alert.latitude, alert.longitude)),
    [alerts]
  );

  const mapCenter = markerAlerts.length
    ? [markerAlerts[0].latitude, markerAlerts[0].longitude]
    : defaultCenter;

  const geofenceSourceAlert = useMemo(
    () =>
      alerts.find((alert) =>
        isValidCoordinate(alert.safeCenterLatitude, alert.safeCenterLongitude)
      ),
    [alerts]
  );

  const geofenceCenter = geofenceSourceAlert
    ? [geofenceSourceAlert.safeCenterLatitude, geofenceSourceAlert.safeCenterLongitude]
    : null;
  const geofenceRadius = geofenceSourceAlert?.safeRadiusMeters || 0;
  const latestNotifications = alerts.slice(0, 8);
  const recentIncidents = alerts.slice(0, 5);

  const geofenceBreachesCount = useMemo(
    () =>
      alerts.filter((alert) => {
        const type = (alert.alertType || "").toLowerCase();
        const message = (alert.message || "").toLowerCase();
        return type.includes("geofence") || message.includes("geofence");
      }).length,
    [alerts]
  );

  const chartData = useMemo(() => {
    const countsByMinute = new Map();
    const now = new Date();

    for (let i = 11; i >= 0; i -= 1) {
      const bucket = new Date(now.getTime() - i * 60 * 1000);
      const key = bucket.toISOString().slice(0, 16);
      countsByMinute.set(key, 0);
    }

    alerts.forEach((alert) => {
      const timestamp = new Date(alert.timestamp);
      if (Number.isNaN(timestamp.getTime())) return;
      const key = timestamp.toISOString().slice(0, 16);
      if (countsByMinute.has(key)) {
        countsByMinute.set(key, countsByMinute.get(key) + 1);
      }
    });

    return Array.from(countsByMinute.entries()).map(([key, count]) => ({
      time: key.slice(11).replace(":", "."),
      alerts: count
    }));
  }, [alerts]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2 className="logo">Sentinel Ops</h2>
        <p className="sidebar-subtext">Emergency Monitoring</p>
        <nav className="sidebar-nav">
          <a href="#overview" className="nav-item active">Overview</a>
          <a href="#analytics" className="nav-item">Analytics</a>
          <a href="#map" className="nav-item">Map Intelligence</a>
          <a href="#alerts" className="nav-item">Incident Feed</a>
          <a href="#notifications" className="nav-item">Notifications</a>
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <h1>Real-Time SOS Dashboard</h1>
            <p className="subtitle">
              Socket:{" "}
              <span className={isConnected ? "status-ok" : "status-bad"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </p>
          </div>
          <p className="topbar-note">Live monitoring with geofence awareness</p>
        </header>

        <section id="overview" className="stats-grid">
          <article className="stat-card">
            <p>Total Incidents</p>
            <h3>{alerts.length}</h3>
          </article>
          <article className="stat-card active">
            <p>Active</p>
            <h3>{activeCount}</h3>
          </article>
          <article className="stat-card warning">
            <p>Warnings</p>
            <h3>{warningCount}</h3>
          </article>
          <article className="stat-card warning">
            <p>Geofence Breaches</p>
            <h3>{geofenceBreachesCount}</h3>
          </article>
          <article className="stat-card critical">
            <p>Critical</p>
            <h3>{criticalCount}</h3>
          </article>
          <article className="stat-card resolved">
            <p>Resolved</p>
            <h3>{resolvedCount}</h3>
          </article>
        </section>

        <section id="analytics" className="analytics-grid">
          <article className="analytics-card chart-card">
            <div className="section-header">
              <h2>Alerts Over Time (Last 12 min)</h2>
              <p>Realtime updates</p>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="alertsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: "10px",
                      color: "#e2e8f0"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#alertsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="analytics-card recent-card">
            <div className="section-header">
              <h2>Most Recent Incidents</h2>
              <p>{recentIncidents.length} incidents</p>
            </div>
            {recentIncidents.length === 0 ? (
              <p className="empty-notification">No incidents in stream yet.</p>
            ) : (
              <ul className="recent-incident-list">
                {recentIncidents.map((incident) => {
                  const severity = getSeverity(incident);
                  return (
                    <li key={`recent-${incident.id}`} className={`recent-incident-item ${severity}`}>
                      <div>
                        <p className="notification-title">{incident.message}</p>
                        <p className="notification-meta">
                          {incident.username} | {formatTimestamp(incident.timestamp)}
                        </p>
                      </div>
                      <span className={`severity-badge ${severity}`}>
                        {getSeverityLabel(severity)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>

        <section className="content-grid">
          <section id="map" className="map-section">
            <div className="section-header">
              <h2>Live Incident Map</h2>
              <p>
                {markerAlerts.length} markers
                {geofenceCenter && geofenceRadius > 0
                  ? ` | Geofence ${Math.round(geofenceRadius)}m`
                  : ""}
              </p>
            </div>
            <div className="map-wrapper">
              <MapContainer center={mapCenter} zoom={5} scrollWheelZoom className="leaflet-map">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <AutoCenterMap center={mapCenter} />
                {geofenceCenter && geofenceRadius > 0 ? (
                  <Circle
                    center={geofenceCenter}
                    radius={geofenceRadius}
                    pathOptions={{ color: "#60a5fa", fillColor: "#2563eb", fillOpacity: 0.14 }}
                  />
                ) : null}
                {markerAlerts.map((alert) => {
                  const severity = getSeverity(alert);
                  return (
                    <Marker
                      key={alert.id}
                      position={[alert.latitude, alert.longitude]}
                      icon={markerIcon}
                    >
                      <Popup>
                        <strong>{alert.message}</strong>
                        <br />
                        Severity: {getSeverityLabel(severity)}
                        <br />
                        User: {alert.username}
                        <br />
                        Time: {formatTimestamp(alert.timestamp)}
                        <br />
                        Location: {alert.location}
                        <br />
                        Type: {alert.alertType}
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </section>
          <aside id="notifications" className="notification-panel">
            <div className="section-header">
              <h2>Realtime Notifications</h2>
            </div>
            {latestNotifications.length === 0 ? (
              <p className="empty-notification">No notifications yet.</p>
            ) : (
              <ul className="notification-list">
                {latestNotifications.map((alert) => {
                  const severity = getSeverity(alert);
                  return (
                    <li key={alert.id} className={`notification-item ${severity}`}>
                      <div>
                        <p className="notification-title">{alert.message}</p>
                        <p className="notification-meta">
                          {alert.username} | {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                      <span className={`severity-badge ${severity}`}>
                        {getSeverityLabel(severity)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </section>

        <main id="alerts" className="alerts-grid">
          {alerts.length === 0 ? (
            <div className="empty-state">
              <h3>No alerts yet</h3>
              <p>Incoming SOS alerts will appear here in real time.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const severity = getSeverity(alert);
              return (
                <article key={alert.id} className={`alert-card ${severity}`}>
                  <div className="alert-top">
                    <h3>{alert.message}</h3>
                    <span className={`severity-badge ${severity}`}>
                      {getSeverityLabel(severity)}
                    </span>
                  </div>
                  <p className="alert-time">{formatTimestamp(alert.timestamp)}</p>
                  <p>User: {alert.username}</p>
                  <p>Type: {alert.alertType}</p>
                  <p>Location: {alert.location}</p>
                  <p>
                    Coordinates:{" "}
                    {isValidCoordinate(alert.latitude, alert.longitude)
                      ? `${alert.latitude.toFixed(6)}, ${alert.longitude.toFixed(6)}`
                      : "Not available"}
                  </p>
                </article>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}

export default App;