import "./App.css";
import { useState,useEffect } from "react";
import Diary from "./pages/Diary/App.tsx";
import Home from "./pages/Home/App.tsx";
import Progress from "./pages/Progress/App.tsx";
import CreateNew from "./pages/CreateNew/App.tsx";
import Productivity from "./pages/Productivity/App.tsx";
import Reminders from "./pages/Reminders/App.tsx";
import Login from "./pages/LoginPage/App.tsx";
import CreateAccount from "./pages/SignUpPage/App.tsx";
import Calendar from "./pages/Calendar/App.tsx";
//import Questionnaire from "./pages/Questionnaire/App.tsx";
import { Link, Route,Routes } from "react-router-dom"; 
import { CurrentDateDisplay, Greetings } from "./pages/Greetings";
import axios from "axios";


function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState("Guest");
  const [mssg, setMsg] = useState(""); 
  const [diary_name, setDiaryName] = useState("Dear Diary");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);

  useEffect(()=>{
    axios.get(
      "/api/User/whoami"
    ).then(
      response => {
        console.log("USER RESPONSE:", response.data);
        setUser(response.data.username);
        fetchDiaryName();
      }
    ).
    catch(error => {
      console.log("USER ERROR:", error.response || error);
      setUser("Guest");
    });
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleChatSubmit = () => {
    if (!mssg.trim()) return;

    axios.post("/api/Chatbot/chat", {
      message: mssg,
      context: chatHistory,
      options: "conversation"
    })
    .then(response => {
      const { message, conversation } = response.data.data;
      setChatHistory(conversation);
      setMsg("");
    })
    .catch(error => {
      console.error("Chatbot error:", error);
    });
  };

  const fetchDiaryName = () => {
    axios.get(
      "/api/Chatbot/diaryName"
    ).then(response => {
      console.log("Diary name response:", response.data.data);
      setDiaryName(response.data.data.diary_name);
    }).catch(error => {
      console.error("Error fetching diary name:", error);
    });
  }

  const displayChat = () => {
    // Implement logic to display the chatbot response in the UI
    console.log("Displaying chatbot response:", chatHistory);
    // You can update the state or directly manipulate the DOM to show the response
    return (
      <>
        <div className="chatbot-response">
          {chatHistory.map((entry, index) => (
            entry.role === "user"?(
              <div key={index} className = "user-message">
                <p><strong>You:</strong> {entry.content}</p>
              </div>
            ):( 
              <div key={index} className = "assistant-message">
                <p><strong>Assistant:</strong> {entry.content}</p>
              </div>
            )
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="main-content">
      <div className={`header ${isSidebarOpen ? "shifted" : ""}`}>
        <div className="header-left">
        <button className="Hide" onClick={toggleSidebar}>
          ☰
        </button>
        <Link to = "/Login" id="profile">
          <img src = "./src/images/profile.jpg" alt="Profile"></img>
        </Link>
        {user}
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
          <li><Link to="/Calendar">📅 Calendar</Link></li>
        </ul>
      </div>
      <div className="Chatbot">
        <div className="chatbot-header">
          <h2><center>{diary_name}</center></h2>
          <p><center>Chat with your AI diary assistant</center></p>
        </div>
        <div className="chatbot-body">
          {/* Display chatbot conversation here */}
          {displayChat()}
        </div>
        <div className="chatbot-footer">
          <button id = "mic" ><img src = "./src/images/mic.jpg" alt="Microphone"></img></button>
          <input type = "text" id = "Chat" onChange={(e) => setMsg(e.target.value)} value={mssg}/>
          <button id = "send" onClick={handleChatSubmit}>
            ➡
          </button>
        </div>
      </div>
      <div className = {`router-container ${isSidebarOpen ? "shifted" : ""}`}>
          <Routes>
            <Route path = "/Login" element = {<Login />}/>
            <Route path="/Home" element={<Home />} />
            <Route path="/Diary" element={<Diary />} />
            <Route path="/TrackProgress" element={<Progress />} />
            <Route path="/CreateNew" element={<CreateNew />} />
            <Route path="/Productivity" element={<Productivity />} />
            <Route path="/Reminders" element={<Reminders />} />
            <Route path="/CreateAccount" element={<CreateAccount />} />
            <Route path="/Calendar" element={<Calendar />} />
            {/* <Route path= "/Questionnaire" element={<Questionnaire />} /> */}
          </Routes>
      </div>      
    </>
  );
}

export default App;
