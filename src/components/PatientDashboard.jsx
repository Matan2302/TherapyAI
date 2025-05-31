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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const [inputName, setInputName] = useState("");
  const [showData, setShowData] = useState(false);
  const [error, setError] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(null);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState(""); // NEW
  const suggestionsRef = useRef(null);

  // Fetch patient suggestions as user types
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

  // Update fetchPatientData to accept sessionId
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

      if (!res.ok) throw new Error(t("error_loading_data"));
      const data = await res.json();
      setPatientData(data);
      setShowData(true);
      setError("");
    } catch (err) {
      console.error(err);
      setError(t("error_loading_data"));
    }
  };

  // Fetch all sessions for the selected patient
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

  // Handle patient selection from suggestions
  const handleSelectPatient = (patient) => {
    setInputName(patient.FullName);
    setSuggestions([]);
    setSelectedPatientEmail(patient.PatientEmail); // Save email for later use
    fetchPatientSessions(patient.PatientEmail);
    setShowData(false);
    setPatientData(null);
    setSelectedSessionIdx(null);
  };

  // Handle session selection
  const handleSessionSelect = (e) => {
    const idx = Number(e.target.value);
    setSelectedSessionIdx(idx);
    if (sessions[idx]) {
      fetchPatientData(selectedPatientEmail, sessions[idx].SessionID);
      setShowData(true);
    }
  };

  // Hide suggestions when clicking outside
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
        <p className="mt-4 text-lg">{t("loading_data_message")}</p>
      </div>
    );
  }

  const sessionData = patientData?.goodThema?.map((good, index) => ({
    interval: `${index * 5}-${(index + 1) * 5} min`,
    goodThema: good,
    badThema: patientData.badThema?.[index] ?? 0,
  }));

  const totalGood = patientData?.goodThema?.reduce((a, b) => a + b, 0) || 0;
  const totalBad = patientData?.badThema?.reduce((a, b) => a + b, 0) || 0;
  const pieData = [
    { name: t("good_thema_label"), value: totalGood },
    { name: t("bad_thema_label"), value: totalBad },
  ];
  const COLORS = ["#4ade80", "#f87171"];
const analyzeSession = async (idx) => {
  const session = sessions[idx];
  const token = localStorage.getItem("token");

  try {
    // Optional: add a loading state here if you want a spinner
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

    // Update session state
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
      <h2 className="text-2xl mb-4">{t("dashboard_title")}</h2>

      {/* Patient search input */}
      {!showData && (
        <div className="input-row">
          <div className="name-input">
            <label htmlFor="name" className="text-lg font-medium" style={{ display: "block", textAlign: "center" }}>
              {t("input_name_label") || "Enter patient name"}
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
              placeholder={t("input_name_placeholder") || "Type patient name..."}
              autoComplete="off"
            />
            {isLoadingSuggestions && (
              <div className="suggestions-loading">{t("loading") || "Loading..."}</div>
            )}
            {suggestions.length > 0 && (
              <ul
                className="suggestions-list"
                ref={suggestionsRef}
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  position: "absolute",
                  width: "100%",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "0 0 12px 12px",
                  zIndex: 10,
                  maxHeight: 400,
                  overflowY: "auto",
                  fontSize: "1.25rem",
                }}
              >
                {suggestions.map((patient) => (
                  <li
                    key={patient.PatientID}
                    style={{
                      padding: "16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div><strong>{patient.FullName}</strong> ({patient.PatientEmail})</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* REMOVE the session dropdown here */}
        </div>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Always show session dropdown if sessions are loaded */}
      {sessions.length > 0 && (
        <div style={{ margin: "2rem 0 1rem 0", maxWidth: 600 }}>
          <label htmlFor="session-select" style={{ fontWeight: "bold" }}>
            {t("select_session_label") || "Select a session:"}
          </label>
          <select
            id="session-select"
            value={selectedSessionIdx ?? ""}
            onChange={handleSessionSelect}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          >
            <option value="" disabled>
              {t("choose_session_option") || "Choose session..."}
            </option>
            {sessions.map((session, idx) => (
              <option key={idx} value={idx}>
                {(session.SessionDate || session.session_date)} - {(session.TherapistName || session.therapist_name)} - {(session.IsAnalyzed === true || session.is_analyzed === true) ? t("analyzed") || "Analyzed" : t("not_analyzed") || "Not Analyzed"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Only show dashboard after a session is picked */}
      {showData && (
        <>
          {/* Session details */}
          {selectedSessionIdx !== null && sessions[selectedSessionIdx] && (
            <div style={{ marginTop: "1rem", background: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
              {sessions[selectedSessionIdx].IsAnalyzed ? (
                <>
                <h3 className="text-xl mb-2">
                  {t("Analysed Session") || "Analyzed Session"}
                </h3>
                </>
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
                  {t("analyze_session_button") || "Analyze Session"}
                </button>
              )}
            </div>
          )}

          <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
            <div className="info-row">
              <div className="section-box">
                <h3>{t("patient_info_title")}</h3>
                <label>{t("full_name_label")}</label>
                <input type="text" value={patientData?.fullName} readOnly className="input" />

                <label>{t("age_label")}</label>
                <input type="text" value={calculateAge(patientData?.DateOfBirth)} readOnly className="input" />

                <label>{t("medical_history_label")}</label>
                <textarea value={patientData?.medicalHistory} readOnly className="medical-history-box-wide" />
              </div>

              <div className="section-box">
                <h3>{t("therapist_info_title")}</h3>
                <label>{t("last_therapist_name_label")}</label>
                <input type="text" value={patientData?.lastTherapist} readOnly className="input" />

                <label>{t("last_therapist_email_label")}</label>
                <input type="text" value={patientData?.lastTherapistEmail} readOnly className="input" />

                <label>{t("last_therapist_patient_email_label")}</label>
                <input type="text" value={patientData?.lastTherapistPatientEmail} readOnly className="input" />
              </div>

              <div className="section-box">
                <h3>{t("session_details_title")}</h3>
                <label>{t("session_date_label")}</label>
                <input type="text" value={patientData?.lastSessionDate} readOnly className="input" />

                <label>{t("session_notes_label")}</label>
                <textarea value={patientData?.lastSessionNotes || ""} readOnly className="input" />

                <label>{t("total_sessions_label")}</label>
                <input type="text" value={patientData?.totalSessionsDone} readOnly className="input" />
              </div>
            </div>
          </div>

          {/* Only show sentiment analysis details if the selected session is analyzed */}
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
  const { t } = useTranslation("dashboard");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!analysisUrl) return;
    setLoading(true);

    // Call your FastAPI endpoint instead of fetching the blob directly
    fetch(`http://localhost:8000/sentiment/get-analysis-from-url/?url=${encodeURIComponent(analysisUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        setSentiment(data.sentiment || data);
        setLoading(false);
      })
      .catch(() => {
        setError(t("error_loading_analysis") || "Error loading analysis");
        setLoading(false);
      });
  }, [analysisUrl, t]);

  if (loading) return <div>{t("loading_analysis") || "Loading analysis..."}</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!sentiment) return null;
return (
  <div className="chart-row-container">
    <div className="chart-row">
       <div className="section-box summary-box">
      <h3>{t("session_summary") || "Sentiment Summary"}</h3>
      <div>
        <strong>{t("total_positive_label") || "Total Positive"}:</strong> {sentiment.total_positive}
      </div>
      <div>
        <strong>{t("total_negative_label") || "Total Negative"}:</strong> {sentiment.total_negative}
      </div>
      <div>
        <strong>{t("summary_label") || "Summary"}:</strong>
        <div style={{ whiteSpace: "pre-line", marginTop: 4 }}>{sentiment.summary}</div>
      </div>
      </div>

      {/* Pie chart */}
      <div style={{ width: '100%', height: 250, marginTop: '1rem' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={[
                { name: t("positive") || "Positive", value: sentiment.total_positive },
                { name: t("negative") || "Negative", value: sentiment.total_negative },
              ]}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              <Cell fill="#4ade80" /> {/* green */}
              <Cell fill="#f87171" /> {/* red */}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="chart-row">
    <div className="section-box chart-box">
      <h3>{t("top_5_positive_label") || "Top 5 Positive"}</h3>
      <ul>
        {(sentiment.top_5_positive || []).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
    <div className="section-box chart-box">
      <h3>{t("top_5_negative_label") || "Top 5 Negative"}</h3>
      <ul>
        {(sentiment.top_5_negative || []).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  </div>
  </div>
);
}


export default PatientDashboard;
