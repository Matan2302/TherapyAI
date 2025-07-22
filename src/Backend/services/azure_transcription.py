# services/azure_transcription.py
from __future__ import annotations

import os
import time
import uuid
from datetime import timedelta
from typing import List, Tuple

import requests
# 
# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
def _parse_iso_dur(pt: str) -> timedelta:
    """'PT4.87S' ⇒ timedelta."""
    if not pt.startswith("PT"):
        raise ValueError(f"Bad ISO-8601 duration: {pt!r}")
    pt = pt[2:]
    h = m = s = 0.0
    num = ""
    for ch in pt:
        if ch.isdigit() or ch == ".":
            num += ch
        else:
            if not num:
                continue
            val = float(num)
            if ch == "H":
                h = val
            elif ch == "M":
                m = val
            elif ch == "S":
                s = val
            num = ""
    return timedelta(seconds=h * 3600 + m * 60 + s)


def _td_to_str(td: timedelta) -> str:
    """timedelta → 'HH:MM:SS.mmm' string."""
    ms_tot = int(round(td.total_seconds() * 1000))
    h, rem = divmod(ms_tot, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1_000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────
def transcribe_dialog(
    sas_url: str,
    locale: str = "he-IL",
    poll_interval: int = 10,
) -> Tuple[List[str], str]:
    print("🔹 Starting transcription process...")

    key = os.getenv("AZURE_SPEECH_KEY")
    endpoint = os.getenv("AZURE_SPEECH_ENDPOINT")
    if not (key and endpoint):
        print("❌ Missing AZURE_SPEECH_KEY or AZURE_SPEECH_ENDPOINT environment variables.")
        raise RuntimeError("AZURE_SPEECH_KEY / AZURE_SPEECH_ENDPOINT env-vars missing")

    print(f"✅ Environment variables loaded. Endpoint: {endpoint}")

    # 1.  Kick off the job ------------------------------------------------------
    print("📤 Submitting transcription job to Azure Speech service...")
    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/json",
    }
    body = {
        "displayName": f"chat-{uuid.uuid4()}",
        "description": "API transcription with diarization",
        "locale": locale,
        "contentUrls": [sas_url],
        "properties": {
            "diarizationEnabled": True,
            "punctuationMode": "DictatedAndAutomatic",
        },
    }
    try:
        resp = requests.post(f"{endpoint}/speechtotext/v3.0/transcriptions",
                             headers=headers, json=body)
        print(f"✅ Transcription job submitted. Status code: {resp.status_code}")
        resp.raise_for_status()
    except Exception as e:
        print(f"❌ Error submitting transcription job: {e}")
        raise

    with open("transcription_post_response.json", "w", encoding="utf-8") as f:
        f.write(str(resp.headers))

    job_url = resp.headers.get("Location")
    if not job_url:
        print("❌ No 'Location' header found in response.")
        raise RuntimeError("No job URL returned from Azure.")

    print(f"🔗 Job URL: {job_url}")

    # 2.  Poll until done -------------------------------------------------------
    print("🕒 Polling for transcription job status...")
    while True:
        try:
            job = requests.get(job_url, headers=headers).json()
            status = job.get("status")
            print(f"⏳ Current status: {status}")
            if status in {"Succeeded", "Failed"}:
                break
            time.sleep(poll_interval)
        except Exception as e:
            print(f"❌ Error while polling job status: {e}")
            raise

    print("✅ Done polling.")
    if status != "Succeeded":
        print(f"❌ Transcription job failed with status: {status}")
        raise RuntimeError(f"Azure Speech job failed: {job}")

    # 3.  Grab the JSON result file --------------------------------------------
    print("📥 Retrieving transcription result file...")
    try:
        files_url = job_url + "/files"
        files = requests.get(files_url, headers=headers).json()["values"]
        tr_json_url = next(f["links"]["contentUrl"]
                           for f in files if f["kind"] == "Transcription")
        result_json = requests.get(tr_json_url).json()
    except Exception as e:
        print(f"❌ Error retrieving result JSON: {e}")
        raise

    print("✅ Transcription result JSON retrieved.")

    # 4.  Build nice “HH:MM:SS — Speaker n: text” lines -------------------------
    print("📝 Formatting dialog lines...")
    dialog = []
    try:
        for ph in result_json["recognizedPhrases"]:
            ts = _td_to_str(_parse_iso_dur(ph["offset"]))
            spk = ph.get("speaker", "Unknown")
            txt = ph["nBest"][0]["display"].strip()
            dialog.append((ts, spk, txt))
    except Exception as e:
        print(f"❌ Error processing recognized phrases: {e}")
        raise

    dialog.sort(key=lambda t: t[0])
    lines = [f"{ts}  Speaker {spk}:  {txt}" for ts, spk, txt in dialog]
    print("✅ Dialog lines formatted.")

    # 5.  Save to Blob as <wav>.txt --------------------------------------------
    print("📤 Uploading transcript to Azure Blob Storage...")
    try:
        from pathlib import PurePosixPath
        from services.blob_service import upload_transcript_to_azure

        wav_name = PurePosixPath(sas_url.split("?")[0]).name     # strip SAS query
        transcript_url = upload_transcript_to_azure(lines, wav_name)
    except Exception as e:
        print(f"❌ Error uploading transcript to blob: {e}")
        raise

    print(f"✅ Transcript uploaded. URL: {transcript_url}")

    return lines, transcript_url
