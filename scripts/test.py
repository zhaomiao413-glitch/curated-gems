import requests, os
headers = {
    "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
    "Content-Type": "application/json"
}
data = {
    "model": "openai/gpt-3.5-turbo-0613",
    "messages": [{"role": "user", "content": "Hello"}]
}
r = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
print(r.status_code, r.text)
