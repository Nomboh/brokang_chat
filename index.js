import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["https://brokang.netlify.app"],
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Hello Brokang Chat</h1>");
});

let users = [];

const addUser = (socketId, userId, myInfo) => {
  const checkeduser = users.some(u => u.userId === userId);
  if (!checkeduser) {
    users.push({ userId, socketId, myInfo });
  }
};

const removeUser = socketId => {
  users = users.filter(u => u.socketId !== socketId);
};

const findFriends = id => {
  return users.find(u => u.userId === id);
};

io.on("connection", socket => {
  console.log("A user connected");

  socket.on("addUser", (userId, myInfo) => {
    addUser(socket.id, userId, myInfo);
    socket.emit("getUser", users);
  });

  socket.on("sendMessage", message => {
    const user = findFriends(message.recieverId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("getMessage", message);
    }
  });

  socket.on("seenMessage", message => {
    const user = findFriends(message.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("getSeenMessage", message);
    }
  });

  socket.on("deliveredMessage", message => {
    const user = findFriends(message.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("getDeliveredMessage", message);
    }
  });

  socket.on("seen", data => {
    const user = findFriends(data.senderId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("seenSuccess", data);
    }
  });

  socket.on("typingMessage", data => {
    const user = findFriends(data.recieverId);
    if (user !== undefined) {
      socket.to(user.socketId).emit("getTypingMessage", {
        senderId: data.senderId,
        recieverId: data.recieverId,
        message: data.message,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected");
    removeUser(socket.id);
    socket.emit("getUser", users);
  });
});

httpServer.listen(5000);
