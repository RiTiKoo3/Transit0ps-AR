// Static mock data — mirrors the values shown in the wireframe.
// Swap these out for real API calls once the backend endpoints are wired up.

export const currentUser = {
  name: "Raven K.",
  role: "Dispatcher",
  depot: "Gandhinagar Depot 624",
};

export const roles = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

export const kpis = [
  { label: "Active Vehicles", value: 53, tone: "ontrip" },
  { label: "Available Vehicles", value: 42, tone: "available" },
  { label: "Vehicles In Maintenance", value: "05", tone: "inshop" },
  { label: "Active Trips", value: 18, tone: "ontrip" },
  { label: "Pending Trips", value: "09", tone: "draft" },
  { label: "Drivers On Duty", value: 26, tone: "offduty" },
  { label: "Fleet Utilization", value: "81%", tone: "available" },
];

export const vehicleStatusBreakdown = [
  { status: "Available", value: 42, tone: "available" },
  { status: "On Trip", value: 5, tone: "ontrip" },
  { status: "In Shop", value: 5, tone: "inshop" },
  { status: "Retired", value: 1, tone: "retired" },
];

export const recentTrips = [
  { id: "TR001", vehicle: "VAN-05", driver: "Alex", status: "On Trip", eta: "45 min" },
  { id: "TR002", vehicle: "TRK-12", driver: "John", status: "Completed", eta: "—" },
  { id: "TR003", vehicle: "MINI-08", driver: "Priya", status: "Dispatched", eta: "In 10m" },
  { id: "TR006", vehicle: "—", driver: "—", status: "Draft", eta: "Awaiting vehicle" },
];

export const vehicles = [
  { reg: "GJ01AB4521", name: "VAN-05", type: "Van", capacity: "500 kg", odometer: "74,000", acqCost: "6,20,000", status: "Available" },
  { reg: "GJ01AB9981", name: "TRUCK-11", type: "Truck", capacity: "5 Ton", odometer: "1,82,000", acqCost: "24,50,000", status: "On Trip" },
  { reg: "GJ01AB1120", name: "MINI-03", type: "Mini", capacity: "1 Ton", odometer: "66,000", acqCost: "4,10,000", status: "In Shop" },
  { reg: "GJ01AB0087", name: "VAN-09", type: "Van", capacity: "750 kg", odometer: "24,900", acqCost: "5,40,000", status: "Retired" },
];

export const drivers = [
  { name: "Alex", license: "DL-88213", category: "LMV", expiry: "12/2028", contact: "9876XXXXXX", compliance: "96%", safety: "96%", status: "Available" },
  { name: "John", license: "DL-44120", category: "HMV", expiry: "03/2025", expired: true, contact: "9922XXXXXX", compliance: "81%", safety: "81%", status: "Suspended" },
  { name: "Priya", license: "DL-77031", category: "LMV", expiry: "08/2027", contact: "9910XXXXXX", compliance: "99%", safety: "99%", status: "On Trip" },
  { name: "Suresh", license: "DL-90045", category: "HMV", expiry: "01/2027", contact: "9940XXXXXX", compliance: "88%", safety: "88%", status: "Off Duty" },
];

export const liveBoard = [
  { id: "TR001", route: "Gandhinagar Depot → Ahmedabad Hub", vehicle: "VAN-05 / Alex", status: "Dispatched", note: "45 min" },
  { id: "TR004", route: "Vatva Industrial Area → Sanand Warehouse", vehicle: "TRUCK-04 / Suresh", status: "Draft", note: "Awaiting driver" },
  { id: "TR006", route: "Mansa → Kalol Depot", vehicle: "Unassigned", status: "Cancelled", note: "Vehicle sent to shop" },
];

export const maintenanceLogs = [
  { vehicle: "VAN-05", service: "Oil Change", cost: "2,500", status: "In Shop" },
  { vehicle: "TRUCK-11", service: "Engine Repair", cost: "18,000", status: "Completed" },
  { vehicle: "MINI-03", service: "Tyre Replace", cost: "6,200", status: "In Shop" },
];

export const fuelLogs = [
  { vehicle: "VAN-05", date: "05 Jul 2026", liters: "42 L", cost: "3,150" },
  { vehicle: "TRUCK-11", date: "06 Jul 2026", liters: "110 L", cost: "8,400" },
  { vehicle: "MINI-08", date: "06 Jul 2026", liters: "28 L", cost: "2,050" },
];

export const otherExpenses = [
  { trip: "TR001", vehicle: "VAN-05", toll: "120", other: "0", maint: "0", total: "120", status: "Available" },
  { trip: "TR002", vehicle: "TRK-12", toll: "340", other: "150", maint: "18,000", total: "18,490", status: "Completed" },
];

export const analyticsKpis = [
  { label: "Fuel Efficiency", value: "8.4 km/l", tone: "available" },
  { label: "Fleet Utilization", value: "81%", tone: "ontrip" },
  { label: "Operational Cost", value: "34,070", tone: "inshop" },
  { label: "Fleet ROI", value: "14.2%", tone: "available" },
];

export const monthlyRevenue = [22, 28, 26, 32, 30, 38, 42, 40];

export const costliestVehicles = [
  { name: "TRUCK-11", value: 100, tone: "retired" },
  { name: "MINI-03", value: 55, tone: "inshop" },
  { name: "VAN-05", value: 20, tone: "available" },
];

export const rbacMatrix = {
  roles: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"],
  modules: ["Fleet", "Drivers", "Trips", "Fuel/Exp", "Analytics"],
  grid: {
    "Fleet Manager": ["✓", "✓", "—", "✓", "✓"],
    "Dispatcher": ["View", "View", "✓", "—", "—"],
    "Safety Officer": ["—", "✓", "View", "—", "—"],
    "Financial Analyst": ["View", "—", "—", "✓", "✓"],
  },
};
