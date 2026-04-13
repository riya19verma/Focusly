import "./styles.css";
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("User");
    const [password, setPassword] = useState("");
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      console.log("Username:", username);
      e.preventDefault();
      axios.post(
          "/api/User/login", 
          { username, password }
        )
        .then(response => {
          console.log("FULL RESPONSE:", response.data); 
          const token = response.data.token;
          // Handle successful login, e.g., store token, redirect, etc.
          localStorage.setItem("token", token);
          localStorage.setItem("user", response.data.username);

          // Redirect to the home page or another protected route
          window.location.href = "/Home";
        })
        .catch((error) => {
          // Handle login error, e.g., show error message
          console.log("ERROR:", error.response || error);
        });
    };
  
  return (
  <>
      <div className="login-card">
        <h2>Hey Welcome Back !!</h2>
        <p className="subtitle">
          Stay organized. Stay focused. <br />
          With FOCUSLY
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            className="field"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            className="field"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>

        <p className="footer-text">
          Are new in here? <Link to="/CreateAccount">Create an account</Link>
        </p>
      </div>
  </>
  );
}

export default Login;