const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// 🔥 MONGODB CONNECT
mongoose.connect("mongodb+srv://sujalbharti82_db_user:sujal1725@cluster0.ptkvdkk.mongodb.net/chatapp")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// 🔥 USER SCHEMA
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
});
const User = mongoose.model("User", UserSchema);

// 🔥 MESSAGE SCHEMA
const MessageSchema = new mongoose.Schema({
  room: String,
  author: String,
  avatar: String,
  message: String,
  image: String,
  time: String,
  status: String,
});
const Message = mongoose.model("Message", MessageSchema);

// ======================
// ✅ AUTH APIs
// ======================

// REGISTER
app.post("/register", async (req, res) => {
  const { username, password, avatar } = req.body;

  const existing = await User.findOne({ username });
  if (existing) {
    return res.json({ success: false, message: "User already exists" });
  }

  const user = new User({ username, password, avatar });
  await user.save();

  res.json({ success: true });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  res.json(user || null);
});

// ✅🔥 GET ALL USERS (IMPORTANT FIX)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================
// SOCKET.IO
// ======================

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let roomUsers = {};

io.on("connection", (socket) => {

  socket.on("join_room", async ({ room, username, avatar }) => {
    socket.join(room);

    if (!roomUsers[room]) roomUsers[room] = [];

    // duplicate avoid
    if (!roomUsers[room].some(u => u.username === username)) {
      roomUsers[room].push({ username, avatar });
    }

    const messages = await Message.find({ room });
    socket.emit("load_messages", messages);

    io.to(room).emit("online_users", roomUsers[room]);
  });

  socket.on("send_message", async (data) => {
    const newMessage = new Message({
      ...data,
      status: "sent",
    });

    await newMessage.save();

    io.to(data.room).emit("receive_message", {
      ...data,
      status: "sent",
    });
  });

  socket.on("message_seen", ({ room }) => {
    io.to(room).emit("message_seen");
  });

  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("typing", username);
  });

  socket.on("stop_typing", ({ room }) => {
    socket.to(room).emit("stop_typing");
  });

  socket.on("disconnect", () => {});
});

// ✅ PORT FIX (RENDER)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});