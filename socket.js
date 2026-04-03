// socket.js
let ioInstance;

module.exports = (io) => {

  ioInstance = io;

  io.on("connection", (socket) => {

    console.log("🔌 user connected");

    socket.on("register", (userId) => {
      socket.join(`user_${userId}`);
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