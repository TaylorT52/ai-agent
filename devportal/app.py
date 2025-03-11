from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, Blueprint
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import uuid
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='../templates', static_folder='../static')
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev')  # Change this in production!

# Database configuration
db_path = os.path.join(os.path.dirname(__file__), 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    api_key = db.Column(db.String(40), unique=True, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_api_key(self):
        self.api_key = f"key_{uuid.uuid4().hex[:20]}"
        return self.api_key

# Form Definition model
class FormDefinition(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=True)
    structure = db.Column(db.Text, nullable=False)  # JSON structure of the form
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    user = db.relationship('User', backref=db.backref('forms', lazy=True))

# Form Submission model
class FormSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    form_id = db.Column(db.Integer, db.ForeignKey('form_definition.id'), nullable=False)
    discord_user_id = db.Column(db.String(80), nullable=False)
    data = db.Column(db.Text, nullable=False)  # JSON with the submitted answers
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    form = db.relationship('FormDefinition', backref=db.backref('submissions', lazy=True))

# Create all database tables
with app.app_context():
    db.create_all()
    # Create a demo user if none exists
    if not User.query.filter_by(username='demo').first():
        demo_user = User(username='demo', email='demo@example.com')
        demo_user.set_password('demo123')
        demo_user.generate_api_key()
        db.session.add(demo_user)
        db.session.commit()

# Discord Bot API URL (this would be your deployed API endpoint)
BOT_API_URL = os.getenv('BOT_API_URL', 'http://localhost:8000')
# Mistral API key
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')

# Routes
@app.route('/')
def index():
    # Directly show dashboard without login
    return render_template('dashboard.html', user={'username': 'Demo User'})

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Bypass login and redirect to dashboard
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    # Directly show dashboard without login check
    return render_template('dashboard.html', user={'username': 'Demo User'})

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

# API Routes
@app.route('/api/generate-form', methods=['POST'])
def generate_form():
    """Generate a form structure from a natural language description using Mistral AI"""
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

@app.route('/api/forms', methods=['GET'])
def get_forms():
    """Get all forms for the current user"""
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

@app.route('/api/forms', methods=['POST'])
def create_form():
    """Create a new form definition"""
    data = request.json
    if not data or 'name' not in data or 'structure' not in data:
        return jsonify({'error': 'Name and structure are required'}), 400
    
    # In a real implementation, we would save this to the database
    # and associate it with the current user
    
    return jsonify({'id': uuid.uuid4().hex, 'success': True})

@app.route('/api/start-form', methods=['POST'])
def start_form():
    """Start the form collection process via Discord"""
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
    
    print(discord_user_id)

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
            data="{}",  
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

@app.route('/api/regenerate-api-key', methods=['POST'])
def regenerate_api_key():
    """Regenerate the API key for the current user"""
    # In a real implementation, we would get the user from the session
    # For the prototype, we'll use the demo user
    
    user = User.query.filter_by(username='demo').first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    api_key = user.generate_api_key()
    db.session.commit()
    
    return jsonify({'api_key': api_key})

if __name__ == '__main__':
    app.run(debug=True)