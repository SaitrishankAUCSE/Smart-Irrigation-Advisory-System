import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AgriSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded rules since we are removing Firebase dependency for bulletproof demo
CROP_RULES = {
    "Rice": {
        "Vegetative": {"moisture_threshold_percent": 60, "water_requirement_mm_per_day": 8.0},
        "Flowering": {"moisture_threshold_percent": 70, "water_requirement_mm_per_day": 10.0},
        "Maturity": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 5.0}
    },
    "Maize": {
        "Vegetative": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 6.0},
        "Flowering": {"moisture_threshold_percent": 60, "water_requirement_mm_per_day": 8.0},
        "Maturity": {"moisture_threshold_percent": 40, "water_requirement_mm_per_day": 4.0}
    },
    "Chili": {
        "Vegetative": {"moisture_threshold_percent": 45, "water_requirement_mm_per_day": 5.0},
        "Flowering": {"moisture_threshold_percent": 55, "water_requirement_mm_per_day": 7.0},
        "Maturity": {"moisture_threshold_percent": 40, "water_requirement_mm_per_day": 3.5}
    }
}

class RecommendationRequest(BaseModel):
    moisture_percent: float
    crop_type: str
    stage: str
    rain_probability_percent: float
    expected_rainfall_mm: float

def get_recommendation(moisture_percent: float, rule: dict, rain_probability_percent: float, expected_rainfall_mm: float) -> dict:
    threshold = rule.get("moisture_threshold_percent", 0.0)
    daily_need = rule.get("water_requirement_mm_per_day", 0.0)

    if moisture_percent >= threshold:
        return { "recommendation": "wait", "amount_mm": 0, "reason": "Soil moisture is above threshold for this growth stage." }

    if rain_probability_percent >= 60 and expected_rainfall_mm >= daily_need * 0.7:
        return { "recommendation": "wait", "amount_mm": 0, "reason": "High rain probability expected to cover most of the water need." }

    deficit_factor = (threshold - moisture_percent) / threshold
    recommended_amount = round(daily_need * (1 + deficit_factor), 1)

    return { "recommendation": "irrigate", "amount_mm": recommended_amount, "reason": f"Soil moisture {moisture_percent}% is below the {threshold}% threshold for this stage." }

@app.get("/api/weather")
def get_weather(id: str):
    # Mock weather for demo
    return {"rain_probability_percent": 20, "expected_rainfall_mm": 0, "temperature_c": 30, "source": "mock"}

@app.post("/api/recommendation")
def recommendation(req: RecommendationRequest):
    rule = CROP_RULES.get(req.crop_type, {}).get(req.stage)
    if not rule:
        # Fallback rule if not found
        rule = {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 5.0}
        
    return get_recommendation(req.moisture_percent, rule, req.rain_probability_percent, req.expected_rainfall_mm)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "agrisense-vercel-api"}
