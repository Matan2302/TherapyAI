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
    """
    • Creates an Azure Speech batch-transcription job on `sas_url`
    • Waits until it completes
    • Builds a diarised text transcript
    • Saves the transcript to the *same* Blob container as <wav>.txt
    • Returns: (list_of_dialog_lines, https_url_of_txt_blob)
    """
    key = os.getenv("AZURE_SPEECH_KEY")
    endpoint = os.getenv("AZURE_SPEECH_ENDPOINT")
    if not (key and endpoint):
        raise RuntimeError("AZURE_SPEECH_KEY / AZURE_SPEECH_ENDPOINT env-vars missing")
    print("Inside transcribe_dialog function...") 
    # 1.  Kick off the job ------------------------------------------------------
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
    resp = requests.post(f"{endpoint}/speechtotext/v3.0/transcriptions",
                         headers=headers, json=body)
    print(resp)
    resp.raise_for_status()
    with open("transcription_post_response.json", "w", encoding="utf-8") as f:
        f.write(resp.headers)
    job_url = resp.headers["Location"]

    # 2.  Poll until done -------------------------------------------------------
    while True:
        job = requests.get(job_url, headers=headers).json()
        status = job["status"]
        print(f"Status is: {status}")
        if status in {"Succeeded", "Failed"}:
            break
        time.sleep(poll_interval)

    print("done with while loop")
    if status != "Succeeded":
        raise RuntimeError(f"Azure Speech job failed: {job}")

    # 3.  Grab the JSON result file --------------------------------------------
    files_url = job_url + "/files"
    files = requests.get(files_url, headers=headers).json()["values"]
    tr_json_url = next(f["links"]["contentUrl"]
                       for f in files if f["kind"] == "Transcription")
    result_json = requests.get(tr_json_url).json()

    # 4.  Build nice “HH:MM:SS — Speaker n: text” lines -------------------------
    dialog = []
    for ph in result_json["recognizedPhrases"]:
        ts  = _td_to_str(_parse_iso_dur(ph["offset"]))
        spk = ph.get("speaker", "Unknown")
        txt = ph["nBest"][0]["display"].strip()
        dialog.append((ts, spk, txt))

    dialog.sort(key=lambda t: t[0])
    lines = [f"{ts}  Speaker {spk}:  {txt}" for ts, spk, txt in dialog]

    # 5.  Save to Blob as <wav>.txt --------------------------------------------
    from pathlib import PurePosixPath
    from services.blob_service import upload_transcript_to_azure

    wav_name = PurePosixPath(sas_url.split("?")[0]).name     # strip SAS query
    transcript_url = upload_transcript_to_azure(lines, wav_name)

    return lines, transcript_url
