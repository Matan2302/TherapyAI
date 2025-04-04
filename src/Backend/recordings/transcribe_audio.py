

from faster_whisper import WhisperModel


# === הגדר את הנתיב לקובץ האודיו שלך כאן ===
audio_path = r"C:\Users\matan\try1.aac"

# טוען את המודל של ivrit.ai
print("🔄 טוען את המודל...")
model = WhisperModel("ivrit-ai/whisper-large-v3-turbo-ct2")

# מבצע תמלול לקובץ
print(f"🎧 מתמלל את הקובץ: {audio_path}")
segments, _ = model.transcribe(audio_path, language="he")

# מאחד את הקטעים
texts = [s.text for s in segments]
transcribed_text = " ".join(texts)

# מדפיס את התוצאה
print("\n📄 טקסט מתומלל:")
print(transcribed_text)
