let currentApiKey = '';
let questions = [];

async function generateApiKey() {
    try {
        const response = await fetch('/api/generate-key', {
            method: 'POST'
        });
        const data = await response.json();
        currentApiKey = data.api_key;
        document.getElementById('apiKey').value = currentApiKey;
    } catch (error) {
        console.error('Error generating API key:', error);
        alert('Failed to generate API key. Please try again.');
    }
}

function copyApiKey() {
    if (!currentApiKey) {
        alert('Please generate an API key first');
        return;
    }
    navigator.clipboard.writeText(currentApiKey)
        .then(() => alert('API key copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
}

function addQuestion() {
    const questionsContainer = document.getElementById('questions');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    
    const questionInput = document.createElement('input');
    questionInput.type = 'text';
    questionInput.placeholder = 'Enter your question';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-question';
    deleteButton.innerHTML = '×';
    deleteButton.onclick = () => questionDiv.remove();
    
    questionDiv.appendChild(questionInput);
    questionDiv.appendChild(deleteButton);
    questionsContainer.appendChild(questionDiv);
}

async function saveQuestions() {
    if (!currentApiKey) {
        alert('Please generate an API key first');
        return;
    }

    const questionInputs = document.querySelectorAll('.question-item input');
    const questions = Array.from(questionInputs).map(input => input.value).filter(q => q.trim());
    
    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }

    const responseFormat = document.getElementById('responseFormat').value;

    try {
        const response = await fetch('/api/save-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: currentApiKey,
                questions,
                response_format: responseFormat
            })
        });

        if (response.ok) {
            generateEmbedCode();
        } else {
            alert('Failed to save questions. Please try again.');
        }
    } catch (error) {
        console.error('Error saving questions:', error);
        alert('Failed to save questions. Please try again.');
    }
}

function generateEmbedCode() {
    const embedCode = `
<!-- Discord Survey Widget -->
<div id="discord-survey">
    <style>
        .discord-survey {
            max-width: 400px;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .discord-survey input {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .discord-survey button {
            background: #7289da;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        .discord-survey button:hover {
            background: #5b73c7;
        }
    </style>
    <div class="discord-survey">
        <h3>Discord Survey</h3>
        <p>Enter your Discord User ID to receive the survey:</p>
        <input type="text" id="discord-user-id" placeholder="Discord User ID">
        <button onclick="startSurvey('${currentApiKey}')">Start Survey</button>
    </div>
</div>
<script>
async function startSurvey(apiKey) {
    const userId = document.getElementById('discord-user-id').value;
    if (!userId) {
        alert('Please enter your Discord User ID');
        return;
    }
    
    try {
        const response = await fetch('/api/dm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                message: 'Hello! This is your survey from the Discord bot.'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Survey has been sent to your Discord DMs!');
        } else {
            alert('Failed to start survey: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error starting survey:', error);
        alert('Failed to start survey. Please try again.');
    }
}
</script>`;

    document.getElementById('embedCode').textContent = embedCode;
    document.getElementById('embedSection').classList.remove('hidden');
    
    // Show preview
    document.getElementById('previewContainer').innerHTML = embedCode;
}

function copyEmbedCode() {
    const embedCode = document.getElementById('embedCode').textContent;
    navigator.clipboard.writeText(embedCode)
        .then(() => alert('Embed code copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
}

// Add initial question
addQuestion(); 