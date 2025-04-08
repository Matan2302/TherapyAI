import React, { useState, useRef, useContext } from "react";
import "./RecordingPage.css"; // Make sure this file exists and updated
import { TherapistContext } from "../TherapistContext"; // Import TherapistContext

const RecordingPage = () => {
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState("blue"); // Default background color
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [sessionNotes, setSessionNotes] = useState("");

  // Form State
  const [patientName, setPatientName] = useState("");
  const [sessionDate, setSessionDate] = useState("");

  // Therapist Name from Context
  const { therapistName } = useContext(TherapistContext);

  // Handle patient consent checkbox
  const handleConsentChange = (event) => {
    setIsConsentChecked(event.target.checked);
  };

  // Start Recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setBackgroundColor("red"); // Change background to red
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied. Please check your browser settings.");
    }
  };

  // Toggle Pause/Resume Recording
  const handleTogglePauseResume = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        setBackgroundColor("red"); // Change background back to red
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        setBackgroundColor("yellow"); // Change background to yellow
      }
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setBackgroundColor("blue"); // Change background back to blue
    }
  };

  // Upload Recording to FastAPI Backend
  const handleUploadRecording = async () => {
    if (!audioBlob || !patientName || !therapistName || !sessionDate) {
      alert("Please fill in all fields before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    formData.append("patient_name", patientName);
    formData.append("therapist_name", therapistName);
    formData.append("session_date", sessionDate);
    formData.append("notes", sessionNotes);
    try {
      setUploadStatus("Uploading...");
      const response = await fetch("http://127.0.0.1:8000/audio/upload-audio/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`Uploaded successfully: ${result.url}`);
      } else {
        setUploadStatus("Upload failed. Please try again.");
      }
    } catch (error) {
      setUploadStatus("Upload failed. Please check your connection.");
      console.error(error);
    }
  };

  return (
    <div className="recording-page" style={{ backgroundColor }}>
      <h2>Recording Page</h2>
      <form>
        <div className="form-group">
          <label>Patient Name</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name"
            required
          />
        </div>
        <div className="form-group">
          <label>Date of Treatment</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Therapist Name</label>
          <input
            type="text"
            value={therapistName || ""}
            readOnly
            placeholder="Therapist Name"
          />
        </div>
        <div className="form-group">
        <label>Session Notes</label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Write session notes here..."
          rows={6}
        />
        </div>
        <div className="consent-section">
          <span>Please obtain patient consent before starting!</span>
          <input type="checkbox" onChange={handleConsentChange} />
          <label>Patient has given recording consent</label>
        </div>
      </form>
      <div className="buttons-section">
        <button onClick={handleStartRecording} disabled={!isConsentChecked || isRecording}>
          Start Recording
        </button>
        {isRecording && (
          <button onClick={handleTogglePauseResume}>
            {isPaused ? "Resume Recording" : "Pause Recording"}
          </button>
        )}
        <button onClick={handleStopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>

      {/* Upload Section */}
      {audioBlob && (
        <div className="upload-section">
          <button onClick={handleUploadRecording}>Upload Recording</button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      )}
    </div>
  );
};

export default RecordingPage;
