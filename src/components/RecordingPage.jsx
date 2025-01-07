import React, { useState } from "react";

const RecordingPage = () => {
  const [isConsentChecked, setIsConsentChecked] = useState(false);

  const handleConsentChange = (event) => {
    setIsConsentChecked(event.target.checked);
  };

  const handleStartRecording = () => {
    alert("Recording started!");
  };

  const handlePauseRecording = () => {
    alert("Recording paused.");
  };

  const handleEndRecording = () => {
    alert("Recording ended.");
  };

  const handleUploadRecording = () => {
    alert("Recording uploaded!");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>Recording Page</h2>
      <form>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="patient-name" style={{ display: "block", marginBottom: "0.5rem" }}>
            Patient Name:
          </label>
          <input
            type="text"
            id="patient-name"
            placeholder="Enter patient name"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="date-of-treatment" style={{ display: "block", marginBottom: "0.5rem" }}>
            Date of Treatment:
          </label>
          <input
            type="date"
            id="date-of-treatment"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="therapist-name" style={{ display: "block", marginBottom: "0.5rem" }}>
            Therapist Name:
          </label>
          <input
            type="text"
            id="therapist-name"
            placeholder="Enter therapist name"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "start", marginTop: "1rem" }}>
          <span style={{ fontWeight: "bold", color: "#d9534f", fontSize: "1rem", marginBottom: "0.5rem" }}>
            Please obtain patient consent before starting!
          </span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              id="patient-consent"
              onChange={handleConsentChange}
              style={{ marginRight: "0.5rem" }}
            />
            <label htmlFor="patient-consent">Patient has given recording consent</label>
          </div>
        </div>
      </form>
      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={handleStartRecording}
          disabled={!isConsentChecked}
          style={{
            backgroundColor: isConsentChecked ? "#007bff" : "#ccc",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            marginRight: "0.5rem",
            cursor: isConsentChecked ? "pointer" : "not-allowed",
          }}
        >
          Start Recording
        </button>
        <button
          onClick={handlePauseRecording}
          disabled={!isConsentChecked}
          style={{
            backgroundColor: isConsentChecked ? "#f0ad4e" : "#ccc",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            marginRight: "0.5rem",
            cursor: isConsentChecked ? "pointer" : "not-allowed",
          }}
        >
          Pause Recording
        </button>
        <button
          onClick={handleEndRecording}
          disabled={!isConsentChecked}
          style={{
            backgroundColor: isConsentChecked ? "#d9534f" : "#ccc",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: isConsentChecked ? "pointer" : "not-allowed",
          }}
        >
          End Recording
        </button>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={handleUploadRecording}
          style={{
            backgroundColor: "#5cb85c",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Upload Recording
        </button>
      </div>
    </div>
  );
};

export default RecordingPage;
