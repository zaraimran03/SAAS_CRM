import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css"; // Ensure standard styles

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : "http://localhost:5000";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

export default function CustomerDetailPanel({ customer, onClose }) {
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch activities
        const actRes = await fetch(`${API_URL}/activities?relatedId=${customer._id}&relatedType=Customer`, {
          headers: authHeader(),
        });
        const actData = await actRes.json();
        if (actData.success) {
          setActivities(actData.activities);
        }

        // Fetch deals linked to this customer
        const dealRes = await fetch(`${API_URL}/deals?customerId=${customer._id}`, {
          headers: authHeader(),
        });
        const dealData = await dealRes.json();
        // Wait, dealRouter.js does not support filtering by customerId yet. I need to add it!
        // But for now, if it returns all, filter locally or update backend. I will update backend next.
        if (dealData.success) {
          setDeals(dealData.deals.filter(d => d.linkedCustomer === customer._id));
        }
      } catch (err) {
        console.error("Failed to fetch customer details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="customer-detail-panel-overlay" onClick={onClose}>
      <div 
        className="customer-detail-panel" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h2>{customer.name}</h2>
          <button className="panel-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="panel-content">
          <div className="panel-section">
            <h3>Details</h3>
            <p><strong>Company:</strong> {customer.company}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Phone:</strong> {customer.phone || "-"}</p>
            <p><strong>Status:</strong> {customer.status}</p>
            <p><strong>Value:</strong> {customer.value}</p>
            <p><strong>Owner:</strong> {customer.owner || "Unassigned"}</p>
            <p><strong>Last Contacted:</strong> {customer.lastContacted ? new Date(customer.lastContacted).toLocaleDateString() : "Never"}</p>
            <div className="tags-container">
              <strong>Tags:</strong>
              {customer.tags && customer.tags.length > 0 ? (
                customer.tags.map(t => <span key={t} className="tag-chip">{t}</span>)
              ) : (
                <span> No tags</span>
              )}
            </div>
          </div>

          <div className="panel-section">
            <h3>Recent Activities</h3>
            {loading ? (
              <p>Loading activities...</p>
            ) : activities.length > 0 ? (
              <ul className="activity-list">
                {activities.map(act => (
                  <li key={act._id}>
                    <strong>{act.type}</strong> - {act.date}
                    {act.notes && <p className="act-notes">{act.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">No activities logged yet.</p>
            )}
          </div>

          <div className="panel-section">
            <h3>Related Deals</h3>
            {loading ? (
              <p>Loading deals...</p>
            ) : deals.length > 0 ? (
              <ul className="deal-list">
                {deals.map(deal => (
                  <li key={deal._id}>
                    <strong>{deal.title}</strong> - {deal.stage} - {deal.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">No deals linked yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
