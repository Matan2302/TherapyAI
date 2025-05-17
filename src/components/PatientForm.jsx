import React, { useState } from "react";
import axios from "axios";
import "./PatientForm.css";

const PatientForm = () => {
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

      setSuccessMessage(response.data.message || "Patient added successfully.");
      setErrorMessage("");
      setFullName("");
      setDateOfBirth("");
      setPatientEmail("");
      setMedicalHistory("");
    } catch (error) {
      setErrorMessage("Failed to add patient: " + (error.response?.data?.detail || "Unknown error"));
      setSuccessMessage("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh"
      }}
    >
      <div className="glass-card">
        <h2>Add Patient</h2>
        {successMessage && <p className="success-message">{successMessage}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full-name">Full Name</label>
            <input
              type="text"
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="DateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="DateOfBirth"
              value={DateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-info">Patient Email</label>
            <input
              type="text"
              id="contact-info"
              value={PatientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="medical-history">Medical History</label>
            <textarea
              id="medical-history"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={4}
              required
            />
          </div>

          <button type="submit" className="btn-submit">
            Add Patient
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
