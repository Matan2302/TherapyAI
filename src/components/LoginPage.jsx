import React, { useState, useContext, useEffect } from "react";
import { TherapistContext } from "../TherapistContext";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./Header";
import tokenService from "../services/tokenService";
import { buildApiUrl, API_CONFIG } from "../config/api";

const LoginPage = () => {
  const { t } = useTranslation("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setTherapistName } = useContext(TherapistContext);
  const navigate = useNavigate();

  const isDevelopment = false;

  // ✅ Redirect logged-in users away from login page
  useEffect(() => {
    if (tokenService.isAuthenticated()) {
      navigate("/home");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDevelopment) {
      const mockTherapistName = "John@Doe";
      const mockAccessToken = "mock_token";
      const mockRefreshToken = "mock_refresh_token";
      const mockTherapistId = "12345";
      const mockTherapistEmail = "john@doe.com";

      setTherapistName(mockTherapistName);
      tokenService.setTokens(
        mockAccessToken,
        mockRefreshToken,
        mockTherapistId,
        mockTherapistName,
        mockTherapistEmail
      );

      setSuccess(t("login_success_message") + " (development mode)!");
      setError("");

      setTimeout(() => {
        navigate("/home");
      }, 2000);
      return;
    }

    try {
      const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
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

      const data = await res.json();
      const { therapist_id, access_token, refresh_token, full_name } = data;

      // Store tokens using token service
      tokenService.setTokens(
        access_token,
        refresh_token,
        therapist_id,
        full_name,
        email
      );

      setTherapistName(full_name);
      setSuccess(therapist_id === -1 ? "Admin Login successful!" : "Login successful!");
      setError("");

      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <LanguageSwitcher />
        </div>
        <h2>{t("login_page_title")}</h2>
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
