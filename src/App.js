import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

// ✅ FINAL FIX (API URL)
const API = "https://chat-app-370t.onrender.com";

// ✅ SOCKET FIX
const socket = io(API);

function App() {
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");

  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const bottomRef = useRef(null);

  // 🔥 REGISTER
  const register = async () => {
    await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, avatar }),
    });

    alert("Registered! Login karo");
    setIsRegister(false);
  };

  // 🔥 LOGIN
  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data) setUser(data);
    else alert("Wrong credentials");
  };

  const joinRoom = () => {
    socket.emit("join_room", {
      room,
      username: user.username,
      avatar: user.avatar,
    });
    setShowChat(true);
  };

  const sendMessage = () => {
    if (message !== "" || image !== "") {
      const data = {
        room,
        author: user.username,
        avatar: user.avatar,
        message,
        image,
        time: new Date().toLocaleTimeString(),
      };

      socket.emit("send_message", data);
      setMessage("");
      setImage("");
      socket.emit("stop_typing", { room });
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => setImage(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { room, username: user.username });

    setTimeout(() => {
      socket.emit("stop_typing", { room });
    }, 1000);
  };

  useEffect(() => {
    socket.on("load_messages", setMessageList);

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
      socket.emit("message_seen", { room });
    });

    socket.on("message_seen", () => {
      setMessageList((list) =>
        list.map((msg) =>
          msg.author === user?.username ? { ...msg, status: "seen" } : msg
        )
      );
    });

    socket.on("typing", (user) => setTypingUser(user + " is typing..."));
    socket.on("stop_typing", () => setTypingUser(""));
    socket.on("online_users", setOnlineUsers);

    return () => socket.off();
  }, [room, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // 🔥 UI

  if (!user) {
    return (
      <div className="auth">
        <h2>{isRegister ? "Register" : "Login"}</h2>

        <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

        {isRegister && (
          <input
            placeholder="Avatar URL"
            onChange={(e) => setAvatar(e.target.value)}
          />
        )}

        <button onClick={isRegister ? register : login}>
          {isRegister ? "Register" : "Login"}
        </button>

        <p onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Login here" : "Create account"}
        </p>
      </div>
    );
  }

  if (!showChat) {
    return (
      <div className="join">
        <input placeholder="Room" onChange={(e) => setRoom(e.target.value)} />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  return (
    <div className="chat">
      <div className="header">
        {room} | {user.username}
        <div>👥 {onlineUsers.map((u) => u.username).join(", ")}</div>
      </div>

      <div className="body">
        {messageList.map((msg, i) => (
          <div key={i} className={msg.author === user.username ? "own" : "msg"}>
            <img src={msg.avatar} width="30" alt="" />
            {msg.message && <p>{msg.message}</p>}
            {msg.image && <img src={msg.image} width="120" alt="" />}

            <span>
              {msg.time}
              {msg.author === user.username &&
                (msg.status === "seen" ? " ✔✔" : " ✔")}
            </span>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="typing">{typingUser}</div>

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
  );
}

export default App;