import React, { useState, useContext } from "react";
import { TherapistContext } from "../TherapistContext";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState(""); // changed from "username"
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setTherapistName } = useContext(TherapistContext);
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  <p className="redirect-link">
    Not registered yet? <Link to="/register">Sign up here</Link>
  </p>

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();
      const { therapist_id, access_token,full_name } = data;

      // Save therapist ID or name in context/localStorage
      setTherapistName(email); // or use therapist_id
      localStorage.setItem("token", access_token);
      localStorage.setItem("therapist_id", therapist_id);
      localStorage.setItem("therapist_name", full_name); // ✅ לשמור את השם המלא
      
      setSuccess("Login successful!");
      console.log(localStorage.getItem("token"));
      setError(""); // clear error if there was one
      // Redirect to home
      
      setTimeout(() => {
        navigate("/home");
      }, 2000);// 2 seconds delay for success message

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        


        <button type="submit" className="btn">Login</button>
        <p>
          Not registered yet?{" "}
          <a href="/register" style={{ color: "blue", textDecoration: "underline" }}>
            Create an account
          </a>
        </p>
      </form>
    </div>
    
  );
};

export default LoginPage;
