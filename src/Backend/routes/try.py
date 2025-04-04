import requests

res = requests.post(
    "http://localhost:8000/auth/login",
    json={"email": "omer.cohen98@gmail.com", "password": "111"}
)
print(res.status_code)
print(res.json())
