import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css"; // Ensure standard styles
import AddPurchaseModal from "./AddPurchaseModal";

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
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [customerState, setCustomerState] = useState(customer);

  useEffect(() => {
    if (!customer) return;
    setCustomerState(customer);

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

  const addPurchase = async (purchase) => {
    const response = await fetch(`${API_URL}/customers/${customer._id}/purchases`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(purchase),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to add purchase");
    setCustomerState(data.customer);
    setPurchaseOpen(false);
  };

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
            <p><strong>Company Name:</strong> {customerState.company}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Phone:</strong> {customer.phone || "-"}</p>
            <p><strong>Status:</strong> {customerState.status === "Inactive" ? "INACTIVE" : customerState.status}</p>
            <p><strong>Full Balance:</strong> ${Number(customerState.balance || 0).toLocaleString()}</p>
            <p><strong>Owner:</strong> {customerState.owner || "Unassigned"}</p>
            <p><strong>Last Contacted:</strong> {customerState.lastContacted ? new Date(customerState.lastContacted).toLocaleDateString() : "Never"}</p>
            <button type="button" className="add-lead-btn" onClick={() => setPurchaseOpen(true)}>Add Purchase</button>
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
      <AddPurchaseModal isOpen={purchaseOpen} onClose={() => setPurchaseOpen(false)} onSubmit={addPurchase} />
    </div>
  );
}
