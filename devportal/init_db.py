from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import os
import uuid
import sqlite3

# First, ensure the old database is completely removed
db_path = os.path.join(os.path.dirname(__file__), 'users.db')
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Removed old database: {db_path}")

# Create a minimal app for database initialization
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    api_key = db.Column(db.String(40), unique=True, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

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

if __name__ == '__main__':
    # Create all tables
    with app.app_context():
        db.create_all()
        print("Database tables created.")

        # Create a demo user
        demo_user = User(username='demo', email='demo@example.com')
        demo_user.set_password('demo123')
        demo_user.generate_api_key()
        db.session.add(demo_user)
        db.session.commit()
        print(f"Demo user created with API key: {demo_user.api_key}")
        
        # Create a sample form
        sample_form = FormDefinition(
            user_id=demo_user.id,
            name='Customer Onboarding',
            description='Collect information from new customers',
            structure='[{"name":"fullName","type":"string","prompt":"What is your full name?","required":true},{"name":"email","type":"email","prompt":"What is your email address?","required":true},{"name":"phone","type":"phone","prompt":"What is your phone number?","required":true}]'
        )
        db.session.add(sample_form)
        db.session.commit()
        print("Sample form created.")

    print("Database initialization complete!")
