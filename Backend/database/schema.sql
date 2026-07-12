-- TransitOps database schema
-- Run this on a fresh PostgreSQL 17 database (e.g. transitops_db) via pgAdmin's Query Tool.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================= USERS =================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('fleet_manager','driver','safety_officer','financial_analyst')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= VEHICLES =================
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  registration_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  model TEXT,
  type TEXT NOT NULL,
  max_load_capacity NUMERIC NOT NULL,
  odometer NUMERIC DEFAULT 0,
  acquisition_cost NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','on_trip','in_shop','retired')),
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= DRIVERS =================
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_category TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  contact_number TEXT,
  safety_score NUMERIC DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','on_trip','off_duty','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= TRIPS =================
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  cargo_weight NUMERIC NOT NULL,
  planned_distance NUMERIC NOT NULL,
  actual_distance NUMERIC,
  revenue NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','dispatched','completed','cancelled')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= MAINTENANCE LOGS =================
CREATE TABLE maintenance_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  service_type TEXT NOT NULL,
  cost NUMERIC NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- ================= FUEL LOGS =================
CREATE TABLE fuel_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  trip_id INTEGER REFERENCES trips(id),
  liters NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= EXPENSES =================
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  trip_id INTEGER REFERENCES trips(id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================= INDEXES =================
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);