import "./App.css";
import { useState,useEffect } from "react";
import axios from "axios";

function Home() {
  const [user, setUser] = useState("Guest");
  
  useEffect(()=>{
    axios.get(
      "/api/User/whoami"
    ).then(
      response => {
        console.log("USER RESPONSE:", response.data);
        setUser(response.data.uname);
      }
    ).
    catch(error => {
      console.log("USER ERROR:", error.response || error);
      setUser("Guest");
    });
  }, []);
  return(
    <>
        <h2 style = {{marginTop : "0px", padding: "0px"}}>Hey! {user}</h2>
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
