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
  const [messages, setMessages] = useState([]);

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

    alert("Registered");
    setIsRegister(false);
  };

  // JOIN
  const joinRoom = () => {
    if (!room) return alert("Enter room");

    socket.emit("join_room", { room, username });
    setShowChat(true);
  };

  // SEND
  const sendMessage = () => {
    if (!message) return;

    const data = {
      room,
      author: username,
      message,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", data);
    setMessage("");
  };

  // 🧹 CLEAR CHAT
  const clearChat = async () => {
    await fetch(`${API}/clear/${room}`, { method: "DELETE" });
    setMessages([]);
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    setShowChat(false);
    setMessages([]);
    setOnlineUsers([]);
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((list) => [...list, data]);
    });

    socket.on("load_messages", (data) => {
      setMessages(data);
    });

    socket.on("online_users", setOnlineUsers);

    return () => {
      socket.off();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // LOGIN UI
  if (!user) {
    return (
      <div className="auth">
        <div className="box">
          <h2>{isRegister ? "Register" : "Login"}</h2>

          <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

          <button onClick={isRegister ? register : login}>
            {isRegister ? "Register" : "Login"}
          </button>

          <p onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login" : "Create account"}
          </p>
        </div>
      </div>
    );
  }

  // JOIN UI
  if (!showChat) {
    return (
      <div className="auth">
        <div className="box">
          <h2>Join Room</h2>
          <input value={room} onChange={(e) => setRoom(e.target.value)} />
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
            <div key={i} className={msg.author === username ? "own" : "msg"}>
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