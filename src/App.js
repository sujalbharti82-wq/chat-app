import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const API = "https://chat-app-370t.onrender.com";
const socket = io(API);

function App() {
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [messages, setMessages] = [];

  const [typing, setTyping] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const bottomRef = useRef(null);

  // LOGIN
  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data) {
      setUser({ username });
    } else {
      alert("Wrong credentials");
    }
  };

  // REGISTER
  const register = async () => {
    await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    alert("Registered!");
    setIsRegister(false);
  };

  // JOIN ROOM
  const joinRoom = () => {
    socket.emit("join_room", { room, username });
    setShowChat(true);
  };

  // SEND MESSAGE
  const sendMessage = () => {
    const data = {
      room,
      author: username,
      message,
      image,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", data);
    setMessage("");
  };

  // 🔥 CLEAR CHAT FIXED
  const clearChat = () => {
    socket.emit("clear_chat", { room });
  };

  // LOGOUT
  const logout = () => {
    socket.emit("leave_room", username);
    setUser(null);
    setShowChat(false);
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((list) => [...list, data]);
    });

    socket.on("online_users", setOnlineUsers);

    socket.on("load_messages", (msgs) => {
      setMessages(msgs);
    });

    return () => {
      socket.off();
    };
  }, []);

  if (!user) {
    return (
      <div className="auth">
        <div className="box">
          <h2>{isRegister ? "Register" : "Login"}</h2>

          <input onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

          <button onClick={isRegister ? register : login}>
            {isRegister ? "Register" : "Login"}
          </button>

          <p onClick={() => setIsRegister(!isRegister)}>
            Switch
          </p>
        </div>
      </div>
    );
  }

  if (!showChat) {
    return (
      <div className="auth">
        <div className="box">
          <h2>Join Room</h2>
          <input onChange={(e) => setRoom(e.target.value)} placeholder="Room" />
          <button onClick={joinRoom}>Join</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="sidebar">
        <h3>Online</h3>
        {onlineUsers.map((u, i) => (
          <div key={i}>🟢 {u.username}</div>
        ))}
      </div>

      <div className="chat">
        <div className="header">
          Room: {room} | You: {username}
          <button onClick={logout}>Logout</button>
          <button onClick={clearChat}>Clear</button>
        </div>

        <div className="body">
          {messages.map((msg, i) => (
            <div key={i}>
              <b>{msg.author}</b>
              <p>{msg.message}</p>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        <div className="footer">
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;