import React, { useState, useContext } from "react";
import { TherapistContext } from "../TherapistContext"; // Import the context
import "./LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Access the context to set the therapist's name
  const { setTherapistName } = useContext(TherapistContext);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === "111") { // Validate password
      setTherapistName(username); // Save the therapist's name globally
      console.log("Logged in as:", username);
    } else {
      alert("Incorrect password");
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
