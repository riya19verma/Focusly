import "./App.css";
import { Link, Route, Routes } from "react-router-dom"; // Optional: if using React Router

function Home() {
  return(
    <>
        <h1 style = {{marginTop : "0px", padding: "0px"}}>Hey! Riya</h1>
        <div className="streak">
          <h2>Don't Break the Streak</h2>
        </div>
        <div className="targets">
          <h2>Today's Targets 🎯</h2>
        </div>
    </>
  )
}

export default Home;
