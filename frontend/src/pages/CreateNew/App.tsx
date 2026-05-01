import "./App.css";
import { useState } from "react";
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import axios from "axios";

interface task {
  id: number, 
  description : string, 
  due_date : string, 
  is_recurring : boolean, 
  time_alloted : number | null, 
  time_unit : string | null, 
  start_date : string, 
  r_rate:number | null,
  recur_unit : null,
  sub_goals:task[] 
}

function CreateNew() {
  const [levels, setLevels] = useState<task[]>([
      {
        id: Date.now(),
        description: "",
        due_date: "",
        is_recurring: false,
        time_alloted: null,
        time_unit: null,
        start_date: "",
        r_rate: null,
        recur_unit: null,
        sub_goals: []
      }
  ]);

  // Add child to a specific node
  const addGoal = (id: number) => {
    const addChild = (nodes: any[]): any[] =>
      //searches through the current level for the node with node.id == id
      nodes.map(node => {
        if (node.id === id) {
          console.log("Found node to add child:", node);
          console.log("current text: ", node.text);
          return {
            ...node,            
            sub_goals: [
              // add the new child
              ...node.sub_goals,
              {
                id: Date.now(), // unique id for the new child
                description: "",
                due_date: "",
                is_recurring: false,
                time_alloted: null,
                time_unit: null,
                start_date: "",
                r_rate: null,
                recur_unit: null,
                sub_goals: []
              }
            ]
          };
        }
        return {
          //if no such node on current level then go deeper
          ...node,
          sub_goals: addChild(node.sub_goals)//recursive call
        };
      });

    setLevels(addChild(levels));
  };

  // first level node
  const addRootGoal = () => {
    setLevels([
      ...levels,
      {
        id: Date.now(),
        description: "",
        due_date: "",
        is_recurring: false,
        time_alloted: null,
        time_unit: null,
        start_date: "",
        r_rate: null,
        recur_unit: null,
        sub_goals: []
      }
    ]);
  };

  const renderLevels = (nodes: any[], level: number = 1) => {
    console.log(`Rendering level ${level} with nodes:`, nodes);
    return nodes.map(node => (
      //Level of current node is determined by the number of children it has. If it has children, we check the first child's children to determine the level. If it doesn't have children, it's a Level 1 node.
      <div key={node.id} className={`Level${level}`}>
        {
          level == 1? <></>:
          <button className="remove-node" onClick={() => {
            const removeNode = (nodes: any[]): any[] =>
              nodes.filter(n => n.id !== node.id).map(n => ({
                ...n,
                sub_goals: removeNode(n.sub_goals)
              }));
            setLevels(removeNode(levels));
          }}>
            -
          </button>
        }
        <input 
        className = "goal_input" 
        id = {`input-${node.id}`} 
        type="text" 
        value={node.description} 
        onChange={(e) => {
          const newText = e.target.value;
          const updateText = (nodes: any[]): any[] =>
            nodes.map(n => {
              if (n.id === node.id) {
                return { ...n, description: newText };
              }
              return {
                ...n,
                sub_goals: updateText(n.sub_goals)
              };
            });
          setLevels(updateText(levels));
        }} />

        <input 
        className = "date_input" 
        type = "date" 
        value = {node.due_date}
        onChange={(e) =>{
          const newDate = e.target.value;
          const updateDate = (nodes: any[]): any[] =>
            nodes.map(n => {
              if (n.id === node.id) {
                return { ...n, due_date: newDate };
              }
              return {
                ...n,
                sub_goals: updateDate(n.sub_goals)
              };
            });
          setLevels(updateDate(levels));
        }}/>
        {level == 3? <></>:<IconButton color="primary" aria-label="add" className="Add" onClick={() => addGoal(node.id)}>
          <AddIcon />
        </IconButton>}
        
        <br/>

        <p id = "time-required-ques">Time Required to complete the task</p>

        <input 
        className = "time_required_input" 
        type="number" 
        min="1" 
        value={node.time_alloted}
        onChange={(e)=>{
          const newTime = parseInt(e.target.value) || null;
          const updateTime = (nodes: any[]): any[] =>
            nodes.map(n => {
              if (n.id === node.id) {
                return { ...n, time_alloted: newTime };
              }
              return {
                ...n,
                sub_goals: updateTime(n.sub_goals)
              };
            });
          setLevels(updateTime(levels));
        }}/>

        <select 
        className = "rate_type_select"
        value={node.time_unit}
        onChange={(e) => {
          const newUnit = e.target.value;
          const updateUnit = (nodes: any[]): any[] =>
            nodes.map(n => {
              if (n.id === node.id) {
                return { ...n, time_unit: newUnit };
              }
              return {
                ...n,
                sub_goals: updateUnit(n.sub_goals)
              };
            });
          setLevels(updateUnit(levels));
        }}>
          <option value="1">Select</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>

        <p id = "recur-rate-ques">Recurrence Rate : </p>

        <select 
        className="recur_times_select" 
        value={node.r_rate || "1"}
        onChange={(e) => {
          const newRate = e.target.value;
          if(newRate === "Once") {
            const updateRate = (nodes: any[]): any[] => 
              nodes.map(n => {
                if (n.id === node.id) {
                  return { ...n, r_rate: null, is_recurring: false };
                }
                return {
                  ...n,
                  sub_goals: updateRate(n.sub_goals)
                };
              });
            setLevels(updateRate(levels));
            return;
          }
          const updateRate = (nodes: any[]): any[] =>
            nodes.map(n => {
              if (n.id === node.id) {
                return { ...n, r_rate: 1, recur_unit: newRate, is_Recurring: true };
              }
              return {
                ...n,
                sub_goals: updateRate(n.sub_goals)
              };
            });
          setLevels(updateRate(levels));
        }}>
          <option value="1">Select</option>
          <option value="Once">Once</option>
          <option value= "daily">Daily</option>
          <option value= "weekly">Weekly</option>
          <option value= "monthly">Monthly</option>
          <option value= "yearly">Yearly</option>
        </select>


        {node.sub_goals.length > 0 && renderLevels(node.sub_goals, level + 1)}
      </div>
    ));
  };

  const saveGoal = () => {
    // Implementation for saving the goal
    console.log("")
    console.log("Saving goal:", levels);
    axios.post("/api/CreateNew/newGoals", { goal: levels, help: false, AIres: false })
      .then(response => {
        console.log("Goal saved successfully:", response.data);
        setLevels([
          {
            id: Date.now(),
            description: "",
            due_date: "",
            is_recurring: false,
            time_alloted: null,
            time_unit: null,
            start_date: "",
            r_rate: null,
            recur_unit: null,
            sub_goals: []
          }
        ]);
      })
      .catch(error => {
        console.error("Error saving goal:", error);
        // Optionally, you can show an error message here
      });
  };

  return (
    <div className="create-new-container">
      <h2>Lets Plan something New !!</h2>
      <div className="add-root-button-container">

        {renderLevels(levels,1)}
      </div>
      <button className="add-root-button" onClick={saveGoal}>Save Goal</button>
    </div>
  );
}

export default CreateNew;