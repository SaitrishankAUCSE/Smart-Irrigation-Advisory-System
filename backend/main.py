import os
import json
import base64
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore, auth
import pandas as pd

# Initialize Firebase Admin
try:
    if os.environ.get("FIREBASE_SERVICE_ACCOUNT_BASE64"):
        # For Render deployment: base64 encoded service account JSON
        creds_json = base64.b64decode(os.environ.get("FIREBASE_SERVICE_ACCOUNT_BASE64")).decode('utf-8')
        cred_dict = json.loads(creds_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credentials (works locally if logged in)
        firebase_admin.initialize_app()
    print("Firebase Admin initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase Admin: {e}")

db = firestore.client()

app = FastAPI(title="AgriSense API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_auth(req: Request) -> dict:
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split("Bearer ")[1]
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {e}")

def get_recommendation(moisture_percent: float, crop_stage_rule: dict, rain_probability_percent: float, expected_rainfall_mm: float) -> dict:
    threshold = crop_stage_rule.get("moisture_threshold_percent", 0.0)
    daily_need = crop_stage_rule.get("water_requirement_mm_per_day", 0.0)

    if moisture_percent >= threshold:
        return { "recommendation": "wait", "amount_mm": 0, "reason": "Soil moisture is above threshold for this growth stage." }

    if rain_probability_percent >= 60 and expected_rainfall_mm >= daily_need * 0.7:
        return { "recommendation": "wait", "amount_mm": 0, "reason": "High rain probability expected to cover most of the water need." }

    deficit_factor = (threshold - moisture_percent) / threshold
    recommended_amount = round(daily_need * (1 + deficit_factor), 1)

    return { "recommendation": "irrigate", "amount_mm": recommended_amount, "reason": f"Soil moisture {moisture_percent}% is below the {threshold}% threshold for this stage." }

@app.get("/weather")
def get_weather(id: str, request: Request):
    user = verify_auth(request)
    docs = db.collection("weather_data").where("field_id", "==", id).order_by("fetched_at", direction=firestore.Query.DESCENDING).limit(1).stream()
    result = [{**doc.to_dict(), "id": doc.id} for doc in docs]
    if result:
        return result[0]
    else:
        return {"rain_probability_percent": 20, "expected_rainfall_mm": 0, "temperature_c": 30, "source": "mock"}

@app.post("/weather")
async def post_weather(id: str, request: Request):
    user = verify_auth(request)
    data = await request.json()
    data["field_id"] = id
    data["fetched_at"] = firestore.SERVER_TIMESTAMP
    _, ref = db.collection("weather_data").add(data)
    return {"id": ref.id, **data}

@app.get("/recommendation")
def recommendation(id: str, request: Request):
    user = verify_auth(request)
    
    field_doc = db.collection("fields").document(id).get()
    if not field_doc.exists:
        raise HTTPException(status_code=404, detail="Field not found")
        
    field_data = field_doc.to_dict()
    
    # Get latest moisture
    moisture_docs = list(db.collection("fields").document(id).collection("moistureReadings").order_by("created_at", direction=firestore.Query.DESCENDING).limit(1).stream())
    if not moisture_docs:
        raise HTTPException(status_code=400, detail="No moisture readings found")
    moisture_percent = moisture_docs[0].to_dict().get("moisture_percent", 0.0)
    
    # Get latest weather
    weather_docs = list(db.collection("weather_data").where("field_id", "==", id).order_by("fetched_at", direction=firestore.Query.DESCENDING).limit(1).stream())
    if not weather_docs:
        rain_prob = 0
        exp_rain = 0
    else:
        w_data = weather_docs[0].to_dict()
        rain_prob = w_data.get("rain_probability_percent", 0)
        exp_rain = w_data.get("expected_rainfall_mm", 0)
        
    # Get crop stage rule
    crop_type = field_data.get("crop_type")
    stage = field_data.get("current_growth_stage")
    rules = list(db.collection("crop_stage_rules").where("crop_type", "==", crop_type).where("growth_stage", "==", stage).stream())
    if not rules:
        raise HTTPException(status_code=400, detail=f"No rule found for {crop_type} - {stage}")
    rule_data = rules[0].to_dict()
    
    return get_recommendation(moisture_percent, rule_data, rain_prob, exp_rain)

@app.get("/analytics/water-usage")
def analytics_water_usage(id: str, request: Request):
    user = verify_auth(request)
    
    docs = list(db.collection("fields").document(id).collection("irrigationLogs").stream())
    if not docs:
        return []
        
    records = [{**d.to_dict()} for d in docs]
    df = pd.DataFrame(records)
    df['logged_at'] = pd.to_datetime(df['logged_at'])
    df = df.sort_values('logged_at')
    
    df['date'] = df['logged_at'].dt.date
    usage = df.groupby('date')['actual_amount_mm'].sum().reset_index()
    usage['date'] = usage['date'].astype(str)
    return usage.to_dict('records')

@app.get("/analytics/adherence")
def analytics_adherence(id: str, request: Request):
    user = verify_auth(request)
    
    docs = list(db.collection("fields").document(id).collection("irrigationLogs").stream())
    if not docs:
        return {"adherence_percent": 100.0}
        
    records = [{**d.to_dict()} for d in docs]
    df = pd.DataFrame(records)
    
    def adhered(row):
        if row['recommendation'] == 'irrigate' and row['action_taken'] == 'irrigated':
            return True
        if row['recommendation'] == 'wait' and row['action_taken'] == 'skipped':
            return True
        return False
        
    df['adhered'] = df.apply(adhered, axis=1)
    adherence_rate = df['adhered'].mean() * 100
    return {"adherence_percent": round(adherence_rate, 2)}

@app.get("/")
def health_check():
    return {"status": "ok", "service": "agrisense-backend"}
