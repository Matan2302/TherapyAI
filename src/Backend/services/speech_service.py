import os
import time
import requests
import json
from services.blob_service import upload_to_azure

# === Azure Speech Service Config ===
API_KEY = "C8ZklY5vrTLW9GtKYZ0sy6gyEkgufsz1EhdAVLBlwHOYTuCEgaQ3JQQJ99BDACYeBjFXJ3w3AAAYACOGge4q"
ENDPOINT = "https://eastus.api.cognitive.microsoft.com"
TRANSCRIPTION_NAME = "ConversationTranscription"
LOCALE = "he-IL"
POLL_INTERVAL = 15  # seconds

# === Parses the Azure transcription JSON to Speaker-labeled text ===
def parse_diarized_transcription(result_json: dict) -> str:
    diarized_lines = []

    recognized = result_json.get("recognizedPhrases", [])
    if not recognized:
        raise RuntimeError("No recognized phrases found in transcription.")

    for phrase in recognized:
        speaker = phrase.get("speaker")
        display = phrase.get("display")
        if display:
            line = f"Speaker {speaker}: {display}" if speaker is not None else display
            diarized_lines.append(line)

    if not diarized_lines:
        raise RuntimeError("No speaker-separated text found in transcription.")

    return "\n".join(diarized_lines)

# === Submits a transcription job, waits, parses, and uploads ===
def transcribe_and_upload(sas_url: str, base_filename: str) -> str:
    """
    Transcribes an audio file using Azure Speech API and uploads the plain text result
    (with speaker diarization) to the 'transcriptions/' folder in the Azure Blob container.

    Args:
        sas_url (str): A SAS URL pointing to the audio blob in Azure.
        base_filename (str): The base name (no extension) for saving the transcription file.

    Returns:
        str: Public URL of the uploaded transcription .txt file in Azure Blob.
    """
    headers = {
        "Ocp-Apim-Subscription-Key": API_KEY,
        "Content-Type": "application/json"
    }

    transcription_url = f"{ENDPOINT}/speechtotext/v3.0/transcriptions"

    body = {
        "displayName": TRANSCRIPTION_NAME,
        "description": "2-speaker transcription with diarization",
        "locale": LOCALE,
        "contentUrls": [sas_url],
        "properties": {
            "diarizationEnabled": True,
            "wordLevelTimestampsEnabled": True,
            "punctuationMode": "DictatedAndAutomatic",
            "profanityFilterMode": "Masked"
        }
    }

    print("[*] Submitting transcription job to Azure...")
    response = requests.post(transcription_url, headers=headers, json=body)
    response.raise_for_status()
    transcription_location = response.headers["Location"]
    print(f"[+] Transcription job created at: {transcription_location}")

    # === Poll for job completion ===
    while True:
        status_response = requests.get(transcription_location, headers=headers)
        status_data = status_response.json()
        status = status_data.get("status")
        print(f"    Status: {status}")
        if status in ("Succeeded", "Failed"):
            break
        time.sleep(POLL_INTERVAL)

    if status != "Succeeded":
        raise RuntimeError("Transcription job failed.")

    # === Get transcription file ===
    files_url = transcription_location + "/files"
    files_response = requests.get(files_url, headers=headers)
    files = files_response.json()["values"]

    transcript_url = None
    for f in files:
        if f["kind"] == "Transcription":
            transcript_url = f["links"]["contentUrl"]
            break

    if not transcript_url:
        raise RuntimeError("Transcription result file not found.")

    result = requests.get(transcript_url)
    result.raise_for_status()
    result_json = result.json()

    # === Parse speaker-separated transcript ===
    print("[*] Parsing diarized transcription result...")
    final_text = parse_diarized_transcription(result_json)

    # === Save locally ===
    os.makedirs("transcriptions", exist_ok=True)

    txt_filename = f"{base_filename}_transcription.txt"
    txt_path = os.path.join("transcriptions", txt_filename)

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(final_text)

    # (Optional) Save raw transcription JSON for reference/debug
    raw_json_path = os.path.join("transcriptions", f"{base_filename}_raw.json")
    with open(raw_json_path, "w", encoding="utf-8") as jf:
        json.dump(result_json, jf, indent=2, ensure_ascii=False)

    print(f"[+] Saved transcription to:\n- {txt_path}\n- {raw_json_path}")

    # === Upload to Azure Blob under 'transcriptions/' folder ===
    blob_path = f"transcriptions/{txt_filename}"
    uploaded_url = upload_to_azure(txt_path, blob_path)

    print(f"[+] Uploaded .txt file to Azure: {uploaded_url}")

    # === Cleanup local files ===
    os.remove(txt_path)
    os.remove(raw_json_path)

    return uploaded_url
