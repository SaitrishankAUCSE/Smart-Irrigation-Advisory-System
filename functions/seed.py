import os
from firebase_admin import credentials, initialize_app, firestore, auth

# Make sure you have your Firebase Service Account JSON key
# Export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
# Or run with Firebase emulators active: export FIRESTORE_EMULATOR_HOST="localhost:8080"
try:
    initialize_app()
except ValueError:
    pass # Already initialized

db = firestore.client()

def seed_database():
    print("Seeding crop stage rules...")
    rules = [
        {
            "crop_type": "Rice",
            "growth_stage": "Vegetative",
            "water_requirement_mm_per_day": 8.0,
            "moisture_threshold_percent": 60.0
        },
        {
            "crop_type": "Rice",
            "growth_stage": "Flowering",
            "water_requirement_mm_per_day": 10.0,
            "moisture_threshold_percent": 70.0
        },
        {
            "crop_type": "Maize",
            "growth_stage": "Vegetative",
            "water_requirement_mm_per_day": 6.0,
            "moisture_threshold_percent": 50.0
        },
        {
            "crop_type": "Chili",
            "growth_stage": "Flowering",
            "water_requirement_mm_per_day": 5.0,
            "moisture_threshold_percent": 45.0
        }
    ]
    
    for rule in rules:
        db.collection("crop_stage_rules").add(rule)
        
    print("Creating demo farmer account...")
    try:
        user = auth.create_user(
            email='demo.farmer@example.com',
            password='password123',
            display_name='Demo Farmer'
        )
        auth.set_custom_user_claims(user.uid, {'role': 'farmer'})
        farmer_id = user.uid
        print(f"Created demo farmer (uid: {farmer_id})")
    except Exception as e:
        print(f"Farmer already exists or error: {e}")
        try:
            user = auth.get_user_by_email('demo.farmer@example.com')
            farmer_id = user.uid
        except Exception:
            print("Could not retrieve farmer.")
            return

    print("Creating a sample field...")
    _, field_ref = db.collection("fields").add({
        "user_id": farmer_id,
        "name": "North Plot",
        "crop_type": "Rice",
        "area_acres": 2.5,
        "current_growth_stage": "Vegetative",
        "created_at": firestore.SERVER_TIMESTAMP
    })
    
    print("Creating sample moisture readings...")
    db.collection("moisture_readings").add({
        "field_id": field_ref.id,
        "moisture_percent": 40.0,
        "source": "manual",
        "created_at": firestore.SERVER_TIMESTAMP
    })

    print("Seeding complete!")

if __name__ == "__main__":
    seed_database()
