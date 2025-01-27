import React, { useState } from "react";
import axios from "axios";
import "./TherapistForm.css"; // Import CSS for styling

const TherapistForm = () => {
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/insert_therapist/", {
        full_name: fullName,        // ✅ Match FastAPI field names
        specialization: specialization,
        contact_info: contactInfo,
      });

      alert(response.data.message);
      setFullName("");
      setSpecialization("");
      setContactInfo("");
    } catch (error) {
      alert("Failed to add therapist: " + (error.response?.data?.detail || "Unknown error"));
    }
  };

  return (
    <div className="therapist-form">
      <h2>Add Therapist</h2>
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
          <label htmlFor="contact-info">Contact Info</label>
          <input
            type="text"
            id="contact-info"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-submit">
          Add Therapist
        </button>
      </form>
    </div>
  );
};

export default TherapistForm;