from flask import Blueprint, jsonify, request
import os
import json
import requests
import uuid
from dotenv import load_dotenv
import sys
import os.path

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# Create a Flask Blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Discord Bot API URL (this would be your deployed API endpoint)
BOT_API_URL = os.getenv('BOT_API_URL', 'http://localhost:8000')
# Mistral API key
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')

@api_bp.route('/generate-form', methods=['POST'])
def generate_form():
    """Generate a form structure from a natural language description using Mistral AI"""
    # Import here to avoid circular imports
    from devportal.app import db, User, FormDefinition, FormSubmission
    
    description = request.json.get('description')
    if not description:
        return jsonify({'error': 'Description is required'}), 400

    # In a production implementation, this would call the Mistral API
    # For now, generate a mock response based on the description
    try:
        if MISTRAL_API_KEY:
            # Call Mistral API to convert description to form fields
            fields = call_mistral_api_for_form_generation(description)
        else:
            # Example form structure - simulate what Mistral would generate
            fields = [
                {'name': 'fullName', 'type': 'string', 'prompt': "What's your full name?", 'required': True},
                {'name': 'email', 'type': 'email', 'prompt': "What's your email address?", 'required': True}
            ]
            
            # Add fields based on keywords in the description
            if 'phone' in description.lower():
                fields.append({
                    'name': 'phone', 
                    'type': 'phone', 
                    'prompt': "What's your phone number with country code?", 
                    'required': True
                })
                
            if 'contact' in description.lower():
                fields.append({
                    'name': 'preferredContact', 
                    'type': 'choice', 
                    'prompt': "Do you prefer to be contacted by phone or email?", 
                    'options': ['Phone', 'Email'], 
                    'required': True
                })
                
            if 'address' in description.lower():
                fields.append({
                    'name': 'address', 
                    'type': 'string', 
                    'prompt': "What's your address?", 
                    'required': True
                })
        
        return jsonify({'fields': fields})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def call_mistral_api_for_form_generation(description):
    """Call Mistral API to convert a natural language description to form fields"""
    try:
        # This would be a real API call in production
        prompt = f"""
        You are tasked with converting a natural language description of a form into a structured JSON format.
        
        FORM DESCRIPTION: {description}
        
        Convert this description into a list of form fields, where each field has the following properties:
        - name: A camelCase identifier for the field (e.g., 'fullName', 'emailAddress')
        - type: The data type (string, email, phone, number, date, choice)
        - prompt: The question to ask the user
        - required: Boolean indicating if the field is required
        - options: Array of choices (only for choice type)
        
        Output the result as a JSON array of field objects.
        """
        
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {MISTRAL_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mistral-small",
                "messages": [
                    {"role": "system", "content": "You are a form builder assistant. Output only valid JSON arrays of form field objects."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000
            }
        )
        
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        
        # Extract JSON array from the response
        import re
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            fields = json.loads(json_match.group(0))
            return fields
        
        # Fallback if regex fails
        return json.loads(content)
    
    except Exception as e:
        print(f"Error calling Mistral API: {e}")
        # Fallback to basic fields
        return [
            {'name': 'fullName', 'type': 'string', 'prompt': "What's your full name?", 'required': True},
            {'name': 'email', 'type': 'email', 'prompt': "What's your email address?", 'required': True}
        ]

@api_bp.route('/forms', methods=['GET'])
def get_forms():
    """Get all forms for the current user"""
    # Import here to avoid circular imports
    from devportal.app import db, User, FormDefinition, FormSubmission
    
    # In a real implementation, we would get the user from the session
    # For the prototype, we'll return a mock response
    mock_forms = [
        {
            'id': 1,
            'name': 'Customer Onboarding',
            'description': 'Collect information from new customers',
            'created_at': '2025-03-10T12:00:00Z',
            'submissions': 12
        },
        {
            'id': 2,
            'name': 'Feedback Survey',
            'description': 'Collect customer feedback about our service',
            'created_at': '2025-03-09T15:30:00Z',
            'submissions': 8
        }
    ]
    
    return jsonify(mock_forms)

@api_bp.route('/forms', methods=['POST'])
def create_form():
    """Create a new form definition"""
    # Import here to avoid circular imports
    from devportal.app import db, User, FormDefinition, FormSubmission
    
    data = request.json
    if not data or 'name' not in data or 'structure' not in data:
        return jsonify({'error': 'Name and structure are required'}), 400
    
    # In a real implementation, we would save this to the database
    # and associate it with the current user
    
    return jsonify({'id': uuid.uuid4().hex, 'success': True})

@api_bp.route('/start-form', methods=['POST'])
def start_form():
    """Start the form collection process via Discord"""
    # Import here to avoid circular imports
    from devportal.app import db, User, FormDefinition, FormSubmission
    
    # Validate API key
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Invalid or missing API key'}), 401
    
    api_key = auth_header.split(' ')[1]
    user = User.query.filter_by(api_key=api_key).first()
    if not user:
        return jsonify({'error': 'Invalid API key'}), 401

    # Get the Discord user ID and form ID
    discord_user_id = request.json.get('discordUserId')
    form_id = request.json.get('formId')
    
    if not discord_user_id or not form_id:
        return jsonify({'error': 'Discord user ID and form ID are required'}), 400

    # In a real implementation, we would call the Discord bot's API
    try:
        # This would be a real API call to the Discord bot in production
        # For now, just simulate success
        # response = requests.post(
        #     f"{BOT_API_URL}/api/form-collect",
        #     json={
        #         "discord_user_id": discord_user_id,
        #         "form_id": form_id,
        #         "api_key": api_key
        #     }
        # )
        # 
        # if response.status_code != 200:
        #     return jsonify({'error': 'Failed to start form collection'}), 500
        
        # Create a new form submission record
        submission = FormSubmission(
            form_id=form_id,
            discord_user_id=discord_user_id,
            data="{}",  # Empty data initially
            status="pending"
        )
        db.session.add(submission)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"Form collection initiated for Discord user {discord_user_id}"
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/regenerate-api-key', methods=['POST'])
def regenerate_api_key():
    """Regenerate the API key for the current user"""
    # Import here to avoid circular imports
    from devportal.app import db, User, FormDefinition, FormSubmission
    
    # In a real implementation, we would get the user from the session
    # For the prototype, we'll use the demo user
    
    user = User.query.filter_by(username='demo').first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    api_key = user.generate_api_key()
    db.session.commit()
    
    return jsonify({'api_key': api_key})
