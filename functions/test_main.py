import pytest
from main import get_recommendation

def test_get_recommendation_above_threshold():
    rule = {"moisture_threshold_percent": 30.0, "water_requirement_mm_per_day": 10.0}
    result = get_recommendation(35.0, rule, 0, 0)
    assert result["recommendation"] == "wait"
    assert result["amount_mm"] == 0

def test_get_recommendation_below_threshold_no_rain():
    rule = {"moisture_threshold_percent": 40.0, "water_requirement_mm_per_day": 12.0}
    result = get_recommendation(20.0, rule, 10, 0)
    assert result["recommendation"] == "irrigate"
    # Deficit factor = (40 - 20) / 40 = 0.5
    # amount = 12 * (1 + 0.5) = 18.0
    assert result["amount_mm"] == 18.0

def test_get_recommendation_below_threshold_with_rain():
    rule = {"moisture_threshold_percent": 40.0, "water_requirement_mm_per_day": 12.0}
    result = get_recommendation(20.0, rule, 80, 10)
    # rain >= 60% and amount >= 12*0.7 (8.4) -> wait
    assert result["recommendation"] == "wait"
    assert result["amount_mm"] == 0
