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
  const [avatar, setAvatar] = useState("");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const bottomRef = useRef(null);

  const createRoom = (u1, u2) => {
    return [u1, u2].sort().join("_");
  };

  useEffect(() => {
    if (user) {
      fetch(`${API}/users`)
        .then(res => res.json())
        .then(data => setUsers(data));
    }
  }, [user]);

  const register = async () => {
    await fetch(`${API}/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password, avatar })
    });
    alert("Registered! Login karo");
    setIsRegister(false);
  };

  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data) setUser(data);
    else alert("Wrong credentials");
  };

  const startChat = (otherUser) => {
    const roomId = createRoom(user.username, otherUser.username);

    setRoom(roomId);
    setSelectedUser(otherUser);

    socket.emit("join_room", { room: roomId });

    setShowChat(true);
  };

  const sendMessage = () => {
    if (message !== "") {
      const data = {
        room,
        author: user.username,
        message,
        time: new Date().toLocaleTimeString(),
      };

      socket.emit("send_message", data);
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("load_messages", setMessageList);

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => socket.off();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  if (!user) {
    return (
      <div className="auth">
        <h2>{isRegister ? "Register" : "Login"}</h2>

        <input placeholder="Username" onChange={(e)=>setUsername(e.target.value)} />
        <input placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />

        {isRegister && (
          <input placeholder="Avatar URL"
            onChange={(e)=>setAvatar(e.target.value)} />
        )}

        <button onClick={isRegister ? register : login}>
          {isRegister ? "Register" : "Login"}
        </button>

        <p onClick={()=>setIsRegister(!isRegister)}>
          {isRegister ? "Login here" : "Create account"}
        </p>
      </div>
    );
  }

  if (!showChat) {
    return (
      <div className="join">
        <h3>Select User</h3>

        {users
          .filter(u => u.username !== user.username)
          .map(u => (
            <div key={u._id} onClick={() => startChat(u)}>
              {u.username}
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="chat">
      <div className="header">
        Chat with: {selectedUser?.username}
      </div>

      <div className="body">
        {messageList.map((msg, i) => (
          <div key={i}
            className={msg.author === user.username ? "own" : "msg"}>
            <p>{msg.message}</p>
            <span>{msg.time}</span>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="footer">
        <input
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          placeholder="Type..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;