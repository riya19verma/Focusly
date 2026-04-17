import "./App.css";
import {useState } from "react";
import { Save } from "@mui/icons-material";
import axios from "axios";

function Diary() {
  const [date, setDate] = useState(""); 
  const [content, setContent] = useState("");
  const [isPast, setIsPast] = useState(false);

  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  function handleSave(content: string) {
    console.log("Saving diary entry:", content);
    axios.post(
      "/api/diary/save", 
      { content }
    ).then(response => {
      console.log("Diary entry saved successfully:", response.data);
    }).catch(error => {
      console.error("Error saving diary entry:", error);
    });
  }
  function handleLoad() {
    setContent("");
    setIsPast(false);
    axios.get(
      `/api/diary/view`,
      {params: { date }}
    ).then(response => {
      setIsPast(date < today);
      console.log("Diary entry loaded successfully:", response.data.data);
      if(response.data.data == null){
        console.log("No diary entry found for the selected date.");
        if(date < today) {
          setContent("No diary entry found for the selected date.");
        }
      }
      else{
        const loadedContent = response.data.data.entry;
        setContent(loadedContent);
        console.log("Diary entry loaded successfully:", content);
      }      
    }).catch(error => {
      console.error("Error loading diary entry:", error);
    });
  }
  return(
    <>
      <input 
        id = "which_date" 
        type="date" 
        max = {new Date().toISOString().split("T")[0]}
        value={date} 
        onChange={(e) => setDate(e.target.value)}/>
      <button className="load-button" onClick={handleLoad}>Load</button>
      <div className = "diary-container">
        <h3><b>Dear Diary,</b></h3>
        <textarea 
          className="diary-input" 
          value = {content} 
          readOnly={isPast}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
      </div>
      {
        !isPast && (
          <button 
            className="save-button" 
            onClick={() => handleSave(content)}
          >
            <Save />
          </button>
        )
      }
    </>
  )
}

export default Diary;
