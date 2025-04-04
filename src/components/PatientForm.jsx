import React, { useState } from "react";
import axios from "axios";
import "./PatientForm.css";

const PatientForm = () => {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post("http://127.0.0.1:8000/patients/add", {
        full_name: fullName,
        dob: dob,
        contact_info: contactInfo,
        medical_history: medicalHistory,
      });

      alert(response.data.message || "Patient added successfully.");
      setFullName("");
      setDob("");
      setContactInfo("");
      setMedicalHistory("");
    } catch (error) {
      console.error(error);
      alert("Failed to add patient: " + (error.response?.data?.detail || "Unknown error"));
    }
  };

  return (
    <div className="Patient-form">
      <h2>Add Patient</h2>
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
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact-info">Contact Info</label>
          <input
            type="text"
            id="contact-info"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
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
  );
};

export default PatientForm;
