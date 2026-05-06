import "./App.css";
import { useState,useEffect } from "react";
import axios from "axios";
import { Checkbox } from "@mui/material";

interface today{
  tid: number,
  description: string,
  dueDate: string,
  priority: string,
  timeAllotted: number,
  timeUnit: string
}

interface recurring{
  tid: number,
  description: string,
  nextRecurDate: string,
  recurRate: number,
  recurUnit: string,
  endDate: string,
  completionRate: number,
  timeAllotted: number,
  totalOccurences: number
}

function Home() {
  const [user, setUser] = useState("Guest");
  const [todayTasks, setTodayTasks] = useState<today[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<recurring[]>([]);
  
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

    axios.get('/api/daily/today'
    ).then(
      response => {
        console.log("DAILY RESPONSE:", response.data.data);
        setTodayTasks(response.data.data);
      }
    ).catch(
      error => {
        console.log("DAILY ERROR:", error.response || error);
      }
    );

    axios.get('/api/daily/recurring')
      .then(response => {
        console.log("RECURRING RESPONSE:", response.data.data);
        setRecurringTasks(response.data.data);
      })
      .catch(error => {
        console.log("RECURRING ERROR:", error.response || error);
      });
  }, []);

  return(
    <>
        <h2 style = {{marginTop : "0px", padding: "0px"}}>Hey! {user}</h2>
        <div className="streak">
          <h2>Don't Break the Streak</h2>
          {recurringTasks && recurringTasks.length > 0 ? (
            <div className="streak-info">
            {recurringTasks.map((task, index) => (
            <div key={index} className="task-item">
              <input type="checkbox" style={{marginLeft: "10px"}}/>
              <span>
                {task.description} - {task.timeAllotted}
                {task.completionRate} / {task.totalOccurences}
              </span>
            </div>
            ))}
            </div>
          ) : (
            <p>No recurring tasks due today.</p>
          )}
          
          
        </div>
        <div className="targets">
          <h2>Today's Targets 🎯</h2>
          { todayTasks && todayTasks.length ? (
           <div className="targets-info">
            {todayTasks.map((task, index) => (
              <div key={index} className="task-item">
                <input type="checkbox" style={{marginLeft: "10px"}}/>
                  <span> 
                  {task.description} - {task.timeAllotted}{task.timeUnit}
                  <button style={{marginLeft: "10px"}}>Reschedule</button>
                  <button style={{marginLeft: "10px"}}>Drop</button>
                  Priority : <input type="text" style={{marginLeft: "10px"}}/>
                </span>
              </div>
            ))}
            </div>
          ) : (
            <p>No tasks for today. Enjoy your day! 🎉</p>
          )}
        </div>
    </>
  )
}

export default Home;
