// --- Types ---
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  trend: number[];
  color: string;
}

export const IT_TEAM: TeamMember[] = [
  {
    id: "u1",
    name: "Kim De Vera",
    role: "Senior Lead",
    trend: [20, 45, 30, 80, 50, 90, 140],
    color: "#10b981",
  },
  {
    id: "u2",
    name: "Deanbry",
    role: "Network Tech",
    trend: [10, 20, 15, 40, 30, 60, 89],
    color: "#3b82f6",
  },
  {
    id: "u3",
    name: "Sam White",
    role: "Security Analyst",
    trend: [5, 15, 10, 30, 25, 40, 67],
    color: "#f59e0b",
  },
  {
    id: "u4",
    name: "SAMSAM",
    role: "Helpdesk",
    trend: [40, 80, 60, 120, 100, 180, 210],
    color: "#8b5cf6",
  },
  {
    id: "u5",
    name: "Nevaeh Christine Rose",
    role: "Systems Engineer",
    trend: [15, 30, 25, 50, 45, 70, 95],
    color: "#ec4899",
  },
  {
    id: "u6",
    name: "John Christian Alcantara",
    role: "Database Admin",
    trend: [10, 25, 20, 45, 35, 60, 82],
    color: "#06b6d4",
  },
];

export const getStatsForRange = () => ({
  pending: Math.floor(Math.random() * 15 + 2),
  ongoing: Math.floor(Math.random() * 10 + 3),
  resolved: Math.floor(Math.random() * 50 + 20),
});