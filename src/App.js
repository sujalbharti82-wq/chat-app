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
  const [messages, setMessages] = useState([]);

  const [typing, setTyping] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const bottomRef = useRef(null);

  // 🔐 LOGIN
  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data) {
      setUser({ username });
      setRoom(""); // 🔥 fix
    } else {
      alert("Wrong credentials");
    }
  };

  // 🔐 REGISTER
  const register = async () => {
    await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    alert("Registered! Login karo");
    setIsRegister(false);
  };

  // 🔥 JOIN ROOM
  const joinRoom = () => {
    if (room.trim() !== "") {
      socket.emit("join_room", { room, username });
      socket.emit("join", username);
      setShowChat(true);
    } else {
      alert("Enter room id");
    }
  };

  // 📸 IMAGE
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  // 💬 SEND
  const sendMessage = () => {
    if (message.trim() !== "" || image !== "") {
      const data = {
        room,
        author: username,
        message,
        image,
        time: new Date().toLocaleTimeString(),
      };

      socket.emit("send_message", data);

      setMessage("");
      setImage("");
    }
  };

  // ⌨️ TYPING
  const handleTyping = (e) => {
    setMessage(e.target.value);

    socket.emit("typing", { room, username });

    setTimeout(() => {
      socket.emit("stop_typing", { room });
    }, 1000);
  };

  // 🔁 SOCKET LISTEN
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((list) => [...list, data]);
    });

    socket.on("typing", (data) => {
      setTyping(data.username + " typing...");
    });

    socket.on("stop_typing", () => setTyping(""));

    socket.on("online_users", setOnlineUsers);

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("online_users");
    };
  }, []);

  // 🔽 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔐 LOGIN UI
  if (!user) {
    return (
      <div className="auth">
        <div className="box">
          <h2>{isRegister ? "Register" : "Login"}</h2>

          <input
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={isRegister ? register : login}>
            {isRegister ? "Register" : "Login"}
          </button>

          <p onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login here" : "Create account"}
          </p>
        </div>
      </div>
    );
  }

  // 🟡 JOIN ROOM UI
  if (!showChat) {
    return (
      <div className="auth">
        <div className="box">
          <h2>Join Room</h2>

          <input
            placeholder="Enter Room (e.g. 123)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />

          <button onClick={joinRoom}>Join</button>
        </div>
      </div>
    );
  }

  // 💬 CHAT UI
  return (
    <div className="container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h3>Online</h3>
        {onlineUsers.map((u, i) => (
          <div key={i} className="userItem">
            🟢 {u.username}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="chat">
        <div className="header">
          Room: {room} | You: {username}
        </div>

        <div className="body">
          {messages.map((msg, i) => (
            <div key={i} className={msg.author === username ? "own" : "msg"}>
              <b>{msg.author}</b>

              {msg.message && <p>{msg.message}</p>}

              {msg.image && (
                <img src={msg.image} width="120" alt="" />
              )}
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        <div className="typing">{typing}</div>

        <div className="footer">
          <input
            value={message}
            onChange={handleTyping}
            placeholder="Type..."
          />
          <input type="file" onChange={handleImage} />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

    </div>
  );
}

export default App;