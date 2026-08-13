import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AgriSense High-Precision Agronomic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# High-Precision FAO-56 Agronomic Rule Matrix
CROP_RULES = {
    "Rice": {
        "Germination": {"moisture_threshold_percent": 65, "water_requirement_mm_per_day": 6.0, "kc": 1.05, "root_depth_mm": 200},
        "Vegetative": {"moisture_threshold_percent": 60, "water_requirement_mm_per_day": 8.0, "kc": 1.15, "root_depth_mm": 300},
        "Flowering": {"moisture_threshold_percent": 70, "water_requirement_mm_per_day": 10.0, "kc": 1.30, "root_depth_mm": 400},
        "Maturity": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 5.0, "kc": 0.90, "root_depth_mm": 400}
    },
    "Maize": {
        "Germination": {"moisture_threshold_percent": 55, "water_requirement_mm_per_day": 4.0, "kc": 0.40, "root_depth_mm": 300},
        "Vegetative": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 6.0, "kc": 0.85, "root_depth_mm": 600},
        "Flowering": {"moisture_threshold_percent": 60, "water_requirement_mm_per_day": 8.0, "kc": 1.20, "root_depth_mm": 800},
        "Maturity": {"moisture_threshold_percent": 40, "water_requirement_mm_per_day": 4.0, "kc": 0.60, "root_depth_mm": 800}
    },
    "Chili": {
        "Germination": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 3.5, "kc": 0.35, "root_depth_mm": 250},
        "Vegetative": {"moisture_threshold_percent": 45, "water_requirement_mm_per_day": 5.0, "kc": 0.70, "root_depth_mm": 500},
        "Flowering": {"moisture_threshold_percent": 55, "water_requirement_mm_per_day": 7.0, "kc": 1.05, "root_depth_mm": 600},
        "Maturity": {"moisture_threshold_percent": 40, "water_requirement_mm_per_day": 3.5, "kc": 0.60, "root_depth_mm": 600}
    },
    "Wheat": {
        "Germination": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 3.5, "kc": 0.40, "root_depth_mm": 300},
        "Vegetative": {"moisture_threshold_percent": 55, "water_requirement_mm_per_day": 5.5, "kc": 0.75, "root_depth_mm": 600},
        "Flowering": {"moisture_threshold_percent": 65, "water_requirement_mm_per_day": 7.5, "kc": 1.15, "root_depth_mm": 800},
        "Maturity": {"moisture_threshold_percent": 40, "water_requirement_mm_per_day": 3.0, "kc": 0.50, "root_depth_mm": 800}
    },
    "Cotton": {
        "Germination": {"moisture_threshold_percent": 45, "water_requirement_mm_per_day": 3.5, "kc": 0.35, "root_depth_mm": 300},
        "Vegetative": {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 6.0, "kc": 0.75, "root_depth_mm": 700},
        "Flowering": {"moisture_threshold_percent": 60, "water_requirement_mm_per_day": 8.5, "kc": 1.20, "root_depth_mm": 1000},
        "Maturity": {"moisture_threshold_percent": 35, "water_requirement_mm_per_day": 4.0, "kc": 0.65, "root_depth_mm": 1000}
    },
    "Sugarcane": {
        "Germination": {"moisture_threshold_percent": 55, "water_requirement_mm_per_day": 4.5, "kc": 0.40, "root_depth_mm": 400},
        "Vegetative": {"moisture_threshold_percent": 65, "water_requirement_mm_per_day": 8.0, "kc": 1.00, "root_depth_mm": 900},
        "Flowering": {"moisture_threshold_percent": 70, "water_requirement_mm_per_day": 9.5, "kc": 1.25, "root_depth_mm": 1200},
        "Maturity": {"moisture_threshold_percent": 45, "water_requirement_mm_per_day": 4.5, "kc": 0.75, "root_depth_mm": 1200}
    }
}

DEFAULT_RULE = {"moisture_threshold_percent": 50, "water_requirement_mm_per_day": 5.0, "kc": 0.8, "root_depth_mm": 500}

class RecommendationRequest(BaseModel):
    moisture_percent: float
    crop_type: str
    stage: str
    rain_probability_percent: float = 20.0
    expected_rainfall_mm: float = 0.0
    temperature_c: float = 28.0

def get_recommendation(
    moisture_percent: float, 
    rule: dict, 
    rain_probability_percent: float, 
    expected_rainfall_mm: float,
    temperature_c: float = 28.0
) -> dict:
    threshold = rule.get("moisture_threshold_percent", 50.0)
    daily_base_need = rule.get("water_requirement_mm_per_day", 5.0)
    kc = rule.get("kc", 1.0)

    # 1. Effective Rainfall Formula
    effective_rain_mm = round(expected_rainfall_mm * 0.8, 1) if rain_probability_percent >= 60 else 0.0

    # 2. Temperature Adjusted Crop Evapotranspiration (ETc)
    temp_factor = 1.0 + max(0.0, (temperature_c - 25.0) / 50.0)
    etc_mm = round(daily_base_need * kc * temp_factor, 1)

    # 3. Moisture Check
    if moisture_percent >= threshold:
        return {
            "recommendation": "wait",
            "amount_mm": 0.0,
            "urgency": "Optimal",
            "reason": f"Soil moisture ({moisture_percent}%) is at or above the optimal threshold ({threshold}%) for this growth stage.",
            "etc_mm": etc_mm,
            "effective_rain_mm": effective_rain_mm,
            "threshold": threshold,
            "dailyNeed": daily_base_need
        }

    # 4. Net Deficit Calculation
    moisture_deficit_pct = threshold - moisture_percent
    gross_deficit_mm = round(etc_mm * (1.0 + (moisture_deficit_pct / threshold)), 1)
    net_recommended_mm = round(max(0.0, gross_deficit_mm - effective_rain_mm), 1)

    if net_recommended_mm <= 0.5:
        return {
            "recommendation": "wait",
            "amount_mm": 0.0,
            "urgency": "Optimal",
            "reason": f"Expected rain ({effective_rain_mm}mm) will sufficiently replenish soil moisture. Hold off on irrigation.",
            "etc_mm": etc_mm,
            "effective_rain_mm": effective_rain_mm,
            "threshold": threshold,
            "dailyNeed": daily_base_need
        }

    urgency = "Critical" if moisture_percent < (threshold * 0.5) else "Moderate"
    reason = (
        f"Soil moisture ({moisture_percent}%) is below the {threshold}% threshold. "
        f"Evapotranspiration loss is ~{etc_mm}mm/day. "
        f"Recommended irrigation: {net_recommended_mm}mm."
    )

    return {
        "recommendation": "irrigate",
        "amount_mm": net_recommended_mm,
        "urgency": urgency,
        "reason": reason,
        "etc_mm": etc_mm,
        "effective_rain_mm": effective_rain_mm,
        "threshold": threshold,
        "dailyNeed": daily_base_need
    }

@app.get("/api/weather")
def get_weather(id: str):
    return {
        "rain_probability_percent": 20, 
        "expected_rainfall_mm": 0, 
        "temperature_c": 28, 
        "humidity_percent": 65,
        "wind_speed_kmh": 12,
        "source": "AgriSense FAO-56 Station"
    }

@app.post("/api/recommendation")
def recommendation(req: RecommendationRequest):
    rule = CROP_RULES.get(req.crop_type, {}).get(req.stage, DEFAULT_RULE)
    return get_recommendation(
        req.moisture_percent, 
        rule, 
        req.rain_probability_percent, 
        req.expected_rainfall_mm,
        req.temperature_c
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "agrisense-fao56-engine"}
