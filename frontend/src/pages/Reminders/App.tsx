import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

type ReminderModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

interface Reminders {
  id: number;
  description: string;
  ring_date: string;
  remindAt: string;
  completed : boolean;
}

function ReminderCreate({ isOpen, onClose }: ReminderModalProps) {
  const [description, setTitle] = useState("");
  const [ring_date, setRingDate] = useState("");
  const [remindAt, setRemindAt] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setRingDate("");
      setRemindAt("");
    }
  }, [isOpen]);

  if(!isOpen) return null;

  const handleSubmit = () => {
    console.log("form submitted sucessfully");
    console.log("form submitted", { description, ring_date, remindAt });
    axios.post(
        "/api/Reminders", 
        { description, ring_date, remindAt},
        { withCredentials: true }
      )
      .then(response => {
        response.data;
        onClose();
      })
      .catch((error) => {
        // Handle login error, e.g., show error message
        console.error("Creating reminder failed:", error);
      });
  };

  return (
    <div className="reminder-overlay">
      <div className="add-form">
        <h2>Add Reminder</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type = "text" 
            placeholder="Description" 
            value={description}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input 
            type="date" 
            placeholder="Ring Date and Time" 
            value={ring_date}
            onChange={(e) => setRingDate(e.target.value)}
          />
          <input 
            type="time" 
            placeholder="Ring Time" 
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
          />

          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
}


function Reminders() {
  const [reminders, setReminders] = useState<Reminders[]>([]);

  useEffect(() => {
    // Fetch reminders from the backend API
    axios.get("/api/Reminders/view", { withCredentials: true })
    .then(res => setReminders(res.data.reminders));
  }, []);

  const handleComplete = (id: number) => {
    setReminders(prev =>
      prev.map(r =>
        r.id === id ? { ...r, completed: true } : r
      )
    )
    axios.post(
      `/api/Reminders/update`, 
      { id }, 
      { withCredentials: true }
    ).catch(
      err => console.error("Error marking reminder as complete:", err))
  }

  const [open, setOpen] = useState(false);

  return(
    <>
      <h2>Hey Don't Forget!</h2>
      <h3>Reminders</h3>
      <div className="viewReminders">
        <ul>
        {reminders.map((reminder) => (
          <li key={reminder.id}>
            <label style={{
              textDecoration: reminder.completed ? "line-through" : "none",
              opacity: reminder.completed ? 0.6 : 1
            }}>
              <input
                type="checkbox"
                checked={!!reminder.completed}
                onChange={() => handleComplete(reminder.id)}
              />
              {reminder.description} || Remind at {reminder.remindAt}
            </label>
          </li>
        ))}
        </ul>
      </div>
      <button className = "add-reminder" onClick={() => setOpen(true)}>
        Add Reminder
      </button>
      <ReminderCreate
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

export default Reminders;
