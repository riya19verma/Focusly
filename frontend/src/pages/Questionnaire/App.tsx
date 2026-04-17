import "./App.css";
import { CircularProgress, Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

interface Progress {
  id: number;
  def: string;
  due_date: string;
  completion_rate: number;
}

function CircularProgressWithLabel({value}: {value: number}) {
  return (
    <div className="circular-progress-with-label">
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" value={value} size={50} />

      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
    </div>
  );
}

function Progress() {
  const [progressData, setProgressData] = useState<Progress[]>([]);
    useEffect(() => {
      axios.get(
        "/api/TrackProgress/progress"
      ).then(response => {
        if(response.data.data.length === 0){
          setProgressData([]);
        } else {
          setProgressData(response.data.data);
        }
      })
      .catch(error => {
        console.error("Error fetching progress data:", error);
      });
    }, []);

  return(
    <>
      <div className="progress-container">
        <h2>Track Your Progress</h2>
        {progressData.length > 0 ? (
          <div className="progress-data">
            {progressData.map((goal) => (
              <li key={goal.id} className="progress-item">
                {goal.def} || Due:  {new Date(goal.due_date).toLocaleDateString()}
                <CircularProgressWithLabel value={goal.completion_rate} />
              </li>
            ))}
          </div>
        ) : (
          <p>All Goals Completed! :)</p>
        )}
      </div>
    </>
  )
}

export default Progress;
