import "./App.css";
import { useState } from "react";
import Diary from "./pages/Diary/App.tsx";
import Home from "./pages/Home/App.tsx";
import Progress from "./pages/Progress/App.tsx";
import CreateNew from "./pages/CreateNew/App.tsx";
import Productivity from "./pages/Productivity/App.tsx";
import Reminders from "./pages/Reminders/App.tsx";
import { Link, Route,Routes } from "react-router-dom"; 
import { CurrentDateDisplay, Greetings } from "./pages/Greetings";
import axios from "axios";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function LoginUser({ isOpen, onClose }: LoginModalProps) {
  const [username, setUsername] = useState("User");
  const [password, setPassword] = useState("");

  if(!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    axios.post(
        "/api/User/login", 
        { username, password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(response => {
        const token = response.data.token;
        // Handle successful login, e.g., store token, redirect, etc.
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        onClose();
      })
      .catch((error) => {
        // Handle login error, e.g., show error message
        console.error("Login failed:", error);
      });
  };

  return (
    <div className="login-overlay">
      <div className="login-form">
        <button onClick={onClose}>X</button>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

function App() {

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <div className="main-content">
      <div className={`header ${isSidebarOpen ? "shifted" : ""}`}>
        <div className="header-left">
        <button className="Hide" onClick={toggleSidebar}>
          ☰
        </button>
        <button id = "profile" onClick={() => setOpen(true)}>
          <img src = "./src/images/profile.jpg" alt="Profile"></img>
        </button>
        <LoginUser
          isOpen = {open}
          onClose = {() => setOpen(false)}
        />
        </div>
          <h3><i>
            <CurrentDateDisplay />
          </i></h3>
      </div>
      </div>
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2>
            <Greetings /> !!
          </h2>
        </div>
        <ul className="sidebar-links">
          <li><Link to="/Home">🏠 Home</Link></li>
          <li><Link to="/Diary">📖 Dear Diary</Link></li>
          <li><Link to="/TrackProgress">📈 Track Progress</Link></li>
          <li><Link to="/CreateNew">🎯 Create New Goals</Link></li>
          <li><Link to="/Productivity">⚡ Productivity</Link></li>
          <li><Link to="/Reminders">⏰ Reminders</Link></li>
          <li><Link to="/">📅 Calendar</Link></li>
        </ul>
      </div>
      <div className="Chatbot">
        <div className="chatbot-header">
          <h2><center>Diary's Name</center></h2>
          <button id = "mic" ><img src = "./src/images/mic.jpg" alt="Microphone"></img></button>
          <input type = "text" id = "Chat"></input>
        </div>
      </div>
      <div className = {`router-container ${isSidebarOpen ? "shifted" : ""}`}>
          <Routes>
            <Route path="/Home" element={<Home />} />
            <Route path="/Diary" element={<Diary />} />
            <Route path="/TrackProgress" element={<Progress />} />
            <Route path="/CreateNew" element={<CreateNew />} />
            <Route path="/Productivity" element={<Productivity />} />
            <Route path="/Reminders" element={<Reminders />} />
          </Routes>
      </div>
    </>
  );
}

export default App;
