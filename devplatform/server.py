from flask import Flask, send_from_directory, jsonify, request, render_template
import secrets
import json
from pathlib import Path
from datetime import datetime

app = Flask(__name__)

# Store active surveys and API keys
active_surveys = {}
api_keys = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/generate-key', methods=['POST'])
def generate_key():
    api_key = secrets.token_urlsafe(32)
    api_keys[api_key] = {
        'created_at': datetime.now().isoformat(),
        'questions': []
    }
    return jsonify({'api_key': api_key})

@app.route('/api/save-questions', methods=['POST'])
def save_questions():
    data = request.json
    api_key = data.get('api_key')
    questions = data.get('questions', [])
    
    if not api_key or api_key not in api_keys:
        return jsonify({'error': 'Invalid API key'}), 401
        
    api_keys[api_key]['questions'] = questions
    return jsonify({'success': True})

@app.route('/api/dm', methods=['POST'])
def handle_dm():
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message')
    is_start = data.get('isStart')
    questions = data.get('questions', [])
    
    if is_start:
        # Store the questions for this user's survey
        active_surveys[user_id] = {
            'current_question': 0,
            'questions': questions,
            'answers': []
        }
        return jsonify({
            'success': True,
            'message': f'Started survey for user {user_id}'
        })
    
    # Handle response and send next question
    if user_id not in active_surveys:
        return jsonify({'error': 'No active survey found'}), 400
        
    survey = active_surveys[user_id]
    current_question = survey['questions'][survey['current_question']]
    
    # Validate response format
    if not validate_response(message, current_question['format'], current_question.get('options')):
        return jsonify({'error': 'Invalid response format'}), 400
    
    # Store answer
    survey['answers'].append({
        'question': current_question['question'],
        'answer': message,
        'format': current_question['format']
    })
    survey['current_question'] += 1
    
    # Check if survey is complete
    if survey['current_question'] >= len(survey['questions']):
        del active_surveys[user_id]  # Clear the survey data
        return jsonify({
            'success': True,
            'message': 'Survey completed'
        })
    
    # Send next question
    next_question = survey['questions'][survey['current_question']]
    return jsonify({
        'success': True,
        'next_question': next_question
    })

def validate_response(response, format, options=None):
    if not response:
        return False
        
    if format == 'text':
        return bool(response.strip())
    elif format == 'number':
        try:
            num = int(response)
            return 1 <= num <= 10
        except ValueError:
            return False
    elif format == 'yesno':
        return response.lower() in ['yes', 'no']
    elif format == 'multiple':
        return options and response.upper() in options
    return False

if __name__ == '__main__':
    app.run(debug=True, port=5001) 