import time
import json
import hashlib
import requests
from datetime import datetime

# =====================================================================
# META CAPI CRM INTEGRATION - ApniBus Channel Partner Acquisition
# =====================================================================
DATASET_ID = "1556087456022097"
TOKEN = "EAAEVcgxp1jUBSGYZCIR99o0yqvTO8QthvSVqspNHESqORIPQ4t3KLp2gl829gfisZCZAtlyoZCYXtPYC877CQuJsZB78ZCcqWY9KlQ1ZAwsiLcUGiDfl2kCcZCgGPDhCn7EucMtlOlmX4XZCfDRHVHZBUQcH1XvhjcTZBXN7MhM4dfNQp83FmvZAavnHubXdmh9uOhkW4wZDZD"
TEST_CODE = "TEST41530"

def hash_sha256(value: str) -> str:
    """Standard Meta SHA-256 Hashing"""
    if not value:
        return ""
    cleaned = str(value).strip().lower()
    return hashlib.sha256(cleaned.encode('utf-8')).hexdigest()

def normalize_phone(phone: str) -> str:
    """Format phone number (e.g. 9999999999 -> 919999999999)"""
    digits = ''.join(filter(str.isdigit, str(phone)))
    if len(digits) == 10:
        digits = "91" + digits
    return digits

def build_crm_lead_event(phone: str, email: str = "", lead_id: int = None, test_mode: bool = False):
    """Builds exact Meta CRM Lead Event matching Meta specifications"""
    timestamp = int(time.time())
    event_id = f"crm_lead_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    user_data = {
        "ph": [hash_sha256(normalize_phone(phone))]
    }
    
    if email:
        user_data["em"] = [hash_sha256(email)]
        
    if lead_id:
        user_data["lead_id"] = int(lead_id)

    event_obj = {
        "action_source": "system_generated",
        "event_name": "Lead",
        "event_time": timestamp,
        "event_id": event_id,
        "user_data": user_data,
        "custom_data": {
            "event_source": "crm",
            "lead_event_source": "ApniBus CRM"
        }
    }
    return event_obj

def send_crm_lead():
    print("=" * 60)
    print("🚀 Sending Meta CAPI CRM Lead Event...")
    print(f"Dataset ID : {DATASET_ID}")
    print("=" * 60)
    
    # Example event with phone, email, and optional Meta Instant Form lead_id
    ev = build_crm_lead_event(
        phone="9999999999",
        email="partner@apnibus.com",
        lead_id=1234567890123456
    )
    
    payload = {
        "data": [ev],
        "access_token": TOKEN
    }
    
    if TEST_CODE:
        payload["test_event_code"] = TEST_CODE

    url = f"https://graph.facebook.com/v20.0/{DATASET_ID}/events"
    
    try:
        r = requests.post(url, json=payload, timeout=20)
        print(f"HTTP Status: {r.status_code}\n")
        print("Meta Response JSON:")
        print(json.dumps(r.json(), indent=2))
        
        if r.status_code == 200 and r.json().get("events_received") == 1:
            print("\n✅ SUCCESS! Meta CRM Event registered.")
        else:
            print("\n❌ Meta Error Response.")
            
    except Exception as e:
        print(f"\n❌ Network error: {e}")

if __name__ == "__main__":
    send_crm_lead()
