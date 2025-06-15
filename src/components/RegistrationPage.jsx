import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RegistrationPage.css";

const RegistrationPage = () => {
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [Contactinfo, setContactinfo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState(""); // Add this line
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [strength, setStrength] = useState("weak");

  const navigate = useNavigate();

  // ✅ Redirect logged-in users away from registration page
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/home");
    }
  }, []);

  const checkStrength = (password) => {
    const lengthValid = password.length >= 7;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (!lengthValid || !(hasUpper && hasLower)) return "weak";
    if (hasSpecial) return "strong";
    return "medium";
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setStrength(checkStrength(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          specialization,
          contact_info: Contactinfo,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Registration failed");
      }

      setSuccess("Registration successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="registration-page">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialization">Specialization</label>
          <input
            type="text"
            id="specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Contactinfo">Contact info</label>
          <input
            type="text"
            id="Contactinfo"
            value={Contactinfo}
            onChange={(e) => setContactinfo(e.target.value)}
            required
          />
        </div>

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
            onChange={handlePasswordChange}
            required
          />
          {password && (
            <div className="strength-container">
              <div className={`strength-bar ${strength}`}></div>
              <small className="strength-text">Strength: {strength}</small>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="repeatPassword">Repeat Password</label>
          <input
            type="password"
            id="repeatPassword"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit" className="btn">
          Register
        </button>
      </form>
      <button
        type="button"
        className="btn secondary"
        onClick={() => navigate("/login")}
        style={{ marginTop: "1rem" }}
      >
        Back to Login
      </button>
    </div>
  );
};

export default RegistrationPage;
