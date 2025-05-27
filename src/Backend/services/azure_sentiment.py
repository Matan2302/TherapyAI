import os
import re
import json
import requests
import tempfile
from dotenv import load_dotenv
from services.blob_service import download_blob_to_tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

# === ENV ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AZURE_API_KEY = os.getenv("AZURE_LANGUAGE_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_LANGUAGE_ENDPOINT")

if not all([GEMINI_API_KEY, AZURE_API_KEY, AZURE_ENDPOINT]):
    raise RuntimeError("Missing one or more required environment variables for sentiment analysis.")


# === Public entry point ===
def analyze_sentiment_from_blob(blob_url: str) -> dict:
    tmp_path = download_blob_to_tempfile(blob_url)

    try:
        result_json_str = analyze_conversation(tmp_path)
        return json.loads(result_json_str)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# === Core pipeline ===
def analyze_conversation(file_path: str) -> str:
    cleaned_text = load_and_clean_text(file_path)
    short_text = cleaned_text[:4000]

    # Concurrent: Gemini Language, Speaker, Summary
    with ThreadPoolExecutor(max_workers=3) as executor:
        f_lang = executor.submit(detect_language, short_text)
        f_speaker = executor.submit(detect_speaker, short_text)
        f_summary = executor.submit(summarize_conversation, cleaned_text)

        lang = f_lang.result()
        speaker = f_speaker.result()
        summary = f_summary.result()

    stats = get_sentiment_statistics(cleaned_text, lang, speaker)
    top_sentences = get_top_sentences(stats['positive_scores'], stats['negative_scores'])

    result = {
        'total_positive': stats['total_positive'],
        'total_negative': stats['total_negative'],
        'top_5_positive': [top_sentences.get(f'positive_{i}', '') for i in range(1, 6)],
        'top_5_negative': [top_sentences.get(f'negative_{i}', '') for i in range(1, 6)],
        'summary': summary
    }

    return json.dumps(result, ensure_ascii=False, indent=2)


# === Text cleaning ===
def load_and_clean_text(file_path: str) -> str:
    with open(file_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    text_no_timestamps = re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3}', '', raw_text)
    text_with_breaks = re.sub(r'\s*(Speaker \d+:)', r'\n\1', text_no_timestamps)
    space_normalized_text = re.sub(r'[ \t]+', ' ', text_with_breaks)
    final_cleaned_text = re.sub(r'\n+', '\n', space_normalized_text).strip()
    return final_cleaned_text


def split_speaker_turns(text: str):
    return re.findall(r'(Speaker \d+: .*?)(?=Speaker \d+:|$)', text, flags=re.DOTALL)


# === Gemini prompts ===
def gemini_prompt(prompt: str) -> str:
    response = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        headers={"Content-Type": "application/json"},
        params={"key": GEMINI_API_KEY},
        json={"contents": [{"parts": [{"text": prompt}]}]}
    )
    response.raise_for_status()
    return response.json()['candidates'][0]['content']['parts'][0]['text']


def detect_language(text: str) -> str:
    prompt = f"Detect the language of the following conversation:\n\n{text}"
    response = gemini_prompt(prompt).lower()
    if "hebrew" in response:
        return "he"
    elif "arabic" in response:
        return "ar"
    elif "russian" in response:
        return "ru"
    return "en"


def detect_speaker(text: str) -> str:
    prompt = (
        "In the following therapy conversation transcript, identify which 'Speaker X' is primarily asking the questions "
        "and which is primarily giving the answers. Respond ONLY with the speaker number of the person who gives most of the answers.\n\n"
        + text
    )
    response = gemini_prompt(prompt)
    match = re.search(r'(\d)', response)
    return f"Speaker {match.group(1)}:" if match else None


def summarize_conversation(full_text: str) -> str:
    prompt = (
        "Summarize this therapy conversation. Focus on emotional tone, key discussion points, "
        "and the psychological state of the speakers. Return the summary in the same language. Limit to 10 sentences.\n\n"
        + full_text
    )
    return gemini_prompt(prompt)


# === Azure NLP ===
def analyze_sentence_azure(text: str, lang: str):
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "kind": "SentimentAnalysis",
        "parameters": {"loggingOptOut": False},
        "analysisInput": {
            "documents": [{
                "id": "1",
                "language": lang,
                "text": text
            }]
        }
    }
    response = requests.post(AZURE_ENDPOINT, headers=headers, json=payload)
    if response.status_code == 200:
        result = response.json()
        scores = result["results"]["documents"][0]["confidenceScores"]
        max_label = max(scores, key=scores.get)
        return max_label, scores[max_label]
    return None, 0.0


# === Sentiment statistics (multi-threaded) ===
def get_sentiment_statistics(text: str, lang: str, speaker: str) -> dict:
    sentences = split_speaker_turns(text)

    filtered = []
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence.startswith(speaker):
            content = sentence[len(speaker):].strip()
            if len(content.split()) > 1:
                filtered.append(content)

    total_positive = 0
    total_negative = 0
    positive_scores = {}
    negative_scores = {}

    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_sentence = {
            executor.submit(analyze_sentence_azure, s, lang): s for s in filtered
        }

        for future in as_completed(future_to_sentence):
            sentence = future_to_sentence[future]
            try:
                label, score = future.result()
                if label == "positive":
                    total_positive += 1
                    positive_scores[sentence] = score
                elif label == "negative":
                    total_negative += 1
                    negative_scores[sentence] = score
            except Exception as e:
                print(f"[ERROR] Failed to analyze: {sentence[:50]}... | {e}")

    return {
        'total_positive': total_positive,
        'total_negative': total_negative,
        'positive_scores': positive_scores,
        'negative_scores': negative_scores
    }


# === Utility ===
def get_top_sentences(pos_scores: dict, neg_scores: dict) -> dict:
    top_pos = sorted(pos_scores.items(), key=lambda x: x[1], reverse=True)[:5]
    top_neg = sorted(neg_scores.items(), key=lambda x: x[1], reverse=True)[:5]
    result = {}
    for i, (s, _) in enumerate(top_pos, 1):
        result[f'positive_{i}'] = s
    for i, (s, _) in enumerate(top_neg, 1):
        result[f'negative_{i}'] = s
    return result
