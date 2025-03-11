from flask import Flask, render_template, jsonify, request
import secrets
import json
from pathlib import Path

app = Flask(__name__)

# Store API keys and their associated questions (in production, use a proper database)
API_KEYS = {}

def generate_api_key():
    return secrets.token_urlsafe(32)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate-key', methods=['POST'])
def create_api_key():
    api_key = generate_api_key()
    API_KEYS[api_key] = {
        'questions': [],
        'response_format': ''
    }
    return jsonify({'api_key': api_key})

@app.route('/api/save-questions', methods=['POST'])
def save_questions():
    data = request.json
    api_key = data.get('api_key')
    questions = data.get('questions', [])
    response_format = data.get('response_format', '')
    
    if api_key not in API_KEYS:
        return jsonify({'error': 'Invalid API key'}), 400
    
    API_KEYS[api_key]['questions'] = questions
    API_KEYS[api_key]['response_format'] = response_format
    return jsonify({'success': True})

@app.route('/api/get-questions', methods=['GET'])
def get_questions():
    api_key = request.args.get('api_key')
    if api_key not in API_KEYS:
        return jsonify({'error': 'Invalid API key'}), 400
    return jsonify(API_KEYS[api_key])

@app.route('/api/send-dm', methods=['POST'])
def send_dm():
    data = request.json
    api_key = data.get('api_key')
    user_id = data.get('user_id')
    
    if api_key not in API_KEYS:
        return jsonify({'error': 'Invalid API key'}), 400
    
    # Forward the request to the Discord bot server
    # In production, you would make an HTTP request to your Discord bot server
    questions = API_KEYS[api_key]['questions']
    response_format = API_KEYS[api_key]['response_format']
    
    # TODO: Add actual Discord bot integration
    return jsonify({
        'success': True,
        'message': f'Started DM sequence for user {user_id}'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000) 