import "./App.css";
import { Link, Route } from "react-router-dom"; // Optional: if using React Router
import { CurrentDateDisplay, Greetings } from "../Greetings";

function Diary() {
  return(
    <>
      <div className="diary-container">
        <h3>Dear Diary,</h3>
        <textarea  className="diary-input"/>
      </div>
    </>
  )
}

export default Diary;
