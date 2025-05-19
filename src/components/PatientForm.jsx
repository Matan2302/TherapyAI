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

  const handleSubmit = async (event) => {
    event.preventDefault();

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
    } catch (error) {
      setErrorMessage(
        `${t("error_default_message")}: ${error.response?.data?.detail || t("error_default_message")}`
      );
      setSuccessMessage("");
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
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="DateOfBirth">{t("date_of_birth_label")}</label>
            <input
              type="date"
              id="DateOfBirth"
              value={DateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-info">{t("patient_email_label")}</label>
            <input
              type="text"
              id="contact-info"
              value={PatientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="medical-history">{t("medical_history_label")}</label>
            <textarea
              id="medical-history"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={4}
              required
            />
          </div>

          <button type="submit" className="btn-submit">
            {t("add_patient_button")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
