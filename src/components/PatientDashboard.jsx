import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import "./PatientDashboard.css";

const calculateAge = (DateOfBirth) => {
  const birthDate = new Date(DateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [inputName, setInputName] = useState("");
  const [showData, setShowData] = useState(false);
  const [error, setError] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(null);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState("");
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (inputName.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    const token = localStorage.getItem("token");
    fetch(
      `http://localhost:8000/patientsdb/search-patients?name=${encodeURIComponent(inputName)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data);
        setIsLoadingSuggestions(false);
      })
      .catch(() => {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
      });
  }, [inputName]);

  const fetchPatientData = async (email, sessionId = null) => {
    const token = localStorage.getItem("token");
    try {
      let url = `http://localhost:8000/patientsdb/dashboard-data?patient_email=${email}`;
      if (sessionId !== null) {
        url += `&session_id=${sessionId}`;
      }
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error loading data");
      const data = await res.json();
      setPatientData(data);
      setShowData(true);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error loading data");
    }
  };

  const fetchPatientSessions = async (email) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:8000/patientsdb/all-sessions?patient_email=${email}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setSessions(data);
      setSelectedSessionIdx(null);
    } catch (err) {
      setSessions([]);
      setSelectedSessionIdx(null);
    }
  };

  const handleSelectPatient = (patient) => {
    setInputName(patient.FullName);
    setSuggestions([]);
    setSelectedPatientEmail(patient.PatientEmail);
    fetchPatientSessions(patient.PatientEmail);
    setShowData(false);
    setPatientData(null);
    setSelectedSessionIdx(null);
  };

  const handleSessionSelect = (e) => {
    const idx = Number(e.target.value);
    setSelectedSessionIdx(idx);
    if (sessions[idx]) {
      fetchPatientData(selectedPatientEmail, sessions[idx].SessionID);
      setShowData(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (showData && !patientData) {
    return (
      <div className="patient-dashboard" style={{ textAlign: "center", paddingTop: "3rem" }}>
        <div className="spinner" />
        <p className="mt-4 text-lg">Loading data...</p>
      </div>
    );
  }

  const analyzeSession = async (idx) => {
    const session = sessions[idx];
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:8000/sentiment/analyze-sentiment/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: session.SessionID }),
      });

      const data = await res.json();
      console.log("Analysis complete:", data);

      const updatedSessions = [...sessions];
      updatedSessions[idx] = {
        ...updatedSessions[idx],
        SessionNotes: "Analyzed",
        IsAnalyzed: true,
        SessionAnalysis: data.analysis_url,
      };
      setSessions(updatedSessions);

    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  return (
    <div className="patient-dashboard p-6">
      <h2 className="text-2xl mb-4">Patient Dashboard</h2>

      {!showData && (
        <div className="input-row">
          <div className="name-input">
            <label htmlFor="name" className="text-lg font-medium" style={{ display: "block", textAlign: "center" }}>
              Enter patient name
            </label>
            <input
              type="text"
              id="name"
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                setShowData(false);
                setPatientData(null);
                setError("");
              }}
              className="input mt-1 mb-2"
              placeholder="Type patient name..."
              autoComplete="off"
            />
            {isLoadingSuggestions && (
              <div className="suggestions-loading">Loading...</div>
            )}
            {suggestions.length > 0 && (
              <ul className="suggestions-list" ref={suggestionsRef}>
                {suggestions.map((patient) => (
                  <li
                    key={patient.PatientID}
                    style={{ padding: "16px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div><strong>{patient.FullName}</strong> ({patient.PatientEmail})</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {sessions.length > 0 && (
        <div style={{ margin: "2rem 0 1rem 0", maxWidth: 600 }}>
          <label htmlFor="session-select" style={{ fontWeight: "bold" }}>
            Select a session:
          </label>
          <select
            id="session-select"
            value={selectedSessionIdx ?? ""}
            onChange={handleSessionSelect}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem" }}
          >
            <option value="" disabled>
              Choose session...
            </option>
            {sessions.map((session, idx) => (
              <option key={idx} value={idx}>
                {(session.SessionDate || session.session_date)} - {(session.TherapistName || session.therapist_name)} - {(session.IsAnalyzed === true || session.is_analyzed === true) ? "Analyzed" : "Not Analyzed"}
              </option>
            ))}
          </select>
        </div>
      )}

      {showData && (
        <>
          {selectedSessionIdx !== null && sessions[selectedSessionIdx] && (
            <div style={{ marginTop: "1rem", background: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
              {sessions[selectedSessionIdx].IsAnalyzed ? (
                <h3 className="text-xl mb-2">Analyzed Session</h3>
              ) : (
                <button
                  onClick={() => analyzeSession(selectedSessionIdx)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#4ade80",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Analyze Session
                </button>
              )}
            </div>
          )}

          <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
            <div className="info-row">
              <div className="section-box">
                <h3>Patient Info</h3>
                <label>Full Name</label>
                <input type="text" value={patientData?.fullName} readOnly className="input" />

                <label>Age</label>
                <input type="text" value={calculateAge(patientData?.DateOfBirth)} readOnly className="input" />

                <label>Medical History</label>
                <textarea value={patientData?.medicalHistory} readOnly className="medical-history-box-wide" />
              </div>

              <div className="section-box">
                <h3>Therapist Info</h3>
                <label>Therapist Name</label>
                <input type="text" value={patientData?.lastTherapist} readOnly className="input" />

                <label>Therapist Email</label>
                <input type="text" value={patientData?.lastTherapistEmail} readOnly className="input" />

                <label>Patient Email</label>
                <input type="text" value={patientData?.lastTherapistPatientEmail} readOnly className="input" />
              </div>

              <div className="section-box">
                <h3>Session Details</h3>
                <label>Session Date</label>
                <input type="text" value={patientData?.lastSessionDate} readOnly className="input" />

                <label>Session Notes</label>
                <textarea value={patientData?.lastSessionNotes || ""} readOnly className="input" />

                <label>Total Sessions</label>
                <input type="text" value={patientData?.totalSessionsDone} readOnly className="input" />
              </div>
            </div>
          </div>

          {selectedSessionIdx !== null &&
            sessions[selectedSessionIdx] &&
            sessions[selectedSessionIdx].IsAnalyzed && (
              <SentimentDetailsDisplay analysisUrl={sessions[selectedSessionIdx].SessionAnalysis} />
          )}
        </>
      )}
    </div>
  );
};

const SentimentDetailsDisplay = ({ analysisUrl }) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!analysisUrl) return;
    setLoading(true);

    fetch(`http://localhost:8000/sentiment/get-analysis-from-url/?url=${encodeURIComponent(analysisUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        setSentiment(data.sentiment || data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error loading analysis");
        setLoading(false);
      });
  }, [analysisUrl]);

  if (loading) return <div>Loading analysis...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!sentiment) return null;

  const ratio = (sentiment.total_positive / sentiment.total_negative).toFixed(2);

  return (
    <div className="sentiment-dashboard-container">
      <div className="top-section">
        <div className="summary-card">
          <h3>Session Summary</h3>
          <p><strong>Total Positive:</strong> {sentiment.total_positive}</p>
          <p><strong>Total Negative:</strong> {sentiment.total_negative}</p>
          <p><strong>Summary:</strong></p>
          <p style={{ whiteSpace: "pre-line", marginTop: 4 }}>{sentiment.summary}</p>
        </div>

        <div className="pie-chart-card">
          <h3>Sentiment Chart</h3>
          <div className="big-pie-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: `Positive (${sentiment.total_positive})`, value: sentiment.total_positive },
                    { name: `Negative (${sentiment.total_negative})`, value: sentiment.total_negative },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  <Cell fill="#4ade80" />
                  <Cell fill="#f87171" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="ratio-indicator">
            <span className="ratio-label">Pos/Neg Ratio:</span>
            <span
              className={`ratio-value ${
                ratio >= 1 ? "positive-ratio" : "negative-ratio"
              }`}
            >
              {ratio}
            </span>
          </div>
        </div>
      </div>

      <div className="bottom-section">
        <div className="list-card">
          <h3>Positive Highlights</h3>
          <ul>
            {(sentiment.top_5_positive || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="list-card">
          <h3>Negative Highlights</h3>
          <ul>
            {(sentiment.top_5_negative || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};


export default PatientDashboard;
