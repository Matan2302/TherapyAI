import React, { useState, useRef, useContext, useEffect } from "react";
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
  const [patientEmail, setPatientEmail] = useState(""); // <-- Add this line
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasWidth] = useState(400);
  const [canvasHeight] = useState(60);

  const { therapistName } = useContext(TherapistContext);
  const therapistEmail = localStorage.getItem("therapist_email") || "";

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
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Voice meter setup
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // Set a lower fftSize for faster updates
      source.connect(analyserRef.current);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateVolume = () => {
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const val = (dataArrayRef.current[i] - 128) / 128;
          sum += val * val;
        }
        setVolume(Math.sqrt(sum / dataArrayRef.current.length));

        // Draw waveform
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          ctx.beginPath();
          const sliceWidth = canvasWidth / dataArrayRef.current.length;
          let x = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const v = dataArrayRef.current[i] / 255;
            const y = v * canvasHeight;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.strokeStyle = "#222";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(t("microphone_access_error"));
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setBackgroundColor("blue");
      clearInterval(recordingIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      cancelAnimationFrame(animationFrameRef.current);
      setVolume(0);
    }
  };

  const handleTogglePauseResume = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        setBackgroundColor("red");
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        setBackgroundColor("yellow");
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleUploadRecording = async () => {
    if (!audioBlob || !patientEmail || !therapistEmail || !sessionDate) {
      alert(t("fill_all_fields_error"));
      return;
    }

    const formData = new FormData();
    formData.append("file", audioBlob, sessionDate + "_" + patientEmail);
    formData.append("patient_email", patientEmail);
    formData.append("therapist_email", therapistEmail); // Send therapist email
    formData.append("session_date", sessionDate);
    formData.append("notes", sessionNotes);

    try {
      setUploadStatus(t("uploading_status"));
      const response = await fetch("http://127.0.0.1:8000/audio/upload-audio/", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
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

  // Fetch patient suggestions as user types
  useEffect(() => {
    if (!patientName || patientName.trim().length === 0) {
      setPatientSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    const token = localStorage.getItem("access_token");
    fetch(
      `http://localhost:8000/patientsdb/search-patients?name=${encodeURIComponent(patientName)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setPatientSuggestions(data);
        setIsLoadingSuggestions(false);
      })
      .catch(() => {
        setPatientSuggestions([]);
        setIsLoadingSuggestions(false);
      });
  }, [patientName]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setPatientSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion) => {
    setPatientName(suggestion.FullName);
    setPatientEmail(suggestion.PatientEmail); // <-- Store the email
    setPatientSuggestions([]);
  };

  return (
    <div className="recording-page" style={{ backgroundColor }}>
      <h2>{t("recording_page_title")}</h2>
      <form autoComplete="off">
        <div className="form-group" style={{ position: "relative" }}>
          <label>{t("patient_name_label")}</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder={t("patient_name_placeholder")}
            required
            autoComplete="off"
          />
          {patientSuggestions.length > 0 && (
            <ul
              className="suggestions-list"
              ref={suggestionsRef}
              style={{
                position: "absolute",
                zIndex: 10,
                background: "#fff",
                border: "1px solid #ccc",
                width: "100%",
                maxHeight: "150px",
                overflowY: "auto",
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {patientSuggestions.map((s, idx) => (
                <li
                  key={s.PatientEmail || idx}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s.FullName} ({s.PatientEmail})
                </li>
              ))}
            </ul>
          )}
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
          <label>{t("therapist_email_label") || "Therapist Email"}</label>
          <input
            type="email"
            value={therapistEmail}
            readOnly
            style={{ background: "#f3f3f3" }}
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

      {isRecording && (
        <div
          className="recording-timer"
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#222",
            background: "#ffe082",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            width: "fit-content",
            margin: "1rem auto"
          }}
        >
          {t("recording_time") || "Recording"}: {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
        </div>
      )}

      {isRecording && (
        <div style={{ margin: "1rem auto", width: canvasWidth, background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px #0002" }}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{ display: "block", width: "100%", height: canvasHeight, background: "#fff" }}
          />
        </div>
      )}
    </div>
  );
};

export default RecordingPage;
