import wave
with wave.open(r"74f937eb_2_resampled.wav", "rb") as wav_file:
    print("Channels:", wav_file.getnchannels())
    print("Sample rate:", wav_file.getframerate())
    print("Sample width:", wav_file.getsampwidth())
