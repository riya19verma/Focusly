import "./App.css";
import React, { useEffect, useState } from "react";
import { Link, Route } from "react-router-dom"; // Optional: if using React Router

function CurrentDateDisplay() {
  const today = new Date();
  // Format the date as a local string (e.g., "1/25/2026")
  const formattedDate = today.toLocaleDateString();
  return formattedDate;
}

function Greetings() {
  const now = new Date();
  // The comparison logic is better done using the actual hour number
  const currentHour = now.getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return "Good Morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    // 5:00 PM is 17 hours
    return "Good Afternoon";
  } else if (currentHour >= 17 && currentHour < 21) {
    // 9:00 PM is 21 hours
    return "Good Evening";
  } else {
    // Covers 9:00 PM to 5:00 AM (21:00 to 05:00)
    return "Good Night";
  }
}

function App() {
  return (
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
        <ul className="sidebar-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/Diary">Dear Diary</Link>
          </li>
          <li>
            <Link to="/TrackProgress">Track Progress</Link>
          </li>
          <li>
            <Link to="/CreateNew">Create New Goals</Link>
          </li>
          <li>
            <Link to="/Productivity">Productivity</Link>
          </li>
          <li>
            <Link to="/Reminders">Reminders</Link>
          </li>
          <li>
            <Link to="/Calendar">Calendar</Link>
          </li>
        </ul>
      </div>
      <div className="streak">
        <h2>Don't Break the Streak</h2>
      </div>
      <div className="streak">
        <h2>Today's Targets 🎯</h2>
      </div>
    </>
  );
}

export default App;
