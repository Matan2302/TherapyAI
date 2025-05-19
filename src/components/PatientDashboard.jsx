import React, { useState, useEffect } from "react";
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
  const [inputEmail, setInputEmail] = useState("");
  const [showData, setShowData] = useState(false);
  const [error, setError] = useState("");
  const [patientData, setPatientData] = useState(null);

  const fetchPatientData = async (email) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/patientsdb/dashboard-data?patient_email=${email}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(t("error_loading_data"));
      const data = await res.json();
      setPatientData(data);
      setShowData(true);
      setError('');
    } catch (err) {
      console.error(err);
      setError(t("error_loading_data"));
    }
  };

  const handleGetData = () => {
    const email = inputEmail.trim().toLowerCase();
    if (email) {
      fetchPatientData(email);
    } else {
      setShowData(false);
      setError(t("error_loading_data"));
    }
  };

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

  return (
    //make white squre in the backgroound
    <div className="patient-dashboard p-6" >
      <h2 className="text-2xl mb-4">{t("dashboard_title")}</h2>

      {!showData && (
        <div className="email-input mb-4" style={{ backgroundColor: "white", padding: "1rem", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
          <label htmlFor="email" className="text-lg font-medium">
            {t("enter_email_label")}
          </label>
          <input
            type="email"
            id="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            className="input mt-1 mb-2"
            placeholder={t("email_placeholder")}
          />
          <button onClick={handleGetData} className="btn-fetch">
            {t("get_data_button")}
          </button>
        </div>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {showData && (
        <>
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
                <textarea value={patientData?.lastSessionNotes} readOnly className="medical-history-box-wide" rows={3} />

                <label>{t("total_sessions_label")}</label>
                <input type="text" value={patientData?.totalSessionsDone} readOnly className="input" />
              </div>
            </div>
          </div>

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
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
