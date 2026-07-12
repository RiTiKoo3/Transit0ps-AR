#!/bin/bash
# TransitOps end-to-end smoke test.
# Run this AFTER `npm run dev` is up and your .env points at transitops_db.
# Requires: curl, node (used only to parse JSON fields - no extra installs needed).
#
# Usage: bash test-api.sh

BASE="http://localhost:3000/api"
PASS=0
FAIL=0

jval() { node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=j$1;if(v!==undefined&&v!==null)console.log(v);}catch(e){}});" 2>/dev/null; }

check() {
  # $1 = label, $2 = actual, $3 = expected substring
  if [[ "$2" == *"$3"* ]]; then
    echo "  PASS: $1"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $1 -- got: $2"
    FAIL=$((FAIL+1))
  fi
}

echo "== 1. Register 4 users (one per role) =="
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" -d '{"name":"Raj Sharma","email":"raj@fleetflow.com","password":"password123","role":"fleet_manager"}' > /tmp/r1.json
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" -d '{"name":"Priya Singh","email":"priya@fleetflow.com","password":"password123","role":"driver"}' > /tmp/r2.json
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" -d '{"name":"Amit Verma","email":"amit@fleetflow.com","password":"password123","role":"safety_officer"}' > /tmp/r3.json
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" -d '{"name":"Neha Gupta","email":"neha@fleetflow.com","password":"password123","role":"financial_analyst"}' > /tmp/r4.json
# 201 on first run, 409 ("already exists") if you re-run the script - both are fine, so just check we got a message back
check "register fleet_manager" "$(cat /tmp/r1.json)" "message"

echo "== 2. Login as each role =="
FM_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"raj@fleetflow.com","password":"password123"}' | jval "['token']")
DRIVER_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"priya@fleetflow.com","password":"password123"}' | jval "['token']")
SO_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"amit@fleetflow.com","password":"password123"}' | jval "['token']")
FA_TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"neha@fleetflow.com","password":"password123"}' | jval "['token']")
[ -n "$FM_TOKEN" ] && echo "  PASS: fleet_manager login" && PASS=$((PASS+1)) || { echo "  FAIL: fleet_manager login"; FAIL=$((FAIL+1)); }
[ -n "$DRIVER_TOKEN" ] && echo "  PASS: driver login" && PASS=$((PASS+1)) || { echo "  FAIL: driver login"; FAIL=$((FAIL+1)); }
[ -n "$SO_TOKEN" ] && echo "  PASS: safety_officer login" && PASS=$((PASS+1)) || { echo "  FAIL: safety_officer login"; FAIL=$((FAIL+1)); }
[ -n "$FA_TOKEN" ] && echo "  PASS: financial_analyst login" && PASS=$((PASS+1)) || { echo "  FAIL: financial_analyst login"; FAIL=$((FAIL+1)); }

echo "== 3. Dashboard requires auth (should be 401 with no token) =="
NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" $BASE/dashboard)
check "dashboard blocks unauthenticated access" "$NOAUTH" "401"

echo "== 4. Fleet Manager creates vehicle Van-05 (PDF example) =="
VEHICLE_JSON=$(curl -s -X POST $BASE/vehicles -H "Content-Type: application/json" -H "Authorization: Bearer $FM_TOKEN" \
  -d '{"registration_number":"VAN-05","name":"Van-05","model":"Tata Ace","type":"van","max_load_capacity":500,"odometer":12000,"acquisition_cost":850000}')
VEHICLE_ID=$(echo "$VEHICLE_JSON" | jval "['vehicle']['id']")
check "vehicle created" "$VEHICLE_JSON" "Vehicle created"

echo "== 5. Safety Officer creates driver Alex (PDF example) =="
DRIVER_JSON=$(curl -s -X POST $BASE/drivers -H "Content-Type: application/json" -H "Authorization: Bearer $SO_TOKEN" \
  -d '{"name":"Alex","license_number":"DL-ALEX-001","license_category":"LMV","license_expiry":"2027-12-31","contact_number":"9999999999","safety_score":95}')
DRIVER_ID=$(echo "$DRIVER_JSON" | jval "['driver']['id']")
check "driver created" "$DRIVER_JSON" "Driver created"

echo "== 6. Driver creates trip with cargo=450kg (<= 500kg capacity, should succeed as PDF step 3-4) =="
TRIP_JSON=$(curl -s -X POST $BASE/trips -H "Content-Type: application/json" -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d "{\"source\":\"Warehouse A\",\"destination\":\"Warehouse B\",\"vehicle_id\":$VEHICLE_ID,\"driver_id\":$DRIVER_ID,\"cargo_weight\":450,\"planned_distance\":120}")
TRIP_ID=$(echo "$TRIP_JSON" | jval "['trip']['id']")
check "trip created as draft" "$TRIP_JSON" "draft"

echo "== 6b. Over-capacity trip should be REJECTED (cargo=600kg > 500kg) =="
OVER_JSON=$(curl -s -X POST $BASE/trips -H "Content-Type: application/json" -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d "{\"source\":\"A\",\"destination\":\"B\",\"vehicle_id\":$VEHICLE_ID,\"driver_id\":$DRIVER_ID,\"cargo_weight\":600,\"planned_distance\":50}")
check "over-capacity trip rejected" "$OVER_JSON" "exceeds"

echo "== 7. Dispatch the trip (PDF step 5: vehicle+driver -> on_trip) =="
DISPATCH_JSON=$(curl -s -X PATCH $BASE/trips/$TRIP_ID/dispatch -H "Authorization: Bearer $DRIVER_TOKEN")
check "trip dispatched" "$DISPATCH_JSON" "dispatched successfully"

VEHICLE_AFTER_DISPATCH=$(curl -s $BASE/vehicles -H "Authorization: Bearer $FM_TOKEN" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
const rows=JSON.parse(d);
const v=rows.find(r=>r.id==$VEHICLE_ID);
console.log(v.status);
});")
check "vehicle status is on_trip after dispatch" "$VEHICLE_AFTER_DISPATCH" "on_trip"

echo "== 8. A second trip for the SAME vehicle should be rejected while on_trip =="
DOUBLE_JSON=$(curl -s -X POST $BASE/trips -H "Content-Type: application/json" -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d "{\"source\":\"C\",\"destination\":\"D\",\"vehicle_id\":$VEHICLE_ID,\"driver_id\":$DRIVER_ID,\"cargo_weight\":100,\"planned_distance\":20}")
# Draft creation is allowed even while the vehicle is on_trip (planning ahead is valid) -
# the actual double-booking rule is enforced at dispatch, when the vehicle is truly committed.
DOUBLE_TRIP_ID=$(echo "$DOUBLE_JSON" | jval "['trip']['id']")
DOUBLE_DISPATCH=$(curl -s -X PATCH $BASE/trips/$DOUBLE_TRIP_ID/dispatch -H "Authorization: Bearer $DRIVER_TOKEN")
check "double-dispatch on busy vehicle rejected" "$DOUBLE_DISPATCH" "not available"

echo "== 9. Complete the first trip (PDF step 6-7: final odometer + fuel, both reset to Available) =="
COMPLETE_JSON=$(curl -s -X PATCH $BASE/trips/$TRIP_ID/complete -H "Content-Type: application/json" -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{"final_odometer":12120,"actual_distance":120,"fuel_liters":15,"fuel_cost":1800,"revenue":9000}')
check "trip completed" "$COMPLETE_JSON" "completed successfully"

VEHICLE_AFTER_COMPLETE=$(curl -s $BASE/vehicles -H "Authorization: Bearer $FM_TOKEN" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
const rows=JSON.parse(d);
const v=rows.find(r=>r.id==$VEHICLE_ID);
console.log(v.status+' '+v.odometer);
});")
check "vehicle back to available with updated odometer" "$VEHICLE_AFTER_COMPLETE" "available 12120"

echo "== 10. Fleet Manager adds a maintenance log (PDF step 8: vehicle -> in_shop) =="
MAINT_JSON=$(curl -s -X POST $BASE/maintenance -H "Content-Type: application/json" -H "Authorization: Bearer $FM_TOKEN" \
  -d "{\"vehicle_id\":$VEHICLE_ID,\"service_type\":\"Oil Change\",\"cost\":1200,\"notes\":\"Routine\"}")
MAINT_ID=$(echo "$MAINT_JSON" | jval "['log']['id']")
check "maintenance logged, vehicle in_shop" "$MAINT_JSON" "in_shop"

VEHICLE_JSON2=$(curl -s $BASE/vehicles -H "Authorization: Bearer $FM_TOKEN")
DISPATCHABLE=$(curl -s $BASE/vehicles/dispatchable -H "Authorization: Bearer $FM_TOKEN")
check "in_shop vehicle excluded from dispatchable list" "$DISPATCHABLE" "[]"

echo "== 11. Close maintenance (vehicle -> available again) =="
CLOSE_JSON=$(curl -s -X PATCH $BASE/maintenance/$MAINT_ID/close -H "Authorization: Bearer $FM_TOKEN")
check "maintenance closed, vehicle restored" "$CLOSE_JSON" "restored to available"

echo "== 12. Dashboard KPIs after all activity =="
DASH_JSON=$(curl -s $BASE/dashboard -H "Authorization: Bearer $FM_TOKEN")
check "dashboard returns kpis" "$DASH_JSON" "kpis"

echo "== 13. Reports: fleet report with fuel efficiency + ROI =="
REPORT_JSON=$(curl -s $BASE/reports/fleet -H "Authorization: Bearer $FA_TOKEN")
check "fleet report returns fuel_efficiency" "$REPORT_JSON" "fuel_efficiency"
check "fleet report returns roi" "$REPORT_JSON" "roi"

echo "== 14. CSV export =="
CSV_STATUS=$(curl -s -o /tmp/fleet_report.csv -w "%{http_code}" $BASE/reports/fleet/export -H "Authorization: Bearer $FA_TOKEN")
check "CSV export returns 200" "$CSV_STATUS" "200"
check "CSV file has header row" "$(head -1 /tmp/fleet_report.csv 2>/dev/null)" "registration_number"

echo ""
echo "=================================="
echo "RESULTS: $PASS passed, $FAIL failed"
echo "=================================="