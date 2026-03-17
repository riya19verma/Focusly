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

function App() {

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };
  return (
    <>
      <div className="main-content">
      <div className={`header ${isSidebarOpen ? "shifted" : ""}`}>
        <button className="Hide" onClick={toggleSidebar}>
          ☰
        </button>
        <h2>
          <i>
            <CurrentDateDisplay />
          </i>
        </h2>
        <h1>Hey! Riya</h1>
      </div>
      </div>
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2>
            <Greetings /> !!
          </h2>
        </div>
        <ul className="sidebar-links">
          <li><Link to="/Home">Home</Link></li>
          <li><Link to="/Diary">Dear Diary</Link></li>
          <li><Link to="/TrackProgress">Track Progress</Link></li>
          <li><Link to="/CreateNew">Create New Goals</Link></li>
          <li><Link to="/Productivity">Productivity</Link></li>
          <li><Link to="/Reminders">Reminders</Link></li>
          <li><Link to="/">Calendar</Link></li>
        </ul>
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
