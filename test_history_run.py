#!/usr/bin/env python
"""Test the /history endpoint"""
import requests
import json
import time

time.sleep(2)  # Wait for server to be ready

try:
    print("Testing /history endpoint...")
    response = requests.get('http://localhost:8000/history', timeout=10)
    response.raise_for_status()
    
    data = response.json()
    print("\n✓ Success! Response from /history:")
    print(json.dumps(data, indent=2))
    
except requests.exceptions.ConnectionError as e:
    print(f"✗ Connection Error: {e}")
    print("Make sure the backend server is running on port 8000")
except requests.exceptions.RequestException as e:
    print(f"✗ Request Error: {e}")
except json.JSONDecodeError as e:
    print(f"✗ JSON Parse Error: {e}")
except Exception as e:
    print(f"✗ Unexpected Error: {e}")
