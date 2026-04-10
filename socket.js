// socket.js
const jwt = require("jsonwebtoken");
let ioInstance;

const joinUserRoom = (io, socket, userId) => {
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    return null;
  }

  const room = `user_${normalizedUserId}`;
  const alreadyJoined = socket.rooms.has(room);

  if (!alreadyJoined) {
    socket.join(room);
  }

  const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;

  if (!alreadyJoined) {
    console.log(`[socket] ${socket.id} registered in ${room}; sockets=${roomSize}`);
  }

  return {
    room,
    sockets: roomSize
  };
};

module.exports = (io) => {

  ioInstance = io;

  io.on("connection", (socket) => {

    console.log("🔌 user connected");

    const token = socket.handshake.auth?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        joinUserRoom(io, socket, decoded.id);
      } catch (error) {
        console.error(`[socket] auth failed for ${socket.id}: ${error.message}`);
      }
    }

    socket.on("register", (userId, ack) => {
      const registration = joinUserRoom(io, socket, userId);

      if (!registration) {
        if (typeof ack === "function") {
          ack({ success: false, message: "Invalid user id" });
        }
        return;
      }

      if (typeof ack === "function") {
        ack({ success: true, ...registration });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ user disconnected");
    });

  });

};

// 👇 чтобы дергать из любого места
module.exports.getIO = () => {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
};
