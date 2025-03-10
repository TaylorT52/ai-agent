VARIABLES = [
    {
        'name': 'firstname',
        'prompt': 'Please enter your first name',
        'validation': {
            'type': 'string',
            'max_length': 50,
            'required': True
        }
    },
    {
        'name': 'email',
        'prompt': 'Please enter your email address',
        'validation': {
            'type': 'email',
            'required': True
        }
    }
]

# Discord bot configuration
TOKEN = 'your-discord-bot-token'  # Replace with your actual bot token
