from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from agent import MistralAgent

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Initialize the Mistral agent
agent = MistralAgent()

@app.route('/api/chat', methods=['POST'])
async def chat():
    try:
        data = request.json
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
            
        # Process the message using the Mistral agent
        response = await agent.run(message)
        
        return jsonify({
            'response': response
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 