const config = require("./config");
const WebSocket = require("ws");

function WebSocketLuno() {
  const ws = new WebSocket("wss://ws.luno.com/api/1/stream/XBTZAR");

  let orderBook = {
    asks: [],
    bids: [],
  };

  ws.on("open", function open() {
    ws.send(
      JSON.stringify({
        api_key_id: config.luno_key,
        api_key_secret: config.luno_secret,
      })
    );
  });

  ws.on("message", function incoming(data) {
    const message = JSON.parse(data);

    // Initialize order book with the current state
    if (message.asks && message.bids) {
      // Store only the top 40 asks and bids
      orderBook.asks = message.asks.slice(0, 40).map((ask) => ({
        id: ask.id,
        price: parseFloat(ask.price),
        volume: parseFloat(ask.volume),
      }));
      //console.log("Current State of Top 40 Asks:", orderBook.asks);

      orderBook.bids = message.bids.slice(0, 40).map((bid) => ({
        id: bid.id,
        price: parseFloat(bid.price),
        volume: parseFloat(bid.volume),
      }));
      //console.log("Current State of Top 20 Bids:", orderBook.bids);
    }

    // Process 'Create' updates
    if (message.create_update) {
      const order = {
        id: message.create_update.order_id,
        price: parseFloat(message.create_update.price),
        volume: parseFloat(message.create_update.volume),
      };

      if (message.create_update.type === "BID") {
        orderBook.bids.push(order);
      } else if (message.create_update.type === "ASK") {
        orderBook.asks.push(order);
      }
    }

    // Process 'Delete' updates
    if (message.delete_update) {
      orderBook.bids = orderBook.bids.filter(
        (order) => order.id !== message.delete_update.order_id
      );
      orderBook.asks = orderBook.asks.filter(
        (order) => order.id !== message.delete_update.order_id
      );
    }

    // Process 'Trade' updates
    if (message.trade_updates) {
      message.trade_updates.forEach((trade) => {
        const orderId = trade.maker_order_id; // Assuming 'maker_order_id' is the ID of the order being updated
        const tradeVolume = parseFloat(trade.base);

        // Update bids
        orderBook.bids.forEach((bid, index) => {
          if (bid.id === orderId) {
            bid.volume -= tradeVolume;
            if (bid.volume <= 0) {
              orderBook.bids.splice(index, 1); // Remove order if volume is zero
            }
          }
        });

        // Update asks
        orderBook.asks.forEach((ask, index) => {
          if (ask.id === orderId) {
            ask.volume -= tradeVolume;
            if (ask.volume <= 0) {
              orderBook.asks.splice(index, 1); // Remove order if volume is zero
            }
          }
        });
      });

      // Sort and keep top 20 orders
      orderBook.bids.sort((a, b) => b.price - a.price); // Descending sort for bids
      orderBook.asks.sort((a, b) => a.price - b.price); // Ascending sort for asks
      orderBook.bids = orderBook.bids.slice(0, 20);
      orderBook.asks = orderBook.asks.slice(0, 20);

      // Print the top ask and bid
      if (orderBook.asks.length > 0 && orderBook.bids.length > 0) {
        console.log("Top Ask:", orderBook.asks[0]);

        // Calculate and print the spread
        const spread = orderBook.asks[0].price - orderBook.bids[0].price;
        console.log("Spread:", spread);

        console.log("Top Bid:", orderBook.bids[0]);
      } else {
        console.log("Order book is currently empty.");
      }
    }

    ws.on("close", function close() {
      console.log("WebSocket disconnected. Reconnecting in 5 seconds...");
      setTimeout(WebSocketLuno, 5000);
    });

    ws.on("error", function error(e) {
      console.log("Error with WebSocket connection:", e);
    });
  });
}

WebSocketLuno();
