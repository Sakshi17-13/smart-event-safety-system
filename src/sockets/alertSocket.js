module.exports = function registerAlertSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("sos-alert", (data) => {
      console.log("SOS RECEIVED:", data);

      const alertData = {
        message: data?.message || "SOS alert triggered",
        username: data?.username || "anonymous",
        timestamp: data?.timestamp || new Date().toISOString(),
        location: data?.location || "unknown",
        latitude: Number(data?.latitude ?? 0),
        longitude: Number(data?.longitude ?? 0),
        status: data?.status || "Active",
        alertType: data?.alertType || "SOS",
        safeRadiusMeters: Number(data?.safeRadiusMeters ?? 500),
        safeCenterLatitude: Number(data?.safeCenterLatitude ?? 0),
        safeCenterLongitude: Number(data?.safeCenterLongitude ?? 0),
      };

      io.emit("new-alert", alertData);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};