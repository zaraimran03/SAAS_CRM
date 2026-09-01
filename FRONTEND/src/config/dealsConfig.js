import { ROLES } from "./dashboardConfig";

export const DEAL_STAGES = [
  "Qualification",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

export const DEAL_FILTERS = ["All", ...DEAL_STAGES];

const STAGE_CLASS = {
  Qualification: "new-status",
  Proposal:      "proposal-status",
  Negotiation:   "negotiation-status",
  Won:           "won-status",
  Lost:          "lost-status",
};

const STAGE_COLOR = {
  Qualification: "#2878ee",
  Proposal:      "#e78b17",
  Negotiation:   "#9333ea",
  Won:           "#16a34a",
  Lost:          "#dc2626",
};

export function stageClass(stage) {
  return STAGE_CLASS[stage] || "new-status";
}

export function stageColor(stage) {
  return STAGE_COLOR[stage] || "#6b7280";
}

export const DEALS_COPY = {
  [ROLES.ORG_ADMIN]: {
    title: "Deals",
    subtitle: "Every deal across your organization's pipeline.",
    addButtonLabel: "+ Add new deal",
    showOwner: true,
  },

  [ROLES.SALES_MANAGER]: {
    title: "Team Deals",
    subtitle: "Every deal currently owned by your team.",
    addButtonLabel: "+ Add new deal",
    showOwner: true,
  },

  [ROLES.SALES_REP]: {
    title: "My Deals",
    subtitle: "Deals currently assigned to you.",
    addButtonLabel: "+ Add new deal",
    showOwner: false,
  },
};
