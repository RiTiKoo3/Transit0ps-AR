TransitOps - Demo Seed Data
============================
Run these in order, in pgAdmin's Query Tool, against transitops_db.
All passwords: password123

STEP 0 (IMPORTANT) - Clear any old test data first, so there are no
unique-constraint conflicts with VAN-05 / DL-ALEX-001 from test-api.sh runs:

TRUNCATE TABLE fuel_logs, expenses, maintenance_logs, trips, vehicles, drivers, users
RESTART IDENTITY CASCADE;


STEP 1 - USERS (4 roles, all password123)
-------------------------------------------
INSERT INTO users (name, email, password, role) VALUES
('Raj Sharma', 'raj@fleetflow.com', crypt('password123', gen_salt('bf')), 'fleet_manager'),
('Priya Singh', 'priya@fleetflow.com', crypt('password123', gen_salt('bf')), 'driver'),
('Amit Verma', 'amit@fleetflow.com', crypt('password123', gen_salt('bf')), 'safety_officer'),
('Neha Gupta', 'neha@fleetflow.com', crypt('password123', gen_salt('bf')), 'financial_analyst');


STEP 2 - VEHICLES (5, covering all 4 statuses + 4 regions)
-------------------------------------------------------------
-- V1 (id 1): available, has completed trip history
INSERT INTO vehicles (registration_number, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES
('VAN-05', 'Van-05', 'Tata Ace', 'van', 500, 12120, 850000, 'available', 'North');

-- V2 (id 2): on_trip, currently dispatched
INSERT INTO vehicles (registration_number, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES
('TRK-11', 'Truck-11', 'Ashok Leyland Dost', 'truck', 3000, 45000, 1800000, 'on_trip', 'South');

-- V3 (id 3): in_shop, has an open maintenance log
INSERT INTO vehicles (registration_number, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES
('PIK-02', 'Pickup-02', 'Mahindra Bolero', 'pickup', 800, 30000, 650000, 'in_shop', 'East');

-- V4 (id 4): retired, old bus
INSERT INTO vehicles (registration_number, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES
('BUS-09', 'Bus-09', 'Tata Starbus', 'bus', 1500, 120000, 2200000, 'retired', 'West');

-- V5 (id 5): available, fresh/no history yet
INSERT INTO vehicles (registration_number, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES
('VAN-14', 'Van-14', 'Tata Ace', 'van', 450, 5000, 700000, 'available', 'North');


STEP 3 - DRIVERS (5, covering all 4 statuses incl. expired license)
------------------------------------------------------------------------
-- D1 (id 1): available, completed a trip
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('Alex', 'DL-ALEX-001', 'LMV', '2027-12-31', '9999999999', 95, 'available');

-- D2 (id 2): on_trip, currently dispatched
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('Rohan Mehta', 'DL-ROHAN-002', 'HMV', '2027-06-30', '9888888888', 88, 'on_trip');

-- D3 (id 3): off_duty AND license already expired - use to demo the "expired license" business rule
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('Sunita Rao', 'DL-SUNITA-003', 'LMV', '2026-01-01', '9777777777', 70, 'off_duty');

-- D4 (id 4): suspended - use to demo the "suspended driver" business rule
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('Vikram Joshi', 'DL-VIKRAM-004', 'HMV', '2028-03-15', '9666666666', 40, 'suspended');

-- D5 (id 5): available, fresh/no history yet
INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('Fatima Khan', 'DL-FATIMA-005', 'LMV', '2027-09-20', '9555555555', 99, 'available');


STEP 4 - TRIPS (one of each lifecycle status: draft, dispatched, completed, cancelled)
-------------------------------------------------------------------------------------------
-- T1 (id 1): COMPLETED - Van-05 + Alex, matches the PDF's own worked example
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, revenue, status, start_time, end_time) VALUES
('Warehouse A', 'Warehouse B', 1, 1, 450, 120, 120, 9000, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '3 hours');

-- T2 (id 2): DISPATCHED - Truck-11 + Rohan, currently in progress (matches vehicle/driver on_trip status above)
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, start_time) VALUES
('City Depot', 'Port Terminal', 2, 2, 2500, 300, 'dispatched', NOW() - INTERVAL '4 hours');

-- T3 (id 3): DRAFT - Van-14 + Fatima, planned but not yet dispatched
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status) VALUES
('Hub 1', 'Hub 2', 5, 5, 200, 40, 'draft');

-- T4 (id 4): CANCELLED - Van-05 + Fatima, was drafted then cancelled before dispatch
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, end_time) VALUES
('Old Route', 'Depot', 1, 5, 100, 15, 'cancelled', NOW() - INTERVAL '1 day');


STEP 5 - MAINTENANCE LOGS (one open, one closed)
-----------------------------------------------------
-- M1 (id 1): OPEN - matches Pickup-02's in_shop status above
INSERT INTO maintenance_logs (vehicle_id, service_type, cost, notes, status) VALUES
(3, 'Brake Repair', 4500, 'Front brake pads worn, replacement in progress', 'open');

-- M2 (id 2): CLOSED - historical service on Van-05, already resolved
INSERT INTO maintenance_logs (vehicle_id, service_type, cost, notes, status, closed_at) VALUES
(1, 'Oil Change', 1200, 'Routine service', 'closed', NOW() - INTERVAL '3 days');


STEP 6 - FUEL LOGS
----------------------
-- F1: fuel for the completed trip T1
INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES
(1, 1, 15, 1800, CURRENT_DATE - 2);

-- F2: fuel for the in-progress trip T2
INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES
(2, 2, 40, 4800, CURRENT_DATE);


STEP 7 - EXPENSES
---------------------
INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date) VALUES
(1, 1, 'toll', 250, CURRENT_DATE - 2);

INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date) VALUES
(2, 2, 'toll', 600, CURRENT_DATE);

INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date) VALUES
(3, NULL, 'parking', 150, CURRENT_DATE);


AFTER RUNNING ALL OF THE ABOVE, YOU SHOULD SEE:
-------------------------------------------------
Dashboard KPIs:
  Active Vehicles: 4 (all except retired Bus-09)
  Available Vehicles: 2 (Van-05, Van-14)
  Vehicles in Maintenance: 1 (Pickup-02)
  Active Trips (dispatched): 1
  Pending Trips (draft): 1
  Drivers On Duty (available + on_trip): 3
  Fleet Utilization: 25% (1 on_trip out of 4 active)

Reports (fleet report):
  Van-05 will show real fuel_efficiency (120km / 15L = 8.0) and a real ROI
  from its one completed trip. Other vehicles show 0 until they complete a trip
  (this matches your README's documented assumption: fuel efficiency/ROI only
  count completed trips).

Login credentials for frontend testing (all password123):
  Fleet Manager:      raj@fleetflow.com
  Driver:             priya@fleetflow.com
  Safety Officer:     amit@fleetflow.com
  Financial Analyst:  neha@fleetflow.com