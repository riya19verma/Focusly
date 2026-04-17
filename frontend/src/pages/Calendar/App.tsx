import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

interface CalendarEvent {
  id: number;
  google_event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

function Calendar() {

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

const generateCalendar = () => {
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const totalDays = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  console.log("Month:", currentDate.getMonth() + 1);
  console.log("Total Days in Month:", totalDays);
  console.log("Events : ",events);
  const cells = [];

  // empty cells
  for (let i = 0; i < firstDay; i++) {
    cells.push(<td key={`empty-${i}`}></td>);
  }
  console.log("Events : ",events);
  // days with events
  if(events.length != 0){
    for (let day = 1; day <= totalDays; day++) {

      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.start_time);
        return (
          eventDate.getDate() === day &&
          eventDate.getMonth() === currentDate.getMonth() &&
          eventDate.getFullYear() === currentDate.getFullYear()
        );
      });

      cells.push(
        <td key={day}>
          <div><b>{day}</b></div>
          {dayEvents.map(ev => (
            <div key={ev.id} style={{ fontSize: "12px" }}>
              {ev.title}
            </div>
          ))}
        </td>
      );
    }
  }
  else{
    for (let day = 1; day <= totalDays; day++) {
      cells.push(
        <td key={day}>
          <div>{day}</div>
        </td>
      );
    }
  }
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(<tr key={i}>{cells.slice(i, i + 7)}</tr>);
  }

  return rows;
};

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "success") {
      setCurrentDate(new Date()); // reset to current date after sync
      console.log("Google Calendar sync successful, fetching updated events...");
      syncEvents().then(getEvents);
    } else {
      getEvents(); // normal load
    }
  },[]);

  const connectGoogle = () => {
    window.location.href = "http://localhost:3000/api/calendar/authGoogle";
  }

  const syncEvents = async () => {
    console.log("Initiating event sync...");
    await axios.post(
      "/api/calendar/syncEvents"
    )
    .then(response => {
      console.log("Sync Response:", response.data);
    })
    .catch(error => {
      console.error("Error syncing events:", error.response || error);
    });
  };

  const getEvents = async () => {
    const month = new Date().getMonth()+1; // JavaScript months are 0-indexed
    const year = new Date().getFullYear(); // Get current year
    axios.get("/api/calendar/getEvents",
    { params: { month, year } })
    .then(response => {
      console.log("Calendar Events:", response.data);
      if(response.data.length === 0){
        setEvents([]);
      }
      else{
        setEvents(response.data.message);
      }
    })
    .catch(error => {
      console.error("Error fetching calendar events:", error.response || error);
    });
  }

  return(
    <>
      <h2>Calendar</h2>
      <button className = "connect-google-btn" onClick={connectGoogle}>
        Connect Google Calendar
      </button>
      <div className="calendar-container">
        <div className="month-year">
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </div>
        <table className="calendar-table">
          <thead>
            <tr>
              <th>Sun</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thur</th>
              <th>Fri</th>
              <th>Sat</th>
            </tr>
          </thead>
          <tbody>
            {generateCalendar()}
          </tbody>

        </table>
      </div>
    </>
  )
}

export default Calendar;
