import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://127.0.0.1:8000/admin/pending-therapists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setPendingTherapists(data);
      setIsAdmin(true);
    } catch (err) {
      console.error("Error fetching pending therapists:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const token = localStorage.getItem("access_token");
    try {
      await fetch(`http://127.0.0.1:8000/admin/approve/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPending();
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem("access_token");
    try {
      console.log(id)
      await fetch(`http://127.0.0.1:8000/admin/reject/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchPending();
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  if (loading) return <p>Loading admin dashboard...</p>;

  if (!isAdmin) return <p>Access denied. Admins only.</p>;

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
