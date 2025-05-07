// server.js
const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");
const { CosmosClient } = require("@azure/cosmos");
require("dotenv").config();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3002;

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = cosmosClient.database("weatherReadings");
const container = database.container("data");

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: dev
        ? "http://localhost:3001"
        : process.env.NEXT_PUBLIC_CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  let sockets = new Set();

  io.on("connection", (socket) => {
    sockets.add(socket);
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      sockets.delete(socket);
      console.log("Client disconnected:", socket.id);
    });

    socket.on("error", (err) => {
      console.error("⚠️ Socket error:", err);
    });
  });

  // === Cosmos DB Change Feed Setup ===
  const startChangeFeedListener = async () => {
    const iterator = container.items.getChangeFeedIterator({
      startFromBeginning: true,
      maxItemCount: 1,
    });

    console.log("📡 Listening to Cosmos DB Change Feed...");

    for await (const page of iterator.getAsyncIterator()) {
      for (const item of page.result) {
        console.log("🔄 New change detected:", item);

        // Convert temperature from Celsius to Fahrenheit
        if (item.temperature !== null && item.temperature !== undefined) {
          item.temperature = Math.round(((item.temperature * 9/5) + 32) * 10) / 10; // Convert to Fahrenheit
        }

        // Convert wind speed and gust from kph to mph
        if (item.windSpeed !== null && item.windSpeed !== undefined) {
          item.windSpeed = Math.round(item.windSpeed * 0.621371 * 10) / 10; // Convert kph to mph
        }

        if (item.windGust !== null && item.windGust !== undefined) {
          item.windGust = Math.round(item.windGust * 0.621371 * 10) / 10; // Convert kph to mph
        }

        // Emit to all connected sockets with updated data
        for (const socket of sockets) {
          socket.emit("weatherUpdate", item);
        }
      }
    }
  };

  startChangeFeedListener().catch((err) =>
    console.error("❌ Change Feed Error:", err)
  );

  server.listen(PORT, () => {
    const protocol = dev ? "http" : "https";
    const host = process.env.HOST || "localhost";
    console.log(`🚀 Server running at ${protocol}://${host}:${PORT}`);
  });
});
