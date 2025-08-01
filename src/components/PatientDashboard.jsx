import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  LineChart,
  Line,
  ReferenceLine,
  ComposedChart,
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

const PatientInfoCard = ({ patientData, t }) => {
  if (!patientData) return null;

  return (
    <div className="section-box">
      <h3>{t("patient_info")}</h3>
      <label>{t("full_name_label")}</label>
      <input type="text" value={patientData.fullName} readOnly className="input" />

      <label>{t("age_label")}</label>
      <input type="text" value={calculateAge(patientData.DateOfBirth)} readOnly className="input" />

      <label>{t("medical_history_label")}</label>
      <textarea value={patientData.medicalHistory} readOnly className="medical-history-box-wide" />

      <label>{t("total_sessions_completed")}</label>
      <input type="text" value={patientData.totalSessionsDone} readOnly className="input" />

      <label>{t("patient_email")}</label>
      <input type="text" value={patientData.email} readOnly className="input" />
    </div>
  );
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
  const [selectedPatientEmail, setSelectedPatientEmail] = useState("");
  const [sessionRatios, setSessionRatios] = useState([]);
  const suggestionsRef = useRef(null);
  const [viewMode, setViewMode] = useState(""); // "" | "single" | "progress"


  useEffect(() => {
    if (inputName.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    const token = localStorage.getItem("access_token");
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
    const token = localStorage.getItem("access_token");
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
      setError("");      } catch (err) {
        console.error(err);
        setError(t("error_loading"));
      }
  };

  const fetchPatientSessions = async (email) => {
    const token = localStorage.getItem("access_token");
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

      // Only fetch ratios for analyzed sessions
      const analyzedSessions = data.filter(
        (s) => s.IsAnalyzed === true || s.is_analyzed === true
      );
      if (analyzedSessions.length > 0) {
        fetchSessionRatios(analyzedSessions);
      } else {
        setSessionRatios([]);
      }
    } catch (err) {
      setSessions([]);
      setSelectedSessionIdx(null);
      setSessionRatios([]);
    }
  };

const fetchSessionRatios = async (sessions) => {
  const token = localStorage.getItem("access_token");

  const results = await Promise.all(
    sessions.map(async (session) => {
      try {
        const res = await fetch(
          `http://localhost:8000/sentiment/get-analysis-from-url/?url=${encodeURIComponent(session.SessionAnalysis)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return null;

        const data = await res.json();
        const sentiment = data.sentiment || data;

        return {
          sessionDate: session.SessionDate || session.session_date,
          ratio:
            sentiment && sentiment.total_negative > 0
              ? Number(
                  (
                    sentiment.total_positive / sentiment.total_negative
                  ).toFixed(2)
                )
              : null,
        };
      } catch {
        return null;
      }
    })
  );

  const sortedResults = results
    .filter((r) => r && r.ratio !== null && r.sessionDate)
    .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

  setSessionRatios(sortedResults);
};


  const handleSelectPatient = (patient) => {
    setViewMode("");
    setInputName(patient.FullName);
    setSuggestions([]);
    setSelectedPatientEmail(patient.PatientEmail);
    fetchPatientSessions(patient.PatientEmail);
    setShowData(false);
    setPatientData(null);
    setSelectedSessionIdx(null);
    fetchPatientSessions(patient.PatientEmail)
    fetchPatientData(patient.PatientEmail)
  };

  const handleSessionSelect = (e) => {
    const idx = Number(e.target.value);
    setSelectedSessionIdx(idx);
    if (sessions[idx]) {
      fetchPatientData(selectedPatientEmail, sessions[idx].SessionID);
      setShowData(true);
      setViewMode("single")
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
        <p className="mt-4 text-lg">{t("loading_data")}</p>
      </div>
    );
  }

  const analyzeSession = async (idx) => {
    const session = sessions[idx];
    const token = localStorage.getItem("access_token");

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
      <h2 className="text-2xl mb-4">{t("dashboard_title")}</h2><br></br>
        {selectedPatientEmail && inputName && (
  <h3
    style={{
      fontSize: "1.25rem",
      fontWeight: "500",
      marginBottom: "1.5rem",
      color: "#374151", // Tailwind gray-700
      textAlign: "center",
    }}
  >
    {t("current_patient")} <span style={{ fontWeight: "600", color: "#1f2937" }}>{inputName}</span>
  </h3>
)}

      {!showData && (
        <div className="input-row">
          <div className="name-input">
            <label htmlFor="name" className="text-lg font-medium" style={{ display: "block", textAlign: "center" }}>
              {t("enter_patient_name")}
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
              placeholder={t("type_patient_name")}
              autoComplete="off"
            />
            {isLoadingSuggestions && (
              <div className="suggestions-loading">{t("loading")}</div>
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
            {t("select_session_label")}
          </label>
          <select
            id="session-select"
            value={selectedSessionIdx ?? ""}
            onChange={handleSessionSelect}
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem" }}
          >
            <option value="" disabled>
              {t("choose_session_option")}
            </option>
            {sessions.map((session, idx) => (
              <option key={idx} value={idx}>
                {(session.SessionDate || session.session_date)} - {(session.TherapistName || session.therapist_name)} - {(session.IsAnalyzed === true || session.is_analyzed === true) ? t("analyzed") : t("not_analyzed")}
              </option>
            ))}
          </select>
        </div>
      )}


    {sessions.length > 0 && selectedPatientEmail && (
  <>
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
      <button
        onClick={() => setViewMode("single")}
        disabled={selectedSessionIdx === null}
        style={{
          padding: "0.5rem 1rem",
          background: viewMode === "single" ? "#4ade80" : "#e5e7eb",
          color: viewMode === "single" ? "#fff" : "#000",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {t("view_single_session")}
      </button>

      <button
        onClick={() => setViewMode("progress")}
        style={{
          padding: "0.5rem 1rem",
          background: viewMode === "progress" ? "#4ade80" : "#e5e7eb",
          color: viewMode === "progress" ? "#fff" : "#000",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {t("view_progress")}
      </button>
    </div>

    {/* 👇 Switch Patient Button */}
    <div style={{ marginBottom: "2rem" }}>
      <button
        onClick={() => {
          // Reset state
          setShowData(false);
          setPatientData(null);
          setInputName("");
          setSuggestions([]);
          setSelectedSessionIdx(null);
          setSessions([]);
          setSessionRatios([]);
          setViewMode("");
          setSelectedPatientEmail("");
        }}
        style={{
          padding: "0.5rem 1rem",
          background: "#facc15",
          color: "#000",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        🔄 {t("switch_patient")}
      </button>
    </div>
  </>
)}


      {showData && (
        <>
{selectedSessionIdx !== null &&
  sessions[selectedSessionIdx] &&
  viewMode === "single" && (
    <div
      style={{
        marginTop: "1rem",
        background: "#f9f9f9",
        padding: "1rem",
        borderRadius: "8px",
      }}
    >
      {!sessions[selectedSessionIdx].IsAnalyzed && (
        <button
          onClick={() => analyzeSession(selectedSessionIdx)}
          style={{
            padding: "0.5rem 1rem",
            background: "#4ade80",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {t("analyze_session")}
        </button>
      )}
    </div>
)}

          {viewMode == "single" && (
          <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
            <div className="info-row">
              <PatientInfoCard patientData={patientData} t={t} />
              <div className="section-box">
                <h3>{t("therapist_info")}</h3>
                <label>{t("therapist_name")}</label>
                <input type="text" value={patientData?.lastTherapist} readOnly className="input" />

                <label>{t("therapist_email")}</label>
                <input type="text" value={patientData?.lastTherapistEmail} readOnly className="input" />

                <label>{t("therapist_contact_info")}</label>
                <input type="text" value={patientData?.lastTherapistPatientEmail} readOnly className="input" />
              </div>

              <div className="section-box">
                <h3>{t("session_details")}</h3>
                <label>{t("session_date")}</label>
                <input type="text" value={patientData?.lastSessionDate} readOnly className="input" />

                <label>{t("session_notes")}</label>
                <textarea value={patientData?.lastSessionNotes || ""} readOnly className="input" />

                
              </div>
            </div>
          </div>
          )}

          {viewMode == "single" && 
            selectedSessionIdx !== null &&
            sessions[selectedSessionIdx] &&
            sessions[selectedSessionIdx].IsAnalyzed && (
              <SentimentDetailsDisplay analysisUrl={sessions[selectedSessionIdx].SessionAnalysis} />
          )}
{viewMode === "progress" && patientData && (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: "2rem",
      width: "100%",
      maxWidth: "1100px",
      margin: "2rem auto",
    }}
  >
    {/* Left: Patient Info */}
    <PatientInfoCard patientData={patientData} t={t} />

    {/* Right: Progress Chart */}
    {sessionRatios.length > 0 ? (
      <div style={{ flex: 2, background: "#fff", padding: "1rem", borderRadius: "8px" }}>
        <h3>
          {t("progress_summary")}
          {sessions.length > sessionRatios.length && (
            <span
              style={{
                color: "#f87171",
                fontWeight: "normal",
                fontSize: "1rem",
                marginLeft: "10px",
              }}
            >
              {t("not_all_sessions_analyzed")}
            </span>
          )}
        </h3>
<ResponsiveContainer width="100%" height={450}>
  <ComposedChart data={sessionRatios}>
<ReferenceLine
  y={1}
  stroke="#f87171"
  strokeDasharray="4 4"
  label={{
    value: t("balanced_session"),
    position: "right",
    fill: "#f87171",
    fontSize: 12,
    dy: -6, // optional vertical offset
  }}
/>
    <CartesianGrid stroke="#f0f0f0" />
    <XAxis dataKey="sessionDate" />
    <YAxis domain={[0, 1]} />
    <Tooltip
      formatter={(value, name) =>
        name === "ratio" && typeof value === "number"
          ? value.toFixed(2)
          : value
      }
    />
    {/* Histogram bars */}
    <Bar dataKey="ratio" fill="#8c92ac" barSize={40} />

    {/* Trendline over bar tops */}
    <Line
      type="monotone"
      dataKey="ratio"
      stroke="#60a5fa"
      strokeDasharray="5 5"
      strokeWidth={2}
      dot={{ r: 3 }}
    />
  </ComposedChart>
</ResponsiveContainer>

      </div>
    ) : (
      <div style={{ flex: 2, padding: "1rem" }}>
        <p style={{ color: "#888" }}>{t("no_analyzed_sessions")}</p>
      </div>
    )}
  </div>
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

  const token = localStorage.getItem("access_token");
  fetch(
    `http://localhost:8000/sentiment/get-analysis-from-url/?url=${encodeURIComponent(analysisUrl)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then((res) => {
      if (!res.ok) throw new Error("403 or invalid response");
      return res.json();
    })
    .then((data) => {
      setSentiment(data.sentiment || data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Sentiment fetch error:", err);
      setError(t("error_loading_analysis"));
      setLoading(false);
    });
}, [analysisUrl, t]);


  if (loading) return <div>{t("loading_analysis")}</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!sentiment) return null;

  const ratio = (sentiment.total_positive / sentiment.total_negative).toFixed(2);

  return (
    <div className="sentiment-dashboard-container">
      <div className="top-section">
        <div className="summary-card">
          <h3>{t("session_summary")}</h3>
          <p><strong>{t("total_positive")}</strong> {sentiment.total_positive}</p>
          <p><strong>{t("total_negative")}</strong> {sentiment.total_negative}</p>
          <p><strong>{t("summary")}</strong></p>
          <p style={{ whiteSpace: "pre-line", marginTop: 4 }}>{sentiment.summary}</p>
        </div>

        <div className="pie-chart-card">
          <h3>{t("sentiment_chart")}</h3>
          <div className="big-pie-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: `${t("positive_highlights")} (${sentiment.total_positive})`, value: sentiment.total_positive },
                    { name: `${t("negative_highlights")} (${sentiment.total_negative})`, value: sentiment.total_negative },
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
            <span className="ratio-label">{t("pos_neg_ratio")}</span>
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
          <h3>{t("positive_highlights")}</h3>
          <ul>
            {(sentiment.top_5_positive || []).map((item, idx) => (
              <li key={idx} className="highlight-positive">{item}</li>
            ))}
          </ul>
        </div>
        <div className="list-card">
          <h3>{t("negative_highlights")}</h3>
          <ul>
            {(sentiment.top_5_negative || []).map((item, idx) => (
              <li key={idx} className="highlight-negative">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};


export default PatientDashboard;