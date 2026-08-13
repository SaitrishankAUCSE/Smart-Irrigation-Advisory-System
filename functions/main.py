import os
from firebase_admin import initialize_app, firestore, auth
from firebase_functions import https_fn, identity_fn
from firebase_functions.options import CorsOptions

# Initialize Firebase Admin
initialize_app()
db = firestore.client()

cors = CorsOptions(cors_origins=["*"], cors_methods=["get", "post", "put", "delete"])

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

@identity_fn.before_user_created()
def set_custom_claims(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeCreateResponse | None:
    # Default to farmer
    return identity_fn.BeforeCreateResponse(custom_claims={"role": "farmer"})

def verify_auth(req: https_fn.Request) -> dict:
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise ValueError("Unauthorized")
    token = auth_header.split("Bearer ")[1]
    decoded = auth.verify_id_token(token)
    return decoded

# Removed admin_crop_stage_rules, fields, field_detail, moisture endpoints (now handled directly via Firestore SDK)

@https_fn.on_request(cors=cors)
def weather(req: https_fn.Request) -> https_fn.Response:
    # A mock implementation or real call could go here
    try:
        user = verify_auth(req)
        field_id = req.args.get("id")
        
        if req.method == "GET":
            # Just return a mock weather data for the sake of demo if no external API key
            docs = db.collection("weather_data").where("field_id", "==", field_id).order_by("fetched_at", direction=firestore.Query.DESCENDING).limit(1).stream()
            result = [{**doc.to_dict(), "id": doc.id} for doc in docs]
            if result:
                return https_fn.Response(json=result[0])
            else:
                return https_fn.Response(json={"rain_probability_percent": 20, "expected_rainfall_mm": 0, "temperature_c": 30, "source": "mock"})
                
        elif req.method == "POST":
            data = req.get_json()
            data["field_id"] = field_id
            data["fetched_at"] = firestore.SERVER_TIMESTAMP
            _, ref = db.collection("weather_data").add(data)
            return https_fn.Response(json={"id": ref.id, **data})
            
    except ValueError:
        return https_fn.Response("Unauthorized", status=401)
    except Exception as e:
        return https_fn.Response(str(e), status=500)

@https_fn.on_request(cors=cors)
def recommendation(req: https_fn.Request) -> https_fn.Response:
    try:
        user = verify_auth(req)
        field_id = req.args.get("id")
        if not field_id:
            return https_fn.Response("Missing field id", status=400)
            
        field_doc = db.collection("fields").document(field_id).get()
        if not field_doc.exists:
            return https_fn.Response("Field not found", status=404)
            
        field_data = field_doc.to_dict()
        
        # Get latest moisture
        moisture_docs = list(db.collection("fields").document(field_id).collection("moistureReadings").order_by("created_at", direction=firestore.Query.DESCENDING).limit(1).stream())
        if not moisture_docs:
            return https_fn.Response("No moisture readings found", status=400)
        moisture_percent = moisture_docs[0].to_dict().get("moisture_percent", 0.0)
        
        # Get latest weather
        weather_docs = list(db.collection("weather_data").where("field_id", "==", field_id).order_by("fetched_at", direction=firestore.Query.DESCENDING).limit(1).stream())
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
            return https_fn.Response(f"No rule found for {crop_type} - {stage}", status=400)
        rule_data = rules[0].to_dict()
        
        rec = get_recommendation(moisture_percent, rule_data, rain_prob, exp_rain)
        return https_fn.Response(json=rec)
        
    except ValueError:
        return https_fn.Response("Unauthorized", status=401)
    except Exception as e:
        return https_fn.Response(str(e), status=500)

# Removed irrigation_log endpoint (now handled directly via Firestore SDK)

import pandas as pd

@https_fn.on_request(cors=cors)
def analytics(req: https_fn.Request) -> https_fn.Response:
    try:
        user = verify_auth(req)
        field_id = req.args.get("id")
        if not field_id:
            return https_fn.Response("Missing field id", status=400)
            
        path = req.path
        
        docs = list(db.collection("fields").document(field_id).collection("irrigationLogs").stream())
        if not docs:
            return https_fn.Response(json={"data": []})
            
        records = [{**d.to_dict()} for d in docs]
        df = pd.DataFrame(records)
        df['logged_at'] = pd.to_datetime(df['logged_at'])
        df = df.sort_values('logged_at')
        
        if "water-usage" in path:
            df['date'] = df['logged_at'].dt.date
            usage = df.groupby('date')['actual_amount_mm'].sum().reset_index()
            usage['date'] = usage['date'].astype(str)
            return https_fn.Response(json=usage.to_dict('records'))
            
        elif "adherence" in path:
            def adhered(row):
                if row['recommendation'] == 'irrigate' and row['action_taken'] == 'irrigated':
                    return True
                if row['recommendation'] == 'wait' and row['action_taken'] == 'skipped':
                    return True
                return False
            df['adhered'] = df.apply(adhered, axis=1)
            adherence_rate = df['adhered'].mean() * 100
            return https_fn.Response(json={"adherence_percent": round(adherence_rate, 2)})
            
        return https_fn.Response("Invalid analytics path", status=400)
        
    except ValueError:
        return https_fn.Response("Unauthorized", status=401)
    except Exception as e:
        return https_fn.Response(str(e), status=500)
