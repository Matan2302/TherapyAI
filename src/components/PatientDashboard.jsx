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
      // Always use selectedPatientEmail
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

  const analyzeSession = (idx) => {
    // Simulate analysis (in real app, call backend)
    const updatedSessions = [...sessions];
    updatedSessions[idx] = {
      ...updatedSessions[idx],
      SessionNotes: "Analyzed"
    };
    setSessions(updatedSessions);
  };

  return (
    <div className="patient-dashboard p-6">
      <h2 className="text-2xl mb-4">{t("dashboard_title")}</h2>

      {/* Patient search input */}
      {!showData && (
        <div
          className="name-input mb-4"
          style={{
            backgroundColor: "white",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            position: "relative",
            minWidth: "420px", // Make input container wider
            maxWidth: "600px",
          }}
        >
          <label htmlFor="name" className="text-lg font-medium" style={{ display: "block", textAlign: "center" }}>
            {t("input_name_label") || t("enter_name_label") || "Enter patient name"}
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
            placeholder={t("input_name_placeholder") || t("name_placeholder") || "Type patient name..."}
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
                minWidth: "420px", // Make suggestions wider
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
                  {patient.DateOfBirth && (
                    <div style={{ fontSize: "1rem", color: "#555" }}>
                      DOB: {patient.DateOfBirth}
                    </div>
                  )}
                  {patient.MedicalHistory && (
                    <div style={{ fontSize: "1rem", color: "#888" }}>
                      History: {patient.MedicalHistory}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Always show session dropdown if sessions are loaded */}
      {sessions.length > 0 && (
        <div style={{ margin: "1rem 0", maxWidth: 600 }}>
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
                {session.SessionDate} - {session.TherapistName} - {session.SessionNotes?.slice(0, 30) || ""}
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
              {sessions[selectedSessionIdx].SessionNotes === "Analyzed" ? (
                <>
                  {/* DASHBOARD CONTENT GOES HERE */}
                  <div>
                    <strong>{t("session_date_label") || "Session Date"}:</strong> {sessions[selectedSessionIdx].SessionDate}
                  </div>
                  <div>
                    <strong>{t("session_notes_label") || "Session Notes"}:</strong> {sessions[selectedSessionIdx].SessionNotes}
                  </div>
                  <div>
                    <strong>{t("last_therapist_name_label") || "Therapist"}:</strong> {sessions[selectedSessionIdx].TherapistName}
                  </div>
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

                <label>{t("total_sessions_label")}</label>
                <input type="text" value={patientData?.totalSessionsDone} readOnly className="input" />
              </div>
            </div>
          </div>

          {/* Only show charts if the selected session is analyzed */}
          {selectedSessionIdx !== null &&
            sessions[selectedSessionIdx] &&
            sessions[selectedSessionIdx].SessionNotes === "Analyzed" && (
              <div className="chart-row">
                <div className="section-box chart-box">
                  <h3>{t("bar_chart_title")}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sessionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="interval" label={{ value: t("time_intervals_label"), position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: t("sum_of_good_bad_label"), angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Bar dataKey="goodThema" fill="#4ade80" name={t("good_thema_label")} />
                      <Bar dataKey="badThema" fill="#f87171" name={t("bad_thema_label")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="section-box chart-box">
                  <h3>{t("pie_chart_title")}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
