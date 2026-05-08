require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const registerAlertSocket = require("./sockets/alertSocket");
const connectDatabase = require("./config/db");

const PORT = 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerAlertSocket(io);

async function startServer() {
  try {
    console.log("Skipping MongoDB connection");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
