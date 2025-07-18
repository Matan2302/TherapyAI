import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./RegistrationPage.css";
import { LanguageSwitcher } from "./Header";
import tokenService from "../services/tokenService";

const RegistrationPage = () => {
  const { t } = useTranslation("registration");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [Contactinfo, setContactinfo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState(""); // Add this line
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [strength, setStrength] = useState("weak");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactError, setContactError] = useState("");
  const [specializationError, setSpecializationError] = useState("");

  const navigate = useNavigate();

  // ✅ Redirect logged-in users away from registration page
  useEffect(() => {
    if (tokenService.isAuthenticated()) {
      navigate("/home");
    }
  }, [navigate]);

  const checkStrength = (password) => {
    const lengthValid = password.length >= 7;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (!lengthValid || !(hasUpper && hasLower)) return "weak";
    if (hasSpecial) return "strong";
    return "medium";
  };

  // Name validation: at least 2 chars, only valid chars
  const nameRegex = /^[a-zA-Z0-9\s'-]{2,}$/;
  const handleNameChange = (e) => {
    const value = e.target.value;
    setFullName(value);
    if (!nameRegex.test(value)) {
      setNameError(
  t("invalid_name_message", {
    defaultValue: "Name must be at least 2 characters and contain only valid characters.",
  })
);

    } else {
      setNameError("");
    }
  };

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|outlook|hotmail|yahoo|icloud|walla|live)\.[a-zA-Z]{2,}$/;
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !emailRegex.test(value)) {
      setEmailError(
  t("invalid_email_message", {
    defaultValue: "Please enter a valid email address.",
  })
);
    } else {
      setEmailError("");
    }
  };

  const specializationRegex = /^[a-zA-Z\s]{3,}$/;
  const handleSpecializationChange = (e) => {
  const value = e.target.value;
  setSpecialization(value);
  if (!specializationRegex.test(value)) {
    setSpecializationError(
      t("invalid_specialization_message", {
      defaultValue: "Specialization must contain only letters and spaces.",
    })
    );
  } else {
    setSpecializationError("");
  }
};


  const contactRegex = /^05\d{8}$/;
  const handleContactChange = (e) => {
  const value = e.target.value;
  setContactinfo(value);
  if (value && !contactRegex.test(value)) {
setContactError(
  t("invalid_contact_message", {
    defaultValue: "Please enter a valid Israeli phone number (e.g., 05XXXXXXXX).",
  })
);

  } else {
    setContactError("");
  }
};


  // Password validation: strong password (min 8 chars, upper, lower, number, special char)
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setStrength(checkStrength(val));
    if (!strongPasswordRegex.test(val)) {
setPasswordError(
  t("invalid_password_message", {
    defaultValue: "Password must be at least 8 characters and include upper and lower case letters, a number, and a special character.",
  })
);
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nameError || emailError || passwordError) return;
    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <LanguageSwitcher />
        </div>
        <h2>{t("register_title")}</h2>
        <div className="form-group">
          <label htmlFor="fullName">{t("full_name_label")}</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={handleNameChange}
            required
          />
          {nameError && <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{nameError}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="specialization">{t("specialization_label")}</label>
          <input
            type="text"
            id="specialization"
            value={specialization}
            onChange={handleSpecializationChange}
            required
          />
          {specializationError && (
          <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>
            {specializationError}
          </span>
        )}
        </div>

        <div className="form-group">
          <label htmlFor="Contactinfo">{t("contact_info_label")}</label>
          <input
          type="text"
          id="Contactinfo"
          value={Contactinfo}
          onChange={handleContactChange}
          required
        />
        {contactError && (
          <span className="error-message" style={{ color: "red", fontSize: "0.9em" }}>
            {contactError}
          </span>
        )}
        </div>

        <div className="form-group">
          <label htmlFor="email">{t("email_label")}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
          {emailError && <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{emailError}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">{t("password_label")}</label>
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
              <small className="strength-text">{t("strength_label")}: {strength}</small>
            </div>
          )}
          {passwordError && <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{passwordError}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="repeatPassword">{t("repeat_password_label")}</label>
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

        <button type="submit" className="btn" disabled={isSubmitting || nameError || emailError || passwordError || contactError || specializationError}>
          {isSubmitting ? t("registering_message") || "Registering..." : t("register_button")}
        </button>
      </form>
      <button
        type="button"
        className="btn secondary"
        onClick={() => navigate("/login")}
        style={{ marginTop: "1rem" }}
      >
        {t("back_to_login_button")}
      </button>
    </div>
  );
};

export default RegistrationPage;
