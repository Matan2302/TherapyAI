import React, { useState } from 'react';
import axios from 'axios';
import './PatientDashboard.css';

const PatientDashboard = () => {
  // State to hold patient ID input, good and bad thema results
  const [patientId, setPatientId] = useState('');
  const [goodThema, setGoodThema] = useState(null);
  const [badThema, setBadThema] = useState(null);
  const [error, setError] = useState(null);

  // Handle input change
  const handlePatientIdChange = (event) => {
    setPatientId(event.target.value);
  };

  // Fetch the Good and Bad Thema from the backend
  const fetchThemas = async () => {
    try {
      // Send a request to the backend API
      const response = await axios.get(`http://localhost:8000/dashb-functions/sessions/${patientId}`);
      
      // Assuming the backend returns 'goodThema' and 'badThema' values
      const { goodThema, badThema } = response.data;

      // Update state with the results
      setGoodThema(goodThema);
      setBadThema(badThema);
      setError(null); // Clear any previous errors
    } catch (err) {
      // If an error occurs (e.g., network or API error)
      setError('Error fetching the data. Please try again later.');
      setGoodThema(null);
      setBadThema(null);
    }
  };

  return (
    <div className="patient-dashboard">
      <h2 className="text-2xl mb-4">Patient Dashboard</h2>
      
      {/* Input form for Patient ID */}
      <div className="patient-id-input">
        <label htmlFor="patient-id" className="text-xl mb-2">Enter Patient ID:</label>
        <input
          type="number"
          id="patient-id"
          value={patientId}
          onChange={handlePatientIdChange}
          className="input"
          placeholder="Enter patient ID"
        />
        <button onClick={fetchThemas} className="btn-fetch">
          Fetch Themas
        </button>
      </div>

      {/* Display error if any */}
      {error && <div className="error-message">{error}</div>}

      {/* Display the fetched Good and Bad Thema */}
      {goodThema && badThema && (
        <div className="themas-result">
          <h3 className="text-xl mt-4">Last Good and Bad Thema</h3>
          <div>
            <strong>Good Thema:</strong> {goodThema}
          </div>
          <div>
            <strong>Bad Thema:</strong> {badThema}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
