import "./App.css";
import { Link, Route, Routes } from "react-router-dom"; // Optional: if using React Router

function Home() {
  return(
    <>
        <div className="streak">
          <h2>Don't Break the Streak</h2>
        </div>
        <div className="streak">
          <h2>Today's Targets 🎯</h2>
        </div>
    </>
  )
}

export default Home;
