import React, { useState, useRef, useContext } from "react";
import "./RecordingPage.css";
import { TherapistContext } from "../TherapistContext";
import { useTranslation } from "react-i18next";

const RecordingPage = () => {
  const { t } = useTranslation("recording");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState("blue");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [therapistName, setTherapistName] = useState("");

  const handleConsentChange = (event) => {
    setIsConsentChecked(event.target.checked);
  };

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
      setBackgroundColor("red");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(t("microphone_access_error"));
    }
  };

  const handleTogglePauseResume = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        setBackgroundColor("red");
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        setBackgroundColor("yellow");
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setBackgroundColor("blue");
    }
  };

  const handleUploadRecording = async () => {
    if (!audioBlob || !patientName || !therapistName || !sessionDate) {
      alert(t("fill_all_fields_error"));
      return;
    }

    const formData = new FormData();
    formData.append("file", audioBlob, sessionDate+"_"+patientName);
    formData.append("patient_name", patientName);
    formData.append("therapist_name", therapistName);
    formData.append("session_date", sessionDate);
    formData.append("notes", sessionNotes);

    try {
      setUploadStatus(t("uploading_status"));
      const response = await fetch("http://127.0.0.1:8000/audio/upload-audio/", {
        method: "POST",
        headers: {Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(t("upload_success_status") + ` ${result.url}`);
      } else {
        setUploadStatus(t("upload_failure_status"));
      }
    } catch (error) {
      setUploadStatus(t("connection_failure_status"));
      console.error(error);
    }
  };

  return (
    <div className="recording-page" style={{ backgroundColor }}>
      <h2>{t("recording_page_title")}</h2>
      <form>
        <div className="form-group">
          <label>{t("patient_name_label")}</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder={t("patient_name_placeholder")}
            required
          />
        </div>
        <div className="form-group">
          <label>{t("session_date_label")}</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>{t("therapist_name_label")}</label>
          <input type="text" value={therapistName}
  onChange={(e) => setTherapistName(e.target.value)}
  placeholder={t("therapist_name_placeholder")}
/>

        </div>
        <div className="form-group">
          <label>{t("session_notes_label")}</label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder={t("session_notes_placeholder")}
            rows={6}
          />
        </div>
        <div className="consent-section">
          <span>{t("consent_warning")}</span>
          <input type="checkbox" onChange={handleConsentChange} />
          <label>{t("consent_label")}</label>
        </div>
      </form>

      <div className="buttons-section">
        <button onClick={handleStartRecording} disabled={!isConsentChecked || isRecording}>
          {t("start_recording_button")}
        </button>
        {isRecording && (
          <button onClick={handleTogglePauseResume}>
            {isPaused ? t("resume_recording_button") : t("pause_recording_button")}
          </button>
        )}
        <button onClick={handleStopRecording} disabled={!isRecording}>
          {t("stop_recording_button")}
        </button>
      </div>

      {audioBlob && (
        <div className="upload-section">
          <button onClick={handleUploadRecording}>{t("upload_recording_button")}</button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      )}
    </div>
  );
};

export default RecordingPage;
