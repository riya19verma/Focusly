import "./App.css";
import { Link, Route } from "react-router-dom"; // Optional: if using React Router
import { CurrentDateDisplay, Greetings } from "../Greetings";

function Diary() {
  return(
    <>
    <div className="header">
        <h2>
          <i>
            <CurrentDateDisplay />
          </i>
        </h2>
        <h1>Hey! Riya</h1>
      </div>
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>
            <Greetings /> !!
          </h2>
        </div>
      </div>
    </>
  )
}

export default Diary;
