const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Test route (important)
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// 🔥 MongoDB Atlas
mongoose.connect("mongodb+srv://sujalbharti82_db_user:sujal1725@cluster0.ptkvdkk.mongodb.net/chatapp")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// 🔥 USER schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
});
const User = mongoose.model("User", UserSchema);

// 🔥 MESSAGE schema
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

// 🔥 AUTH APIs

app.post("/register", async (req, res) => {
  const { username, password, avatar } = req.body;
  const user = new User({ username, password, avatar });
  await user.save();
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  res.json(user || null);
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let roomUsers = {};

io.on("connection", (socket) => {

  socket.on("join_room", async ({ room, username, avatar }) => {
    socket.join(room);

    if (!roomUsers[room]) roomUsers[room] = [];
    roomUsers[room].push({ username, avatar });

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

// ✅ IMPORTANT (Render fix)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});