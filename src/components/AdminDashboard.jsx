import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [pendingTherapists, setPendingTherapists] = useState([]);

  const fetchPending = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/admin/pending-therapists");
      const data = await res.json();
      setPendingTherapists(data);
    } catch (err) {
      console.error("Error fetching pending therapists:", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/auth/admin/approve/${id}`, {
        method: "POST",
      });
      fetchPending(); // רענון רשימה
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/auth/admin/reject/${id}`, {
        method: "DELETE",
      });
      fetchPending(); // רענון רשימה
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <p>Pending therapist approvals:</p>

      {pendingTherapists.length === 0 ? (
        <p>No pending therapists</p>
      ) : (
        <table className="therapist-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingTherapists.map((therapist) => (
              <tr key={therapist.id}>
                <td>{therapist.full_name}</td>
                <td>{therapist.email}</td>
                <td>{therapist.specialization}</td>
                <td>
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(therapist.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(therapist.id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
