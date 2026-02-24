import "./styles.css";

export default function App() {
  return (
    <div className="page">
      <div className="login-card">
        <h1>Hey There !!</h1>
        <p className="subtitle">
          It seems you are new here. Let's get to know you.
        </p>
        <form>
          <div className="field">
            <label>Name</label>
            <input />
          </div>
          <div className="field">
            <label>Username</label>
            <input />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" />
          </div>
          <br />
          <button type="submit">
            Register
            <br /> & <br /> Move to Questionnaire
          </button>
        </form>
      </div>
    </div>
  );
}
