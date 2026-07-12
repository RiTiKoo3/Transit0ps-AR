-- Optional seed data. Run AFTER schema.sql.
-- Passwords are all 'password123' (bcrypt-hashed via pgcrypto).

INSERT INTO users (name, email, password, role) VALUES
('Raj Sharma', 'raj@fleetflow.com', crypt('password123', gen_salt('bf')), 'fleet_manager'),
('Priya Singh', 'priya@fleetflow.com', crypt('password123', gen_salt('bf')), 'driver'),
('Amit Verma', 'amit@fleetflow.com', crypt('password123', gen_salt('bf')), 'safety_officer'),
('Neha Gupta', 'neha@fleetflow.com', crypt('password123', gen_salt('bf')), 'financial_analyst');

-- Matches the PDF's own worked example (section 5): Van-05, 500kg capacity, driver Alex.
INSERT INTO vehicles (registration_number, name, model, type, max_load_capacity, odometer, acquisition_cost, status) VALUES
('VAN-05', 'Van-05', 'Tata Ace', 'van', 500, 12000, 850000, 'available');

INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES
('Alex', 'DL-ALEX-001', 'LMV', '2027-12-31', '9999999999', 95, 'available');
