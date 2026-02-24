import "./styles.css";

export default function App() {
  return (
    <div className="page">
      <div className="login-card">
        <h1>Hey Welcome Back !!</h1>
        <p className="subtitle">
          Stay organized. Stay focused. <br />
          With FOCUSLY
        </p>

        <form>
          <div className="field">
            <label>Username</label>
            <input />
          </div>
          <br />
          <div className="field">
            <label>Password</label>
            <input type="password" />
          </div>
          <br />
          <button type="submit">Login</button>
        </form>

        <p className="footer-text">
          Are new in here? <a href="#">Create an account</a>
        </p>
      </div>
    </div>
  );
}
