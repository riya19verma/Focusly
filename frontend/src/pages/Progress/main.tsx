import React from "react";
import ReactDOM from "react-dom/client";
import Progress from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Progress />
    </BrowserRouter>
  </React.StrictMode>
);
