import React, { useState, useContext } from "react";
import { TherapistContext } from "../TherapistContext";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setTherapistName } = useContext(TherapistContext);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const isDevelopment = false; // Toggle this flag to enable/disable authentication

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDevelopment) {
      const mockTherapistName = "John@Doe";
      const mockAccessToken = "mock_token";
      const mockTherapistId = "12345";

      setTherapistName(mockTherapistName);
      localStorage.setItem("token", mockAccessToken);
      localStorage.setItem("therapist_id", mockTherapistId);
      localStorage.setItem("therapist_name", mockTherapistName);

      setSuccess(t("login_success_message") + " (development mode)!");
      setError("");

      setTimeout(() => {
        navigate("/home");
      }, 2000);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Login failed");

}


      //TODO: לתרגם את השגיאות גם לשפות האחרות
      
      
      
      const data = await res.json();
      const { therapist_id, access_token, full_name } = data;

      if (therapist_id === -1){
        localStorage.setItem("therapist_name", "Admin");
        localStorage.setItem("token", access_token);
        setSuccess("Admin Login successful!");
        console.log(localStorage.getItem("token"));
        setError(""); // clear error if there was one
      // Redirect to home
      }
      else{
        // Save therapist ID or name in context/localStorage
        setTherapistName(email); // or use therapist_id
        localStorage.setItem("token", access_token);
        localStorage.setItem("therapist_id", therapist_id);
        localStorage.setItem("therapist_name", full_name); // ✅ לשמור את השם המלא
      
        setSuccess("Login successful!");
        console.log(localStorage.getItem("token"));
        setError(""); // clear error if there was one
        // Redirect to home
      }

      
      
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <h2>{t("login_page_title")}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">{t("email_label")}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">{t("password_label")}</label>
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

        <button type="submit" className="btn">{t("login_button")}</button>
        <p>
          {t("not_registered_question")}{" "}
          <Link to="/register" style={{ color: "blue", textDecoration: "underline" }}>
            {t("create_account_link")}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
