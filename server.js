// server.js
const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.SERVER_PORT || 3002;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_CLIENT_URL, // set this in production env
      methods: ["GET", "POST"],
    },
  });

  let sockets = new Set();
  let lastTimestamp = null;

  io.on("connection", (socket) => {
    sockets.add(socket);
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      sockets.delete(socket);
      console.log("Client disconnected:", socket.id);
    });
  });

  setInterval(async () => {
    try {
      const weatherApi = dev
        ? "http://localhost:3001/api/weather"
        : `${process.env.NEXT_PUBLIC_CLIENT_URL}/api/weather`; // set this in production

      const res = await fetch(weatherApi);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) return;

      const latest = data[0];
      console.log("Fetched latest timestamp:", latest.timestamp);
      console.log("Last known timestamp:", lastTimestamp);


      if (latest.timestamp !== lastTimestamp) {
        lastTimestamp = latest.timestamp;
        for (const socket of sockets) {
          socket.emit("weatherUpdate", latest);
        }
        console.log("Broadcasted new weather data");
      }
    } catch (err) {
      console.error("Polling error:", err.message);
    }
  }, 2000); // 2-second polling interval

  server.listen(PORT, () => {
    const protocol = dev ? "http" : "https";
    const host = process.env.HOST || "localhost";
    console.log(`Server running at ${protocol}://${host}:${PORT}`);
  });
  
});
