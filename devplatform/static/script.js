let currentApiKey = '';
let questions = [];
let generatedQuestions = [];

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

function handleFormatChange(select) {
    const optionsContainer = select.parentElement.querySelector('.options-container');
    if (select.value === 'multiple') {
        optionsContainer.classList.add('visible');
    } else {
        optionsContainer.classList.remove('visible');
    }
}

function addQuestion() {
    const questionsContainer = document.getElementById('questions');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    
    // Question input
    const questionInput = document.createElement('input');
    questionInput.type = 'text';
    questionInput.placeholder = 'Enter your question';
    questionInput.className = 'question-input';
    
    // Format select
    const formatSelect = document.createElement('select');
    formatSelect.className = 'format-select';
    formatSelect.innerHTML = `
        <option value="text">Text</option>
        <option value="number">Number (1-10)</option>
        <option value="yesno">Yes/No</option>
        <option value="multiple">Multiple Choice</option>
    `;
    formatSelect.onchange = () => handleFormatChange(formatSelect);
    
    // Multiple choice options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    optionsContainer.innerHTML = `
        <input type="text" 
               class="options-input" 
               placeholder="Options (comma-separated)"
               title="Enter options separated by commas (e.g., Red, Blue, Green)">
    `;
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-question';
    deleteButton.innerHTML = '×';
    deleteButton.onclick = () => questionDiv.remove();
    
    questionDiv.appendChild(questionInput);
    questionDiv.appendChild(formatSelect);
    questionDiv.appendChild(optionsContainer);
    questionDiv.appendChild(deleteButton);
    questionsContainer.appendChild(questionDiv);
}

async function saveQuestions() {
    if (!currentApiKey) {
        alert('Please generate an API key first');
        return;
    }

    const questionItems = document.querySelectorAll('.question-item');
    const questions = Array.from(questionItems).map(item => {
        const question = item.querySelector('.question-input').value.trim();
        const format = item.querySelector('.format-select').value;
        const optionsInput = item.querySelector('.options-input');
        
        let options = null;
        if (format === 'multiple' && optionsInput) {
            const optionsText = optionsInput.value.trim();
            if (optionsText) {
                options = {};
                const optionsList = optionsText.split(',').map(o => o.trim());
                optionsList.forEach((opt, index) => {
                    options[String.fromCharCode(65 + index)] = opt; // A, B, C, D...
                });
            }
        }
        
        return {
            question,
            format,
            options
        };
    }).filter(q => q.question);
    
    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }

    try {
        const response = await fetch('/api/save-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: currentApiKey,
                questions
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
    const questionItems = document.querySelectorAll('.question-item');
    const questions = Array.from(questionItems).map(item => {
        const question = item.querySelector('.question-input').value.trim();
        const format = item.querySelector('.format-select').value;
        const optionsInput = item.querySelector('.options-input');
        
        let options = null;
        if (format === 'multiple' && optionsInput) {
            const optionsText = optionsInput.value.trim();
            if (optionsText) {
                options = {};
                const optionsList = optionsText.split(',').map(o => o.trim());
                optionsList.forEach((opt, index) => {
                    options[String.fromCharCode(65 + index)] = opt;
                });
            }
        }
        
        return {
            question,
            format,
            options
        };
    }).filter(q => q.question);
    
    if (questions.length === 0) {
        alert('Please add at least one question');
        return;
    }

    const startSurveyStr = startSurvey.toString().replace(/`/g, '\\`');
    const addMessageStr = addMessage.toString().replace(/`/g, '\\`');

    const embedCode = `
<!-- Discord Survey Widget -->
<div id="discord-survey">
    <style>
        .discord-survey {
            max-width: 500px;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 20px auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .survey-messages {
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 10px 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .message {
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 80%;
            word-wrap: break-word;
        }
        .bot-message {
            background: #7289da;
            color: white;
            align-self: flex-start;
        }
        .user-message {
            background: #e9ecef;
            color: #2e3338;
            align-self: flex-end;
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
            width: 100%;
        }
        .discord-survey button:hover {
            background: #5b73c7;
        }
        .discord-survey .error {
            color: #dc3545;
            font-size: 14px;
            margin-top: 5px;
        }
        .discord-survey .success {
            color: #28a745;
            font-size: 14px;
            margin-top: 5px;
        }
        .message-input-container {
            margin-top: 15px;
            display: flex;
            gap: 10px;
        }
        .message-input-container input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 0;
        }
        .message-input-container button {
            padding: 8px 16px;
            background: #7289da;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: auto;
        }
        .message-input-container button:hover {
            background: #5b73c7;
        }
    </style>
    <div class="discord-survey">
        <h3>Discord Survey</h3>
        <p>Enter your Discord User ID to start the survey:</p>
        <input type="text" id="discord-user-id" placeholder="Discord User ID">
        <button onclick="startSurvey()">Start Survey</button>
        <div id="survey-error" class="error"></div>
        <div id="survey-success" class="success"></div>
    </div>
</div>
<script>
// API URL - Replace this with your production server URL
const API_URL = 'http://localhost:3001';

// Survey questions
const SURVEY_QUESTIONS = ${JSON.stringify(questions, null, 2)};

${startSurveyStr}

${addMessageStr}
</script>`.replace(/\${/g, '\\${');

    document.getElementById('embedCode').textContent = embedCode;
    document.getElementById('embedSection').classList.remove('hidden');
    
    // Show preview
    document.getElementById('previewContainer').innerHTML = embedCode;
}

// Helper function to add messages to the chat
function addMessage(container, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    container.appendChild(messageDiv);
}

function copyEmbedCode() {
    const embedCode = document.getElementById('embedCode').textContent;
    navigator.clipboard.writeText(embedCode)
        .then(() => alert('Embed code copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
}

async function generateQuestionsFromDescription() {
    if (!currentApiKey) {
        alert('Please generate an API key first');
        return;
    }

    const description = document.getElementById('naturalLanguageInput').value.trim();
    if (!description) {
        alert('Please enter a description of the questions you want to generate');
        return;
    }

    try {
        console.log('Sending request with:', {
            api_key: currentApiKey,
            description: description
        });

        const response = await fetch('/api/translate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: currentApiKey,
                description: description
            })
        });

        const data = await response.json();
        console.log('Received response:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate questions');
        }

        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid response format: questions array is missing');
        }

        generatedQuestions = data.questions;
        displayGeneratedQuestions(generatedQuestions);
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            error: error
        });
        alert('Error generating questions: ' + error.message);
    }
}

function displayGeneratedQuestions(questions) {
    const container = document.querySelector('#generatedQuestions');
    const preview = container.querySelector('.questions-preview');
    
    preview.innerHTML = questions.map((q, index) => `
        <div class="preview-question">
            <h4>Question ${index + 1}</h4>
            <p><strong>Question:</strong> ${q.question}</p>
            <p><strong>Format:</strong> ${q.format}</p>
            ${q.options ? `
                <p><strong>Options:</strong></p>
                <ul>
                    ${Object.entries(q.options).map(([key, value]) => 
                        `<li>${key}: ${value}</li>`
                    ).join('')}
                </ul>
            ` : ''}
            ${q.validation ? `<p><strong>Validation:</strong> ${q.validation}</p>` : ''}
        </div>
    `).join('');
    
    container.classList.remove('hidden');
}

function useGeneratedQuestions() {
    if (!generatedQuestions.length) {
        alert('No questions have been generated yet');
        return;
    }

    // Clear existing questions
    const questionsContainer = document.getElementById('questions');
    questionsContainer.innerHTML = '';

    // Add each generated question
    generatedQuestions.forEach(q => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        
        // Question input
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.value = q.question;
        questionInput.className = 'question-input';
        
        // Format select
        const formatSelect = document.createElement('select');
        formatSelect.className = 'format-select';
        formatSelect.innerHTML = `
            <option value="text" ${q.format === 'text' ? 'selected' : ''}>Text</option>
            <option value="number" ${q.format === 'number' ? 'selected' : ''}>Number (1-10)</option>
            <option value="yesno" ${q.format === 'yesno' ? 'selected' : ''}>Yes/No</option>
            <option value="multiple" ${q.format === 'multiple' ? 'selected' : ''}>Multiple Choice</option>
        `;
        formatSelect.onchange = () => handleFormatChange(formatSelect);
        
        // Multiple choice options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        if (q.format === 'multiple' && q.options) {
            optionsContainer.classList.add('visible');
            const optionsStr = Object.values(q.options).join(', ');
            optionsContainer.innerHTML = `
                <input type="text" 
                       class="options-input" 
                       value="${optionsStr}"
                       placeholder="Options (comma-separated)"
                       title="Enter options separated by commas (e.g., Red, Blue, Green)">
            `;
        } else {
            optionsContainer.innerHTML = `
                <input type="text" 
                       class="options-input" 
                       placeholder="Options (comma-separated)"
                       title="Enter options separated by commas (e.g., Red, Blue, Green)">
            `;
        }
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-question';
        deleteButton.innerHTML = '×';
        deleteButton.onclick = () => questionDiv.remove();
        
        questionDiv.appendChild(questionInput);
        questionDiv.appendChild(formatSelect);
        questionDiv.appendChild(optionsContainer);
        questionDiv.appendChild(deleteButton);
        questionsContainer.appendChild(questionDiv);
    });

    // Scroll to the questions section
    document.getElementById('questionSection').scrollIntoView({ behavior: 'smooth' });
}

// Add initial question
addQuestion(); 