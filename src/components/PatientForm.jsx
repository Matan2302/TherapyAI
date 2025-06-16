import React, { useState } from "react";
import axios from "axios";
import "./PatientForm.css";
import { useTranslation } from "react-i18next";

const PatientForm = () => {
  const { t } = useTranslation("patientForm");

  const [fullName, setFullName] = useState("");
  const [DateOfBirth, setDateOfBirth] = useState("");
  const [PatientEmail, setPatientEmail] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [medicalHistoryError, setMedicalHistoryError] = useState("");
  // Additional validation states
  const [dobError, setDobError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Name validation: allow letters, numbers, spaces, hyphens, apostrophes, commas
    const nameRegex = /^[a-zA-Z0-9\s,'-]+$/;
    if (!nameRegex.test(fullName)) {
      setErrorMessage(t("invalid_name_message") || "Name contains invalid characters.");
      setSuccessMessage("");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(PatientEmail)) {
      setErrorMessage(t("invalid_email_message") || "Please enter a valid email address.");
      setSuccessMessage("");
      return;
    }

    // Medical history validation
    if (!medicalHistory.trim()) {
      setMedicalHistoryError(t("medical_history_required_message") || "Medical history is required.");
      setSuccessMessage("");
      return;
    }

    // Date of Birth validation: must be in the past and patient at least 1 year old
    const today = new Date();
    const dob = new Date(DateOfBirth);
    const age = today.getFullYear() - dob.getFullYear();
    if (!DateOfBirth) {
      setDobError(t("dob_required_message") || "Date of birth is required.");
      setSuccessMessage("");
      return;
    } else if (dob > today) {
      setDobError(t("dob_future_message") || "Date of birth cannot be in the future.");
      setSuccessMessage("");
      return;
    } else if (age < 1) {
      setDobError(t("dob_too_young_message") || "Patient must be at least 1 year old.");
      setSuccessMessage("");
      return;
    } else {
      setDobError("");
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/patients/add", {
        full_name: fullName,
        DateOfBirth: DateOfBirth,
        contact_info: PatientEmail,
        medical_history: medicalHistory,
      });

      setSuccessMessage(response.data.message || t("success_default_message"));
      setErrorMessage("");
      setFullName("");
      setDateOfBirth("");
      setPatientEmail("");
      setMedicalHistory("");
      setIsSubmitting(false);
    } catch (error) {
      setErrorMessage(
        `${t("error_default_message")}: ${error.response?.data?.detail || t("error_default_message")}`
      );
      setSuccessMessage("");
      setIsSubmitting(false);
    }
  };

  // Name validation: allow letters, numbers, spaces, hyphens, apostrophes, commas, min 2 chars
  const nameRegex = /^[a-zA-Z0-9\s,'-]{2,}$/;
  const handleNameChange = (e) => {
    const value = e.target.value;
    setFullName(value);
    if (!nameRegex.test(value)) {
      setNameError(t("invalid_name_message") || "Name must be at least 2 characters and contain only valid characters.");
    } else {
      setNameError("");
    }
  };

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setPatientEmail(value);
    if (value && !emailRegex.test(value)) {
      setEmailError(t("invalid_email_message") || "Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  // Medical history validation: min 10 chars, not only numbers/symbols
  const medHistoryRegex = /[a-zA-Z]/;
  const handleMedicalHistoryChange = (e) => {
    const value = e.target.value;
    setMedicalHistory(value);
    if (value.trim().length < 10 || !medHistoryRegex.test(value)) {
      setMedicalHistoryError(t("medical_history_required_message") || "Medical history must be at least 10 characters and contain letters.");
    } else {
      setMedicalHistoryError("");
    }
  };

  // Date of Birth validation: must be in the past and patient at least 1 year old
  const handleDateOfBirthChange = (e) => {
    const value = e.target.value;
    setDateOfBirth(value);
    const today = new Date();
    const dob = new Date(value);
    const age = today.getFullYear() - dob.getFullYear();
    if (!value) {
      setDobError(t("dob_required_message") || "Date of birth is required.");
    } else if (dob > today) {
      setDobError(t("dob_future_message") || "Date of birth cannot be in the future.");
    } else if (age < 1) {
      setDobError(t("dob_too_young_message") || "Patient must be at least 1 year old.");
    } else {
      setDobError("");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="glass-card">
        <h2>{t("add_patient_title")}</h2>
        {successMessage && <p className="success-message">{successMessage}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full-name">{t("full_name_label")}</label>
            <input
              type="text"
              id="full-name"
              value={fullName}
              onChange={handleNameChange}
              required
            />
            {nameError && <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{nameError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="DateOfBirth">{t("date_of_birth_label")}</label>
            <input
              type="date"
              id="DateOfBirth"
              value={DateOfBirth}
              onChange={handleDateOfBirthChange}
              required
            />
            {dobError && <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{dobError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contact-info">{t("patient_email_label")}</label>
            <input
              type="text"
              id="contact-info"
              value={PatientEmail}
              onChange={handleEmailChange}
              required
            />
            {emailError && <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{emailError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="medical-history">{t("medical_history_label")}</label>
            <textarea
              id="medical-history"
              value={medicalHistory}
              onChange={handleMedicalHistoryChange}
              rows={4}
              required
            />
            {medicalHistoryError && <span className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{medicalHistoryError}</span>}
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? t("submitting_message") || "Submitting..." : t("add_patient_button")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
