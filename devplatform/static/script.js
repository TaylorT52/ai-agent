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
    </style>
    <div class="discord-survey">
        <h3>Discord Survey</h3>
        <p>Enter your Discord User ID to receive the survey:</p>
        <input type="text" id="discord-user-id" placeholder="Discord User ID">
        <button onclick="startSurvey()">Start Survey</button>
        <div id="survey-error" class="error"></div>
    </div>
</div>
<script>
// Survey questions
const SURVEY_QUESTIONS = ${JSON.stringify(questions, null, 2)};

function getFormatInstructions(format, options = null) {
    switch (format) {
        case 'number':
            return 'Please enter a number between 1 and 10';
        case 'yesno':
            return 'Please answer with Yes or No';
        case 'multiple':
            if (options) {
                return \`Please choose one option:\n\${Object.entries(options)
                    .map(([key, value]) => \`\${key}: \${value}\`)
                    .join('\\n')}\`;
            }
            return 'Please choose one of the provided options';
        case 'text':
            return 'Please type your answer';
        default:
            return '';
    }
}

async function startSurvey() {
    const userId = document.getElementById('discord-user-id').value;
    const errorDiv = document.getElementById('survey-error');
    
    if (!userId) {
        errorDiv.textContent = 'Please enter your Discord User ID';
        return;
    }
    
    try {
        // Send initial message to user
        const startResponse = await fetch('/api/dm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                message: 'Welcome to the survey! You will receive questions one by one. Please respond to each question according to the format specified.',
                isStart: true,
                questions: SURVEY_QUESTIONS
            })
        });

        if (!startResponse.ok) {
            throw new Error('Failed to start survey');
        }

        // Send first question with format instructions
        const firstQuestion = SURVEY_QUESTIONS[0];
        const formatInstructions = getFormatInstructions(firstQuestion.format, firstQuestion.options);
        
        const sendQuestion = await fetch('/api/dm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                message: \`\${firstQuestion.question}\n\${formatInstructions}\`,
                questionIndex: 0,
                format: firstQuestion.format,
                options: firstQuestion.options,
                totalQuestions: SURVEY_QUESTIONS.length
            })
        });

        if (sendQuestion.ok) {
            alert('Survey has started! Please check your Discord DMs to answer the questions.');
            errorDiv.textContent = '';
        } else {
            errorDiv.textContent = 'Failed to start survey. Please try again.';
        }
    } catch (error) {
        console.error('Error starting survey:', error);
        errorDiv.textContent = 'Failed to start survey. Please try again.';
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