from flask import Flask, send_from_directory, jsonify, request, render_template
import secrets
import json
from pathlib import Path
from datetime import datetime
import os
from mistralai import Mistral
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
client = Mistral(api_key=os.getenv('MISTRAL_API_KEY'))

# Store active surveys and API keys
active_surveys = {}
api_keys = {}

# Question generation prompt template
QUESTION_GENERATION_PROMPT = """
Generate a survey with questions based on the following topic and requirements:

Topic: {topic}
Number of questions: {num_questions}
Additional requirements: {requirements}

For each question, provide:
1. The question text
2. The format (one of: text, number, yesno, multiple)
3. Options (only for multiple choice questions)
4. Any validation rules

Format the output as a JSON array of question objects.
"""

# Natural language to survey translation prompt
TRANSLATE_PROMPT = """
Create a JSON array of survey questions based on this description: {description}

Rules:
1. Output ONLY a valid JSON array
2. Each question must have these exact fields:
   - "question": The question text
   - "format": One of ["text", "number", "yesno", "multiple"]
   - "validation": Validation rules (optional)
   - "options": Required for multiple choice questions only

Example of valid output:
[
    {{
        "question": "What is your name?",
        "format": "text",
        "validation": "letters and spaces only"
    }},
    {{
        "question": "What is your email address?",
        "format": "text",
        "validation": "valid email format"
    }}
]

Remember:
- Start with [
- End with ]
- Use proper JSON formatting
- No additional text or explanations
"""

def translate_natural_language_to_questions(description):
    """Translate a natural language survey description into structured questions."""
    try:
        if not os.getenv('MISTRAL_API_KEY'):
            print("Error: MISTRAL_API_KEY not found in environment variables")
            return None

        print(f"Sending request to Mistral API with description: {description}")

        # Update the system message to be more explicit about JSON formatting
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": """You are a JSON-only survey question generator.
Your responses must:
1. Start with [
2. End with ]
3. Contain only valid JSON
4. Include no explanatory text
5. Format questions exactly as shown in the example"""
                },
                {
                    "role": "user",
                    "content": TRANSLATE_PROMPT.format(description=description)
                }
            ],
            temperature=0.1,  # Lower temperature for more consistent JSON output
            max_tokens=1000,  # Ensure we get complete responses
            random_seed=42    # For consistent outputs
        )

        content = response.choices[0].message.content.strip()
        print(f"Raw API response: {content}")

        # Clean up the response if needed
        if not content.startswith('['):
            # Try to find the start of the JSON array
            start_idx = content.find('[')
            if start_idx != -1:
                content = content[start_idx:]
            else:
                raise ValueError("Response does not contain a JSON array")

        if not content.endswith(']'):
            # Try to find the end of the JSON array
            end_idx = content.rfind(']')
            if end_idx != -1:
                content = content[:end_idx + 1]
            else:
                raise ValueError("Response does not contain a complete JSON array")

        # Parse and validate the response
        try:
            questions = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}")
            print(f"Attempted to parse: {content}")
            raise

        if not isinstance(questions, list):
            raise ValueError("Response is not a JSON array")

        # Validate each question
        for question in questions:
            if not isinstance(question, dict):
                raise ValueError("Question is not a JSON object")

            if not all(key in question for key in ['question', 'format']):
                print(f"Invalid question format - missing required fields: {question}")
                raise ValueError("Invalid question format in response")

            if question['format'] == 'multiple' and 'options' not in question:
                print(f"Multiple choice question missing options: {question}")
                raise ValueError("Multiple choice question missing options")

            # Ensure format is valid
            if question['format'] not in ['text', 'number', 'yesno', 'multiple']:
                print(f"Invalid question format type: {question['format']}")
                raise ValueError(f"Invalid question format: {question['format']}")

        return questions
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {str(e)}")
        print(f"Raw response content: {content if 'content' in locals() else 'Not available'}")
        return None
    except Exception as e:
        print(f"Error translating questions: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Raw response content: {content if 'content' in locals() else 'Not available'}")
        return None

def generate_questions(topic, num_questions, requirements=""):
    try:
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates survey questions. Output only valid JSON."},
                {"role": "user", "content": QUESTION_GENERATION_PROMPT.format(
                    topic=topic,
                    num_questions=num_questions,
                    requirements=requirements
                )}
            ]
        )

        # Parse the response and validate the structure
        questions = json.loads(response.choices[0].message.content)

        # Validate each question has required fields
        for question in questions:
            if not all(key in question for key in ['question', 'format']):
                raise ValueError("Invalid question format in response")

            # Ensure multiple choice questions have options
            if question['format'] == 'multiple' and 'options' not in question:
                raise ValueError("Multiple choice question missing options")

        return questions
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        return None

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

def generate_human_response(context, response_type="general"):
    """Generate a human-like response using Mistral API."""
    try:
        prompts = {
            "welcome": """
You are a friendly survey bot having a casual conversation. Generate a welcoming message for a new survey participant.
The message should feel like a natural chat conversation, not a formal survey.

Context:
{context}

Rules:
1. Be warm and friendly, like chatting with a friend
2. Start with a casual greeting
3. Naturally lead into the first question
4. Don't mention formats or rules explicitly
5. Don't use phrases like "Please respond" or "according to the format"
6. Don't mention that you're an AI or a bot
7. Keep it concise (2-3 sentences)

Example good response:
"Hi there! 👋 I'd love to learn a bit about you. What's your name?"

Example bad response:
"Welcome to the survey! You will receive questions one by one. Please respond to each question according to the format specified."
""",
            "invalid_format": """
You are having a casual conversation and need to gently guide the person to provide their answer in a different way.
Be encouraging and natural, like helping a friend.

Context:
{context}

Rules:
1. Be casual and friendly
2. Don't say "invalid format" or "incorrect format"
3. Gently guide them to the right format
4. Use conversational language
5. Don't mention rules or specifications
6. Keep it concise and natural

Example good response:
"I should have been clearer! I'm looking for your name - something like 'John' or 'Sarah'. What should I call you?"

Example bad response:
"Invalid response format. Please enter a valid name using letters, spaces, hyphens, or apostrophes."
""",
            "next_question": """
You are having a natural conversation. Acknowledge their previous answer and smoothly transition to the next question.

Context:
{context}

Rules:
1. Acknowledge their answer naturally
2. Transition smoothly to the next question
3. Make it feel like a flowing conversation
4. Don't mention question numbers or formats
5. Keep it casual and friendly
6. Use conversational language

Example good response:
"Nice to meet you, John! Now I'm curious - what's your favorite color?"

Example bad response:
"Thank you. Moving to the next question: What is your favorite color? Please choose from the following options."
""",
            "completion": """
You are wrapping up a friendly conversation. Thank the participant warmly and naturally.

Context:
{context}

Rules:
1. Be genuinely appreciative
2. Keep it casual and friendly
3. Make it feel like ending a nice chat
4. Don't mention "survey" or "responses"
5. Use conversational language
6. Maybe add a friendly emoji

Example good response:
"Thanks so much for chatting with me, John! Really enjoyed getting to know you better. Take care! 👋"

Example bad response:
"Thank you for completing the survey. Your responses have been recorded."
"""
        }

        # Ensure we have the API key
        if not os.getenv('MISTRAL_API_KEY'):
            print("Warning: MISTRAL_API_KEY not found in environment variables")
            return None

        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": prompts.get(response_type, prompts["general"])
                },
                {
                    "role": "user",
                    "content": context
                }
            ],
            temperature=0.7,
            max_tokens=150
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating human response: {str(e)}")
        return None

def get_format_instructions(format_type, options=None):
    """Get human-friendly format instructions."""
    instructions = {
        "text": "",  # No explicit format instructions for text
        "number": "on a scale from 1 to 10",
        "yesno": "with yes or no",
        "multiple": f"Pick one: {', '.join([f'{v}' for v in options.values()])}" if options else "from the options"
    }
    return instructions.get(format_type, "")

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

        # Generate welcome message with first question
        first_question = questions[0]
        context = {
            "question": first_question['question'],
            "format": get_format_instructions(first_question['format'], first_question.get('options'))
        }

        response = generate_human_response(json.dumps(context), "welcome")
        if not response:
            response = f"Welcome to the survey! {first_question['question']} {get_format_instructions(first_question['format'], first_question.get('options'))}"

        return jsonify({
            'success': True,
            'message': response
        })

    # Handle response and send next question
    if user_id not in active_surveys:
        return jsonify({'error': 'No active survey found'}), 400

    survey = active_surveys[user_id]
    current_question = survey['questions'][survey['current_question']]

    # Validate response format
    if not validate_response(message, current_question['format'], current_question.get('options')):
        context = {
            "question": current_question['question'],
            "format": get_format_instructions(current_question['format'], current_question.get('options')),
            "invalid_response": message
        }

        response = generate_human_response(json.dumps(context), "invalid_format")
        if not response:
            response = f"That format isn't quite right. {get_format_instructions(current_question['format'], current_question.get('options'))}"

        return jsonify({'error': response}), 400

    # Store answer
    survey['answers'].append({
        'question': current_question['question'],
        'answer': message,
        'format': current_question['format']
    })
    survey['current_question'] += 1

    # Check if survey is complete
    if survey['current_question'] >= len(survey['questions']):
        context = {
            "answers": survey['answers']
        }

        print("SURVEY IS COMPLETE", survey);

        response = generate_human_response(json.dumps(context), "completion")
        if not response:
            response = "Thank you for completing the survey! Your responses have been recorded."

        del active_surveys[user_id]  # Clear the survey data
        return jsonify({
            'success': True,
            'message': response
        })

    # Send next question
    next_question = survey['questions'][survey['current_question']]
    context = {
        "previous_question": current_question['question'],
        "previous_answer": message,
        "next_question": next_question['question'],
        "format": get_format_instructions(next_question['format'], next_question.get('options'))
    }

    response = generate_human_response(json.dumps(context), "next_question")
    if not response:
        response = f"{next_question['question']} {get_format_instructions(next_question['format'], next_question.get('options'))}"

    return jsonify({
        'success': True,
        'message': response
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

@app.route('/api/generate-questions', methods=['POST'])
def generate_survey_questions():
    data = request.json
    api_key = data.get('api_key')

    if not api_key or api_key not in api_keys:
        return jsonify({'error': 'Invalid API key'}), 401

    topic = data.get('topic')
    num_questions = data.get('num_questions', 5)
    requirements = data.get('requirements', '')

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    if not 1 <= num_questions <= 20:
        return jsonify({'error': 'Number of questions must be between 1 and 20'}), 400

    questions = generate_questions(topic, num_questions, requirements)

    if questions is None:
        return jsonify({'error': 'Failed to generate questions'}), 500

    # Store the generated questions
    api_keys[api_key]['questions'] = questions

    return jsonify({
        'success': True,
        'questions': questions
    })

@app.route('/api/translate-questions', methods=['POST'])
def translate_questions():
    """Endpoint to translate natural language survey descriptions into structured questions."""
    try:
        data = request.json
        print(f"Received request data: {data}")

        api_key = data.get('api_key')
        description = data.get('description')

        if not api_key or api_key not in api_keys:
            print(f"Invalid API key: {api_key}")
            return jsonify({'error': 'Invalid API key'}), 401

        if not description:
            print("Missing description in request")
            return jsonify({'error': 'Survey description is required'}), 400

        print(f"Processing description: {description}")
        questions = translate_natural_language_to_questions(description)

        if questions is None:
            print("Failed to generate questions from description")
            return jsonify({'error': 'Failed to translate survey description'}), 500

        print(f"Successfully generated questions: {questions}")

        # Store the generated questions
        api_keys[api_key]['questions'] = questions

        return jsonify({
            'success': True,
            'questions': questions,
            'message': 'Survey questions generated successfully'
        })
    except Exception as e:
        print(f"Unexpected error in translate_questions endpoint: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
