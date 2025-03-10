import json
import logging
import os
from typing import Dict, Any, List, Optional, Tuple

from dotenv import load_dotenv
import requests
from user_manager import UserManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("form_handler")

load_dotenv()

class FormHandler:
    """Handles form collection through Discord using Mistral API for natural language processing."""
    
    def __init__(self, user_manager: UserManager):
        """Initialize the form handler with a user manager."""
        self.user_manager = user_manager
        self.mistral_api_key = os.getenv("MISTRAL_API_KEY")
        self.api_base_url = "https://api.mistral.ai/v1"
        
        if not self.mistral_api_key:
            logger.warning("MISTRAL_API_KEY not found in environment variables. Conversational features will be limited.")
    
    async def start_form_collection(self, user_id: str, form_id: str, callback) -> Tuple[bool, str]:
        """Start collecting form data from a user."""
        # In a real implementation, we would fetch the form definition from the database
        # For the prototype, we'll use a mock form
        
        try:
            # This would be a database call in production
            mock_form = {
                "name": "Customer Onboarding",
                "fields": [
                    {"name": "fullName", "type": "string", "prompt": "What's your full name?", "required": True},
                    {"name": "email", "type": "email", "prompt": "What's your email address?", "required": True},
                    {"name": "phone", "type": "phone", "prompt": "What's your phone number with country code?", "required": True},
                    {"name": "preferredContact", "type": "choice", "prompt": "Do you prefer to be contacted by phone or email?", "options": ["Phone", "Email"], "required": True}
                ]
            }
            
            session_id = self.user_manager.start_form_session(user_id, form_id, mock_form)
            if not session_id:
                return False, "Failed to start form session. Please try again."
            
            # Get the first field
            session = self.user_manager.get_active_session(user_id)
            if not session:
                return False, "Failed to retrieve form session. Please try again."
            
            field = session["form_data"]["fields"][0]
            
            # Generate introduction message using Mistral API
            intro_message = await self._generate_intro_message(session["form_data"]["name"], field)
            
            # Send the intro message
            await callback(intro_message)
            
            return True, session_id
        
        except Exception as e:
            logger.error(f"Error starting form collection: {e}")
            return False, f"An error occurred: {str(e)}"
    
    async def process_response(self, user_id: str, message: str, callback) -> bool:
        """Process a user's response to a form field."""
        try:
            # Get the active session
            session = self.user_manager.get_active_session(user_id)
            if not session:
                await callback("You don't have an active form. Please start a new form collection.")
                return False
            
            # Get the current field
            current_field_idx = session["current_field"]
            field = session["form_data"]["fields"][current_field_idx]
            
            # Validate the response using Mistral API
            valid, formatted_response = await self._validate_response(field, message)
            
            if not valid:
                # Ask the user again with a more specific prompt
                retry_message = await self._generate_retry_message(field, message)
                await callback(retry_message)
                return False
            
            # Save the validated response
            self.user_manager.save_field_response(user_id, session["session_id"], field["name"], formatted_response)
            
            # Advance to the next field
            next_step = self.user_manager.advance_session(user_id, session["session_id"])
            
            if next_step["status"] == "completed":
                # Form is complete, generate summary
                completion_message = await self._generate_completion_message(session["form_data"]["name"], next_step["data"])
                await callback(completion_message)
                
                # In a real implementation, we would send the collected data back to the originating service
                # using the API key and a callback URL
                
                return True
            
            # Ask the next question
            next_question = await self._generate_field_message(next_step["field"])
            await callback(next_question)
            
            return False
        
        except Exception as e:
            logger.error(f"Error processing response: {e}")
            await callback(f"An error occurred while processing your response. Please try again.")
            return False
    
    async def _generate_intro_message(self, form_name: str, first_field: Dict[str, Any]) -> str:
        """Generate an introduction message for the form."""
        if not self.mistral_api_key:
            return f"I'm collecting information for {form_name}. {first_field['prompt']}"
        
        try:
            prompt = f"""You are an AI assistant helping to collect information through a conversational interface. 
            You need to introduce yourself and start collecting information for a form called '{form_name}'.
            The first piece of information you need to collect is: {first_field['prompt']}
            
            Write a friendly, conversational introduction that explains the purpose of the form and asks for the first piece of information.
            Keep it brief and natural."""
            
            response = requests.post(
                f"{self.api_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.mistral_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistral-small",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that collects information through a friendly conversation."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 300
                }
            )
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"Error generating intro message: {e}")
            return f"I'm collecting information for {form_name}. {first_field['prompt']}"
    
    async def _generate_field_message(self, field: Dict[str, Any]) -> str:
        """Generate a message to ask for a specific field."""
        if not self.mistral_api_key:
            return field["prompt"]
        
        try:
            type_info = ""
            if field["type"] == "email":
                type_info = "This should be a valid email address."
            elif field["type"] == "phone":
                type_info = "This should be a valid phone number with country code."
            elif field["type"] == "choice" and "options" in field:
                type_info = f"Please choose from: {', '.join(field['options'])}."
            
            prompt = f"""You are an AI assistant helping to collect information through a conversational interface.
            You need to ask the user for the following information: {field['prompt']} {type_info}
            
            Write a friendly, conversational message asking for this information.
            Keep it brief and natural."""
            
            response = requests.post(
                f"{self.api_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.mistral_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistral-small",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that collects information through a friendly conversation."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 200
                }
            )
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"Error generating field message: {e}")
            return field["prompt"]
    
    async def _validate_response(self, field: Dict[str, Any], response: str) -> Tuple[bool, str]:
        """Validate a user's response to a field using Mistral API."""
        if not self.mistral_api_key:
            # Simple validation without Mistral API
            if field["type"] == "email" and "@" not in response:
                return False, response
            return True, response
        
        try:
            prompt = f"""You are validating a user's response to a form field.
            Field: {field['name']} ({field['type']})
            Prompt: {field['prompt']}
            User response: "{response}"
            
            Validate if the response is appropriate for this field type. If it's valid, format it correctly.
            If it's invalid, explain why it's invalid.
            
            Respond in JSON format with the following structure:
            {{
                "valid": true/false,
                "formatted_response": "formatted response if valid",
                "error": "error message if invalid"
            }}
            """
            
            response_obj = requests.post(
                f"{self.api_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.mistral_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistral-small",
                    "messages": [
                        {"role": "system", "content": "You are a validation assistant that checks if user responses meet the required format and returns JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 300
                }
            )
            
            data = response_obj.json()
            result_text = data["choices"][0]["message"]["content"]
            
            # Extract the JSON part
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_json = json.loads(json_match.group(0))
                if result_json["valid"]:
                    return True, result_json["formatted_response"]
                return False, response
            
            # Fallback if JSON parsing fails
            return True, response
        
        except Exception as e:
            logger.error(f"Error validating response: {e}")
            return True, response  # Default to accepting the response if validation fails
    
    async def _generate_retry_message(self, field: Dict[str, Any], invalid_response: str) -> str:
        """Generate a message to ask the user to retry with a valid response."""
        if not self.mistral_api_key:
            if field["type"] == "email":
                return "That doesn't look like a valid email address. Please enter a valid email address."
            elif field["type"] == "phone":
                return "That doesn't look like a valid phone number. Please enter a valid phone number with country code."
            elif field["type"] == "choice" and "options" in field:
                return f"Please choose one of the following options: {', '.join(field['options'])}."
            return f"Please provide a valid response. {field['prompt']}"
        
        try:
            type_info = ""
            if field["type"] == "email":
                type_info = "This should be a valid email address."
            elif field["type"] == "phone":
                type_info = "This should be a valid phone number with country code."
            elif field["type"] == "choice" and "options" in field:
                type_info = f"Please choose from: {', '.join(field['options'])}."
            
            prompt = f"""You are an AI assistant helping to collect information through a conversational interface.
            You asked the user for: {field['prompt']} {type_info}
            The user responded with: "{invalid_response}"
            This response is not valid for this field type.
            
            Write a friendly, conversational message explaining why the response is not valid and asking them to try again.
            Keep it brief and natural."""
            
            response = requests.post(
                f"{self.api_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.mistral_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistral-small",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that collects information through a friendly conversation."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 200
                }
            )
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"Error generating retry message: {e}")
            if field["type"] == "email":
                return "That doesn't look like a valid email address. Please enter a valid email address."
            elif field["type"] == "phone":
                return "That doesn't look like a valid phone number. Please enter a valid phone number with country code."
            elif field["type"] == "choice" and "options" in field:
                return f"Please choose one of the following options: {', '.join(field['options'])}."
            return f"Please provide a valid response. {field['prompt']}"
    
    async def _generate_completion_message(self, form_name: str, collected_data: Dict[str, str]) -> str:
        """Generate a completion message summarizing the collected data."""
        if not self.mistral_api_key:
            message = f"Thank you for completing the {form_name} form. Here's a summary of the information you provided:\n\n"
            for field, value in collected_data.items():
                message += f"{field}: {value}\n"
            message += "\nThis information has been submitted successfully."
            return message
        
        try:
            # Format the collected data as a readable string
            data_str = "\n".join([f"{field}: {value}" for field, value in collected_data.items()])
            
            prompt = f"""You are an AI assistant helping to collect information through a conversational interface.
            The user has completed the '{form_name}' form. Here is the information they provided:
            
            {data_str}
            
            Write a friendly, conversational message thanking them for completing the form,
            summarizing the information they provided, and letting them know it has been submitted successfully.
            Keep it brief and natural."""
            
            response = requests.post(
                f"{self.api_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.mistral_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistral-small",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that collects information through a friendly conversation."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 300
                }
            )
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"Error generating completion message: {e}")
            message = f"Thank you for completing the {form_name} form. Here's a summary of the information you provided:\n\n"
            for field, value in collected_data.items():
                message += f"{field}: {value}\n"
            message += "\nThis information has been submitted successfully."
            return message
