import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegistrationPage.css"; // אם יש לך עיצוב

const RegistrationPage = () => {
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [Contactinfo, setContactinfo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      // הרשמה הצליחה – הפנייה להתחברות
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
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success-message">{success}</p>}


        <button type="submit" className="btn">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegistrationPage;
