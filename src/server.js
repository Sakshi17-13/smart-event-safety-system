require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const registerAlertSocket = require("./sockets/alertSocket");
const { getSocketIoCorsOrigin } = require("./config/cors");

const PORT = Number.parseInt(process.env.PORT || "5000", 10);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getSocketIoCorsOrigin(),
    methods: ["GET", "POST"],
  },
});

registerAlertSocket(io);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});