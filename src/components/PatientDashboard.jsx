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



const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const PatientDashboard = () => {
  console.log("📦 PatientDashboard component mounted");
  const navigate = useNavigate();
  //const [authError, setAuthError] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [showData, setShowData] = useState(false);
  const [error, setError] = useState("");
  const [patientData, setPatientData] = useState(null);

  // // // ✅ Backend token verification
  // const verifyToken = async () => {
  //   const token = localStorage.getItem("token");
  //   try {
  //     const res = await fetch("http://localhost:8000/auth/verify", {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (!res.ok) {
  //       throw new Error("Token invalid");
  //     }

  //     const data = await res.json();
  //     return data.valid;
  //   } catch (err) {
  //     console.error("Token verification failed:", err);
  //     return false;
  //   }
  // };
  const fetchPatientData = async (email) => {
  const token = localStorage.getItem("token");
  
    try {
      const res = await fetch(`http://localhost:8000/patients/dashboard-data?patient_email=${email}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
  
      if (!res.ok) {
        throw new Error("Failed to fetch patient data");
      }
  
      const data = await res.json();
      setPatientData(data);
      setShowData(true);
      setError('');
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setError("Could not load data.");
    }
  };

  // // // 👮‍♂️ Auth check on page load
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const token = localStorage.getItem("token");

  //     if (!token) {
  //       setAuthError(true);
  //       setTimeout(() => navigate("/login"), 5000);
  //       return;
  //     }

  //     const isValid = await verifyToken();
  //     if (!isValid) {
  //       setAuthError(true);
  //       setTimeout(() => navigate("/login"), 5000);
  //     }
  //   };

  //   checkAuth();
  // }, [navigate]);

  // 📊 Prepare chart data
  const sessionData = patientData?.goodThema?.map((good, index) => ({
    interval: `${index * 5}-${(index + 1) * 5} min`,
    goodThema: good,
    badThema: patientData.badThema?.[index] ?? 0,
  }));
  

  const handleGetData = () => {
    const email = inputEmail.trim().toLowerCase();
  
    if (email) {
      fetchPatientData(email);  // send real email to backend
    } else {
      setShowData(false);
      setError("Please enter a valid email.");
    }
  };
  if (showData && !patientData) {
    return (
      <div className="patient-dashboard" style={{ textAlign: "center", paddingTop: "3rem" }}>
        <div className="spinner" />
        <p className="mt-4 text-lg">Loading patient data...</p>
      </div>
    );
  }

  const totalGood = patientData?.goodThema?.reduce((a, b) => a + b, 0) || 0;
  const totalBad = patientData?.badThema?.reduce((a, b) => a + b, 0) || 0;

  const pieData = [
    { name: "Good Thema", value: totalGood },
    { name: "Bad Thema", value: totalBad },
  ];

  const COLORS = ["#4ade80", "#f87171"];

  // 🔴 Show error + redirection if not logged in
  // if (authError) {
  //   return (
  //     <div style={{ color: "red", padding: "2rem" }}>
  //       <h2>Unauthorized</h2>
  //       <p>You are not logged in. Redirecting to login page in 5 seconds...</p>
  //     </div>
  //   );
  // }

  // ✅ Authenticated UI
  return (
    <div className="patient-dashboard p-6">
      <h2 className="text-2xl mb-4">Patient Dashboard</h2>

      {!showData && (
        <div className="email-input mb-4">
          <label htmlFor="email" className="text-lg font-medium">
            Enter Patient Email:
          </label>
          <input
            type="email"
            id="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            className="input mt-1 mb-2"
            placeholder="patient@example.com"
          />
          <button onClick={handleGetData} className="btn-fetch">
            Get Data
          </button>
        </div>
      )}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {showData && (
        <>
        <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
          <div className="info-row">
            <div className="section-box">
              <h3 className="text-xl font-semibold mb-4">
                Patient Information
              </h3>
              <div className="mb-2">
                <label className="block font-medium">Full Name:</label>
                <input
                  type="text"
                  value={patientData?.fullName}
                  readOnly
                  className="input"
                />
              </div>
              <div className="mb-2 mt-4">
                <label className="block font-medium">Age:</label>
                <input
                  type="text"
                  value={calculateAge(patientData?.dob)}
                  readOnly
                  className="input"
                />
              </div>
              <div className="mb-2 mt-4">
                <label className="block font-medium">Medical History:</label>
                <textarea
                  value={patientData?.medicalHistory}
                  readOnly
                  className="medical-history-box-wide"
                />
              </div>
            </div>

            <div className="section-box">
              <h3 className="text-xl font-semibold mb-4">
                Therapist Information
              </h3>
              <div className="mb-2">
                <label className="block font-medium">
                  Last Session Therapist Name:
                </label>
                <input
                  type="text"
                  value={patientData?.lastTherapist}
                  readOnly
                  className="input"
                />
              </div>
              <div className="mb-2 mt-4">
                <label className="block font-medium">
                  Last Session Therapist Email:
                </label>
                <input
                  type="text"
                  value={patientData?.lastTherapistEmail}
                  readOnly
                  className="input"
                />
              </div>
              <div className="mb-2 mt-4">
                <label className="block font-medium">
                  Last Session Therapist Contact Info:
                </label>
                <input
                  type="text"
                  value={patientData?.lastTherapistContactInfo}
                  readOnly
                  className="input"
                />
              </div>
            </div>

            <div className="section-box">
              <h3 className="text-xl font-semibold mb-4">
                Last Session Details
              </h3>
              <div className="mb-2">
                <label className="block font-medium">Session Date:</label>
                <input
                  type="text"
                  value={patientData?.lastSessionDate}
                  readOnly
                  className="input"
                />
              </div>
              <div className="mb-2 mt-4">
                <label className="block font-medium">Session Notes:</label>
                <textarea
                  value={patientData?.lastSessionNotes}
                  readOnly
                  className="medical-history-box-wide"
                  rows={3}
                />
              </div>
              <div className="mb-2 mt-4">
                <label className="block font-medium">
                  Total Sessions Done:
                </label>
                <input
                  type="text"
                  value={patientData?.totalSessionsDone}
                  readOnly
                  className="input"
                />
              </div>
            </div>
          </div>
          </div>
          <div className="chart-row">
          <div className="section-box chart-box">
            <h3 className="text-xl font-semibold mb-4">
              Last Session Thema by Time Interval
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="interval"
                  label={{
                    value: "Time Intervals",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Sum of Good/Bad",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Bar dataKey="goodThema" fill="#4ade80" name="Good Thema" />
                <Bar dataKey="badThema" fill="#f87171" name="Bad Thema" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="section-box chart-box">
            <h3 className="text-xl font-semibold mb-4">
              Last Session Overall Thema Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
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
