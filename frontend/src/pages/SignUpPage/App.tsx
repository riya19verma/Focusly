import "./styles.css";
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function CreateAccount() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    axios.post(
        "/api/User/signup", 
        { name, username, password, email }
      ).then(response => {
        console.log("FULL RESPONSE:", response.data);
        // Handle successful registration, e.g., redirect to questionnaire
        window.location.href = "/Questionnaire";
      }).catch((error) => {
        // Handle registration error, e.g., show error message
        console.log("ERROR:", error.response || error);
      });
  }
  return (
    <>
    <div className="page">
      <div className="signUp-card">
        <h2>Hey There !!</h2>
        <p className="subtitle">
          It seems you are new here. Let's get to know you.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <br />
          <button type="submit">
            Register
            <br /> & <br /> Move to Questionnaire
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

export default CreateAccount;
