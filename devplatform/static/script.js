let currentApiKey = '';
let questions = [];

async function generateApiKey() {
    try {
        const response = await fetch('/api/generate-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate API key');
        }

        const data = await response.json();
        // Log the response to see what we're getting
        console.log('API Key response:', data);
        
        // Check if we have the expected property
        if (!data.api_key && !data.apiKey) {
            throw new Error('Invalid response format from server');
        }
        
        currentApiKey = data.api_key || data.apiKey;
        
        const apiKey = document.getElementById('apiKey');
        if (apiKey) {
            apiKey.value = currentApiKey;
            apiKey.parentElement.classList.remove('hidden');
            console.log('API Key generated:', currentApiKey);
            document.getElementById('embedSection')?.classList.remove('hidden');
        } else {
            console.error('API key input element not found');
        }
    } catch (error) {
        console.error('Error generating API key:', error);
        alert(error.message || 'Failed to generate API key. Please try again.');
    }
}

function copyApiKey() {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        alert('Please generate an API key first');
        return;
    }
    navigator.clipboard.writeText(apiKey)
        .then(() => alert('API key copied to clipboard'))
        .catch(err => {
            console.error('Failed to copy API key:', err);
            alert('Failed to copy API key. Please try again.');
        });
}

async function generateQuestionsFromDescription() {
    const description = document.getElementById('naturalLanguageInput').value;
    if (!description) {
        alert('Please enter a survey description');
        return;
    }

    if (!currentApiKey) {
        alert('Please generate an API key first');
        return;
    }

    try {
        const response = await fetch('/api/translate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`
            },
            body: JSON.stringify({
                api_key: currentApiKey,
                description: description
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to generate questions');
        }

        const data = await response.json();
        if (!data.questions) {
            throw new Error('No questions generated');
        }

        // Store the generated questions
        questions = data.questions;

        // Show the questions preview
        const previewContainer = document.getElementById('generatedQuestions');
        const questionsPreview = document.getElementById('questionsPreview');
        
        questionsPreview.innerHTML = questions.map((q, index) => `
            <div class="question-preview">
                <strong>Q${index + 1}:</strong> ${q.question}<br>
                <em>Format: ${q.format}</em>
                ${q.options ? `<br>Options: ${q.options.join(', ')}` : ''}
            </div>
        `).join('');

        previewContainer.classList.remove('hidden');
        generateEmbedCode();

    } catch (error) {
        console.error('Error generating questions:', error);
        alert(error.message || 'Failed to generate questions. Please try again.');
    }
}

function useGeneratedQuestions() {
    if (!questions.length) {
        alert('No questions available. Please generate questions first.');
        return;
    }

    // Clear existing questions
    document.getElementById('questions').innerHTML = '';
    
    // Add each question to the UI
    questions.forEach((question, index) => {
        addQuestionToUI(question, index);
    });
    generateEmbedCode();
}

function addQuestion() {
    const index = document.querySelectorAll('.question-container').length;
    const question = {
        question: '',
        format: 'text',
        options: []
    };
    addQuestionToUI(question, index);
}

function addQuestionToUI(question, index) {
    const container = document.createElement('div');
    container.className = 'question-container';
    container.innerHTML = `
        <div class="question-header">
            <h3>Question ${index + 1}</h3>
            <button onclick="removeQuestion(${index})" class="remove-question">Remove</button>
        </div>
        <div class="question-fields">
            <input type="text" placeholder="Enter question text" value="${question.question || ''}"
                onchange="updateQuestion(${index}, 'question', this.value)">
            <select onchange="updateQuestion(${index}, 'format', this.value)">
                <option value="text" ${question.format === 'text' ? 'selected' : ''}>Text</option>
                <option value="number" ${question.format === 'number' ? 'selected' : ''}>Number (1-10)</option>
                <option value="yesno" ${question.format === 'yesno' ? 'selected' : ''}>Yes/No</option>
                <option value="multiple" ${question.format === 'multiple' ? 'selected' : ''}>Multiple Choice</option>
            </select>
            ${question.format === 'multiple' ? `
                <input type="text" placeholder="Options (comma-separated)" value="${question.options?.join(', ') || ''}"
                    onchange="updateOptions(${index}, this.value)">
            ` : ''}
        </div>
    `;
    document.getElementById('questions').appendChild(container);
    generateEmbedCode();
}

function updateQuestion(index, field, value) {
    if (!questions[index]) {
        questions[index] = {};
    }
    questions[index][field] = value;
    
    // If changing to multiple choice, add options field
    if (field === 'format' && value === 'multiple') {
        questions[index].options = questions[index].options || [];
        addQuestionToUI(questions[index], index);
    }
    generateEmbedCode();
}

function updateOptions(index, value) {
    if (!questions[index]) {
        questions[index] = { format: 'multiple' };
    }
    questions[index].options = value.split(',').map(opt => opt.trim()).filter(opt => opt);
    generateEmbedCode();
}

function removeQuestion(index) {
    questions.splice(index, 1);
    document.getElementById('questions').innerHTML = '';
    questions.forEach((q, i) => addQuestionToUI(q, i));
    generateEmbedCode();
}

async function saveQuestions() {
    if (!currentApiKey) {
        alert('Please generate an API key first');
        return;
    }

    if (!questions.length) {
        alert('Please add some questions first');
        return;
    }

    try {
        const response = await fetch('/api/save-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`
            },
            body: JSON.stringify({
                api_key: currentApiKey,
                questions: questions
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save questions');
        }

        alert('Questions saved successfully!');
        generateEmbedCode();
    } catch (error) {
        console.error('Error saving questions:', error);
        alert(error.message || 'Failed to save questions. Please try again.');
    }
}

function generateEmbedCode() {
    if (!currentApiKey || !questions.length) {
        document.getElementById('embedCode').textContent = 'Please generate an API key and add questions.';
        document.getElementById('previewWidget').innerHTML = '';
        return;
    }

    const generatedCode = generateDiscordCode();
    document.getElementById('embedCode').textContent = generatedCode;
    
    // Update the preview widget with the actual widget
    const previewWidget = document.getElementById('previewWidget');
    previewWidget.innerHTML = generatedCode;

    // Initialize the preview widget
    const previewUserId = document.getElementById('discord-user-id');
    if (previewUserId) {
        previewUserId.value = 'PREVIEW_USER_ID';
    }
}

function generateDiscordCode() {
    return `<div style="display: flex; gap: 20px; margin-top: 30px;">
    <!-- Discord Survey Widget -->
    <div id="discord-survey" style="flex: 1;">
        <style>
            .discord-survey {
                max-width: 400px;
                padding: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin: 0 auto;
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
        </style>
        <div class="discord-survey">
            <h3>Discord Survey</h3>
            <p>Enter your Discord User ID to receive the survey:</p>
            <input type="text" id="discord-user-id" placeholder="Discord User ID">
            <button onclick="startSurvey()">Start Survey</button>
            <div id="survey-error" class="error"></div>
            <div id="survey-success" class="success"></div>
        </div>
    </div>
</div>

<script>
    async function startSurvey() {
        const userId = document.getElementById('discord-user-id').value;
        const errorDiv = document.getElementById('survey-error');
        const successDiv = document.getElementById('survey-success');

        if (!userId) {
            errorDiv.textContent = 'Please enter your Discord User ID';
            successDiv.textContent = '';
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:3001/api/dm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    message: 'Starting survey...',
                    isStart: true,
                    questions: ${JSON.stringify(questions)}
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to start survey');
            }

            errorDiv.textContent = '';
            successDiv.textContent = 'Survey started! Please check your Discord DMs.';
            document.getElementById('discord-user-id').value = '';
        } catch (error) {
            console.error('Error starting survey:', error);
            errorDiv.textContent = error.message || 'Failed to start survey. Please try again.';
            successDiv.textContent = '';
        }
    }
</script>`;
}

function copyEmbedCode() {
    const code = document.getElementById('embedCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy code:', err);
        alert('Failed to copy code. Please copy it manually.');
    });
} 