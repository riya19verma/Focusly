import "./App.css";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Optional: if using React Router
import axios from "axios";

function App() {
  const [mssg, setMssg] = useState("");

  useEffect(() => {
    axios.get("/api/newGoals")
        .then(res => res.json())
        .then(data => console.log(data))
        .catch((error) => {
          console.error("There was an error fetching the message!", error);
        });
  }, []);
  return (
    <>
      <h1>{mssg}</h1>
    </>
  );
}

export default App;
