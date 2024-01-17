const config = require("./config");
const WebSocket = require("ws");

(" ------------------------------------------------------------------ Websocket Luno ------------------------------------------------------------------ ");

const ws = new WebSocket("wss://ws.luno.com/api/1/stream/XBTZAR");

(" ------------------------------------------------------------------ Local Order book Luno ------------------------------------------------------------------ ");

luno_asks = {};
luno_bids = {};

(" ------------------------------------------------------------------ Updating Order book Luno ------------------------------------------------------------------ ");

ws.on("open", function open() {
  ws.send(
    JSON.stringify({
      api_key_id: config.luno_key,
      api_key_secret: config.luno_secret,
    })
  );
});

ws.on("message", function incoming(data) {
  // Update your local order book state based on the message
  console.log(data);
});

// Add error handling and reconnection logic
