import { ROLES } from "./dashboardConfig";

export const CUSTOMER_FILTERS = ["All", "Active", "Inactive"];

const STATUS_CLASS = {
  Active: "won-status",
  Inactive: "proposal-status",
};

export function statusClass(status) {
  return STATUS_CLASS[status] || "new-status";
}

export const CUSTOMERS_COPY = {
  [ROLES.ORG_ADMIN]: {
    title: "Customers",
    subtitle: "Every customer across your organization.",
    addButtonLabel: "+ Add new customer",
    showOwner: true,
    statCards: [
      { label: "Total Customers", value: "846", icon: "●", color: "blue" },
      { label: "New This Week", value: "14", icon: "▤", color: "purple" },
      { label: "Retention Rate", value: "94.2%", icon: "%", color: "green" },
    ],
    rows: [
      { name: "John Doe", company: "Acme Inc.", email: "john@acme.com", owner: "Alex Kim", status: "Active", value: "$12,500" },
      { name: "Jane Smith", company: "Globex Corp.", email: "jane@globex.com", owner: "Priya Rao", status: "Inactive", value: "$8,200" },
      { name: "Sara Lee", company: "Initech", email: "sara@initech.com", owner: "Priya Rao", status: "Active", value: "$22,000" },
    ],
  },

  [ROLES.SALES_MANAGER]: {
    title: "Team Customers",
    subtitle: "Every customer currently managed by your team.",
    addButtonLabel: "+ Add new customer",
    showOwner: true,
    statCards: [
      { label: "Team Customers", value: "312", icon: "●", color: "blue" },
      { label: "New This Week", value: "8", icon: "▤", color: "purple" },
      { label: "Retention Rate", value: "91.5%", icon: "%", color: "green" },
    ],
    rows: [
      { name: "John Doe", company: "Acme Inc.", email: "john@acme.com", owner: "Alex Kim", status: "Active", value: "$12,500" },
      { name: "Jane Smith", company: "Globex Corp.", email: "jane@globex.com", owner: "Priya Rao", status: "Inactive", value: "$8,200" },
    ],
  },

  [ROLES.SALES_REP]: {
    title: "My Customers",
    subtitle: "Customers currently assigned to you.",
    addButtonLabel: "+ Add new customer",
    showOwner: false,
    statCards: [
      { label: "My Customers", value: "48", icon: "●", color: "blue" },
      { label: "New This Week", value: "3", icon: "▤", color: "purple" },
      { label: "Retention Rate", value: "96.2%", icon: "%", color: "green" },
    ],
    rows: [
      { name: "John Doe", company: "Acme Inc.", email: "john@acme.com", status: "Active", value: "$12,500" },
      { name: "Jane Smith", company: "Globex Corp.", email: "jane@globex.com", status: "Inactive", value: "$8,200" },
    ],
  },
};
