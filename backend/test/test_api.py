
import requests

URL = "http://127.0.0.1:5000/predict"

# Test 1: Missing heartbeat data
response = requests.post(URL, json={})
print("Test 1 - Missing data:", response.status_code, response.json())

# Test 2: Heartbeat with fewer than 200 values
response = requests.post(URL, json={"beat": [0.5] * 100})
print("Test 2 - Short heartbeat:", response.status_code, response.json())

# Test 3: Heartbeat containing exactly 200 values
response = requests.post(URL, json={"beat": [0.5] * 200})
print("Test 3 - Valid length:", response.status_code, response.json())
