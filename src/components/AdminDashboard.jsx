import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const navigate = useNavigate();

  // Check admin authentication on mount
  useEffect(() => {
    const therapistName = localStorage.getItem("therapist_name");
    const token = localStorage.getItem("token");
    if (therapistName !== "Admin" || !token) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchPending = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://127.0.0.1:8000/auth/admin/pending-therapists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Unauthorized or failed to fetch");
      const data = await res.json();
      setPendingTherapists(data);
    } catch (err) {
      console.error("Error fetching pending therapists:", err);
      setPendingTherapists([]);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line
  }, []);

  const handleApprove = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://127.0.0.1:8000/auth/admin/approve/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPending(); // Refresh list
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://127.0.0.1:8000/auth/admin/reject/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPending(); // Refresh list
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
