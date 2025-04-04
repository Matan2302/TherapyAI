import requests
import time
import json

# === STEP 1: FILL THESE IN ===
API_KEY = "C8ZklY5vrTLW9GtKYZ0sy6gyEkgufsz1EhdAVLBlwHOYTuCEgaQ3JQQJ99BDACYeBjFXJ3w3AAAYACOGge4q"
ENDPOINT = "https://eastus.api.cognitive.microsoft.com"
SAS_AUDIO_URL = "https://therapygroup05.blob.core.windows.net/recordings/Eran_04-04-2025.wav?sp=r&st=2025-04-04T12:52:42Z&se=2025-04-04T20:52:42Z&spr=https&sv=2024-11-04&sr=b&sig=wrt2WqMhlxDVqknp19zRF3gUW2URymcec8YOz90%2BkQA%3D"
TRANSCRIPTION_NAME = "ConversationTranscription"
LOCALE = "he-IL"
POLL_INTERVAL = 15  # seconds

# === STEP 2: Headers ===   
headers = {
    "Ocp-Apim-Subscription-Key": API_KEY,
    "Content-Type": "application/json"
}

# === STEP 3: Create Transcription Job ===
transcription_url = f"{ENDPOINT}/speechtotext/v3.0/transcriptions"

body = {
    "displayName": TRANSCRIPTION_NAME,
    "description": "2-speaker transcription with diarization",
    "locale": LOCALE,
    "contentUrls": [SAS_AUDIO_URL],
    "properties": {
        "diarizationEnabled": True,  # Enable speaker separation
        "wordLevelTimestampsEnabled": True,
        "punctuationMode": "DictatedAndAutomatic",
        "profanityFilterMode": "Masked"
    }
}

print("[*] Submitting transcription job...")
response = requests.post(transcription_url, headers=headers, json=body)
response.raise_for_status()

transcription_location = response.headers["Location"]
print(f"[+] Transcription job created: {transcription_location}")

# === STEP 4: Poll Until Complete ===
print("[*] Polling for transcription status...")
while True:
    status_response = requests.get(transcription_location, headers=headers)
    status = status_response.json()['status']
    print(f"    Status: {status}")

    if status in ("Succeeded", "Failed"):
        break
    time.sleep(POLL_INTERVAL)

# === STEP 5: Fetch and Save Transcription File ===
if status == "Succeeded":
    print("[+] Transcription succeeded. Downloading result...")
    files_url = transcription_location + "/files"
    files_response = requests.get(files_url, headers=headers)
    files = files_response.json()["values"]

    for f in files:
        if f["kind"] == "Transcription":
            result_url = f["links"]["contentUrl"]
            result = requests.get(result_url)
            with open("transcription_result.json", "w", encoding="utf-8") as out_file:
                json.dump(result.json(), out_file, indent=2)
            print("[+] Transcription saved to 'transcription_result.json'")
else:
    print("[-] Transcription failed.")
