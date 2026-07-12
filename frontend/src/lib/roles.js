// Central place for RBAC decisions so pages/components don't hardcode role
// strings. Backend role slugs (users.role CHECK constraint) are the source
// of truth; everything else is presentation.

export const ROLES = {
  fleet_manager: "Fleet Manager",
  driver: "Driver",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

export function roleLabel(slug) {
  return ROLES[slug] || slug;
}

// Which nav items each role can see. Every GET endpoint in the backend is
// open to all authenticated roles except where noted, so we keep most pages
// visible to everyone and only gate the ones with true role-restricted
// write access end-to-end (Maintenance, Settings). Individual action
// buttons within a page (e.g. "+ Add Vehicle") should additionally check
// canEdit() below before rendering.
export function navAccess(role) {
  const base = ["dashboard", "fleet", "drivers", "trips", "fuel-expenses", "analytics"];
  if (role === "fleet_manager") return [...base, "maintenance", "settings"];
  return base;
}

// Maps a (module, action) pair to the roles allowed to perform it, mirroring
// the authorizeRoles(...) middleware on each route.
const PERMISSIONS = {
  "vehicle.create": ["fleet_manager"],
  "vehicle.update": ["fleet_manager"],
  "vehicle.retire": ["fleet_manager"],
  "vehicle.delete": ["fleet_manager"],
  "driver.create": ["safety_officer", "fleet_manager"],
  "driver.update": ["safety_officer", "fleet_manager"],
  "driver.suspend": ["safety_officer"],
  "driver.delete": ["safety_officer", "fleet_manager"],
  "trip.create": ["driver", "fleet_manager"],
  "trip.dispatch": ["driver", "fleet_manager"],
  "trip.complete": ["driver", "fleet_manager"],
  "trip.cancel": ["driver", "fleet_manager"],
  "maintenance.create": ["fleet_manager"],
  "maintenance.close": ["fleet_manager"],
  "fuel.create": ["driver", "fleet_manager"],
  "expense.create": ["driver", "fleet_manager"],
  "reports.fleet": ["financial_analyst", "fleet_manager"],
};

export function canEdit(role, permissionKey) {
  const allowed = PERMISSIONS[permissionKey];
  return !allowed || allowed.includes(role);
}

// Exposes the permission map read-only so UI (e.g. Settings' RBAC matrix) can
// render straight from the source of truth instead of a hand-maintained copy.
export function getPermissions() {
  return PERMISSIONS;
}
