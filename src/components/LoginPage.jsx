import React, { useState, useContext, useEffect } from "react";
import { TherapistContext } from "../TherapistContext";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code, 3: new password

  const { setTherapistName } = useContext(TherapistContext);

  const navigate = useNavigate();

  const isDevelopment = false;

  // ✅ Redirect logged-in users away from login page
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/home");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDevelopment) {
      const mockTherapistName = "John@Doe";
      const mockAccessToken = "mock_token";
      const mockTherapistId = "12345";

      setTherapistName(mockTherapistName);
      localStorage.setItem("access_token", mockAccessToken);
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

      const data = await res.json();
      const { therapist_id, access_token, full_name } = data;

// <<<<<<< Tomer
      if (therapist_id === -1) {
        localStorage.setItem("therapist_name", "Admin");
        localStorage.setItem("token", access_token);
        setSuccess("Admin Login successful!");
        console.log(localStorage.getItem("token"));
        setError("");
      } else {
        setTherapistName(email);
        localStorage.setItem("token", access_token);
        localStorage.setItem("therapist_id", therapist_id);
        localStorage.setItem("therapist_name", full_name);
        setSuccess("Login successful!");
        console.log(localStorage.getItem("token"));
        setError("");
      }
// =======
//       localStorage.setItem("access_token", access_token);
//       localStorage.setItem("therapist_id", therapist_id);
//       localStorage.setItem("therapist_name", full_name);

//       setTherapistName(full_name);
//       setSuccess(therapist_id === -1 ? "Admin Login successful!" : "Login successful!");
//       setError("");
// >>>>>>> main

      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!res.ok) {
        let errorText = "Failed to send reset code";
        try {
          const errorData = await res.json();
          errorText = errorData.detail || errorText;
        } catch (e) {}
        setError(errorText);
        return;
      }

      setResetStep(2);
      setError("");
      setSuccess("Reset code sent to your email");
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/auth/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        let errorText = "Failed to reset password";
        try {
          const errorData = await res.json();
          errorText = errorData.detail || errorText;
        } catch (e) {}
        setError(errorText);
        return;
      }

      setSuccess("Password reset successful! Please login with your new password.");
      setShowForgotPassword(false);
      setResetStep(1);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setError("");
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  return (
    <div className="login-page">
      {!showForgotPassword ? (
        <>
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

            <button type="submit" className="btn">
              {t("login_button")}
            </button>

            <div className="forgot-password">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowForgotPassword(true)}
              >
                {t("forgot_password")}
              </button>
            </div>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <div className="register-link">
              <p>
                {t("not_registered_question")}{" "}
                <Link to="/register">{t("create_account_link")}</Link>
              </p>
            </div>
          </form>
        </>
      ) : (
        <div className="forgot-password-form">
          <h2>{t("forgot_password_title")}</h2>
          {resetStep === 1 && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">{t("email_label")}</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn">
                {t("send_reset_code")}
              </button>
            </form>
          )}

          {resetStep === 2 && (
            <form onSubmit={handleVerifyCode}>
              <div className="form-group">
                <label htmlFor="resetCode">{t("reset_code")}</label>
                <input
                  type="text"
                  id="resetCode"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">{t("new_password")}</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn">
                {t("reset_password")}
              </button>
            </form>
          )}

          <button
            type="button"
            className="link-button"
            onClick={() => {
              setShowForgotPassword(false);
              setResetStep(1);
              setResetEmail("");
              setResetCode("");
              setNewPassword("");
            }}
          >
            {t("back_to_login")}
          </button>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
