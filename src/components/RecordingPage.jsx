import React, { useState } from "react";
import "./RecordingPage.css"; // Import the CSS file for styling

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
    <div className="recording-page">
      <h2>Recording Page</h2>
      <form>
        <div className="form-group">
          <label htmlFor="patient-name">Patient Name</label>
          <input type="text" id="patient-name" placeholder="Enter patient name" />
        </div>
        <div className="form-group">
          <label htmlFor="date-of-treatment">Date of Treatment</label>
          <input type="date" id="date-of-treatment" />
        </div>
        <div className="form-group">
          <label htmlFor="therapist-name">Therapist Name</label>
          <input type="text" id="therapist-name" placeholder="Enter therapist name" />
        </div>
        <div className="consent-section">
          <span>Please obtain patient consent before starting!</span>
          <div>
            <input
              type="checkbox"
              id="patient-consent"
              onChange={handleConsentChange}
            />
            <label htmlFor="patient-consent">Patient has given recording consent</label>
          </div>
        </div>
      </form>
      <div className="buttons-section">
        <button onClick={handleStartRecording} disabled={!isConsentChecked}>
          Start Recording
        </button>
        <button onClick={handlePauseRecording} disabled={!isConsentChecked}>
          Pause Recording
        </button>
        <button onClick={handleEndRecording} disabled={!isConsentChecked}>
          End Recording
        </button>
      </div>
      <div className="upload-section">
        <button onClick={handleUploadRecording}>Upload Recording</button>
      </div>
    </div>
  );
};

export default RecordingPage;
