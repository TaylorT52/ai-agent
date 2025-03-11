let currentApiKey = '';
let questions = [];
let selectedIntegrationType = null;

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
            
            // Show success message
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
        .then(() => alert('API key copied to clipboard!'))
        .catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy. Please copy manually.');
        });
}

function selectIntegrationType(type) {
    selectedIntegrationType = type;
    
    // Update UI to show selection
    document.querySelectorAll('.integration-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`.integration-option[onclick*="${type}"]`).classList.add('selected');
    
    // Update the code preview
    generateEmbedCode();
}

async function generateQuestionsFromDescription() {
    const description = document.getElementById('naturalLanguageInput').value;
    if (!description) {
        alert('Please enter a description of your survey questions.');
        return;
    }

    if (!currentApiKey) {
        alert('Please generate an API key first.');
        return;
    }

    try {
        // Log the request details
        console.log('Sending request with API key:', currentApiKey);
        
        const response = await fetch('/api/translate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`,
                'X-API-Key': currentApiKey // Adding alternative header in case server expects different format
            },
            body: JSON.stringify({ 
                description,
                api_key: currentApiKey // Including in body as well in case server expects it there
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server response:', errorData);
            throw new Error(errorData.error || `Failed to translate survey description (${response.status})`);
        }

        const data = await response.json();
        console.log('Received questions:', data);
        
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error('Invalid response format: missing questions array');
        }

        questions = data.questions;
        
        // Display generated questions
        const preview = document.getElementById('questionsPreview');
        if (preview) {
            preview.innerHTML = questions.map((q, i) => `
                <div class="question-preview">
                    <h4>Question ${i + 1}</h4>
                    <p>${q.question}</p>
                    <p><small>Format: ${q.format}</small></p>
                    ${q.options ? `<p><small>Options: ${Object.entries(q.options).map(([k, v]) => `${k}: ${v}`).join(', ')}</small></p>` : ''}
                </div>
            `).join('');
            
            document.getElementById('generatedQuestions')?.classList.remove('hidden');
        }
        generateEmbedCode();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Failed to generate questions. Please try again.');
    }
}

function useGeneratedQuestions() {
    const container = document.getElementById('questions');
    if (!container) {
        console.error('Questions container not found');
        return;
    }
    
    container.innerHTML = '';
    questions.forEach((q, i) => addQuestionToUI(q, i));
    document.getElementById('generatedQuestions')?.classList.add('hidden');
    generateEmbedCode();
}

function addQuestion() {
    const question = {
        question: '',
        format: 'text',
        options: null
    };
    questions.push(question);
    
    const container = document.getElementById('questions');
    if (!container) {
        console.error('Questions container not found');
        return;
    }
    
    addQuestionToUI(question, questions.length - 1);
    generateEmbedCode();
}

function addQuestionToUI(question, index) {
    const container = document.getElementById('questions');
    if (!container) {
        console.error('Questions container not found');
        return;
    }

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <input type="text" class="question-input" placeholder="Question text" value="${question.question}" onchange="updateQuestion(${index}, 'question', this.value)">
        <select class="format-select" onchange="updateQuestion(${index}, 'format', this.value)">
            <option value="text" ${question.format === 'text' ? 'selected' : ''}>Text</option>
            <option value="number" ${question.format === 'number' ? 'selected' : ''}>Number (1-10)</option>
            <option value="yesno" ${question.format === 'yesno' ? 'selected' : ''}>Yes/No</option>
            <option value="multiple" ${question.format === 'multiple' ? 'selected' : ''}>Multiple Choice</option>
        </select>
        <div class="options-container ${question.format === 'multiple' ? 'visible' : ''}">
            <input type="text" class="options-input" placeholder="Options (A: Option1, B: Option2, ...)" 
                   value="${question.options ? Object.entries(question.options).map(([k, v]) => `${k}: ${v}`).join(', ') : ''}"
                   onchange="updateOptions(${index}, this.value)">
        </div>
        <button class="delete-question" onclick="removeQuestion(${index})">×</button>
    `;
    container.appendChild(questionDiv);
}

function updateQuestion(index, field, value) {
    questions[index][field] = value;
    if (field === 'format') {
        const optionsDiv = document.querySelectorAll('.question-item')[index].querySelector('.options-container');
        optionsDiv.classList.toggle('visible', value === 'multiple');
        if (value !== 'multiple') {
            questions[index].options = null;
        }
    }
    generateEmbedCode();
}

function updateOptions(index, value) {
    const options = {};
    value.split(',').forEach(opt => {
        const [key, val] = opt.split(':').map(s => s.trim());
        if (key && val) {
            options[key.toUpperCase()] = val;
        }
    });
    questions[index].options = options;
    generateEmbedCode();
}

function removeQuestion(index) {
    questions.splice(index, 1);
    const container = document.getElementById('questions');
    if (!container) {
        console.error('Questions container not found');
        return;
    }
    container.innerHTML = '';
    questions.forEach((q, i) => addQuestionToUI(q, i));
    generateEmbedCode();
}

function generateEmbedCode() {
    if (!currentApiKey || !questions.length || !selectedIntegrationType) {
        document.getElementById('embedCode').textContent = 'Please generate an API key, add questions, and select an integration type.';
        return;
    }

    let code = '';
    if (selectedIntegrationType === 'discord') {
        code = generateDiscordCode();
    } else {
        code = generateWidgetCode();
    }

    document.getElementById('embedCode').textContent = code;
}

function generateDiscordCode() {
    return `// Discord Bot Integration
const config = {
    apiKey: '${currentApiKey}',
    questions: ${JSON.stringify(questions, null, 2)}
};

// 1. Add the bot to your Discord server using this link:
// https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot

// 2. Create a channel named 'webform-bot' in your server

// 3. Use this code to start a survey:
fetch('${window.location.origin}/api/dm', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${config.apiKey}\`
    },
    body: JSON.stringify({
        userId: 'DISCORD_USER_ID',
        isStart: true,
        questions: config.questions
    })
});`;
}

function generateWidgetCode() {
    return `<!-- Survey Widget Integration -->
<script src="${window.location.origin}/static/widget.js"></script>
<script>
// Configure the survey widget with natural language processing
const surveyConfig = {
    apiKey: '${currentApiKey}',
    apiUrl: '${window.location.origin}',
    questions: ${JSON.stringify(questions, null, 2)},
    useNaturalLanguage: true // Enable natural language processing
};

// Initialize the widget with enhanced conversational abilities
const widget = new SurveyWidget(surveyConfig);

// Add custom event listeners for analytics (optional)
widget.addEventListener('surveyStarted', () => {
    console.log('Survey started with natural language processing enabled');
});

widget.addEventListener('surveyCompleted', (answers) => {
    console.log('Survey completed', answers);
});
</script>`;
}

async function testSurvey() {
    if (!currentApiKey || !questions.length || !selectedIntegrationType) {
        alert('Please generate an API key, add questions, and select an integration type first.');
        return;
    }

    const testWidget = document.getElementById('testWidget');
    testWidget.classList.remove('hidden');
    testWidget.innerHTML = '';

    // Create container for both widgets
    const widgetsContainer = document.createElement('div');
    widgetsContainer.className = 'test-widgets-container';
    testWidget.appendChild(widgetsContainer);

    if (selectedIntegrationType === 'widget') {
        // Add title for widgets section
        const title = document.createElement('h3');
        title.textContent = 'Widget Previews';
        widgetsContainer.appendChild(title);

        // Create container for local widget
        const localWidgetContainer = document.createElement('div');
        localWidgetContainer.className = 'widget-container';
        const localTitle = document.createElement('h4');
        localTitle.textContent = 'Local Widget';
        localWidgetContainer.appendChild(localTitle);
        widgetsContainer.appendChild(localWidgetContainer);

        // Add local widget
        const localScript = document.createElement('script');
        localScript.textContent = `
            new SurveyWidget({
                apiKey: '${currentApiKey}',
                apiUrl: '${window.location.origin}',
                questions: ${JSON.stringify(questions)}
            });
        `;
        localWidgetContainer.appendChild(localScript);

        // Create container for external widget
        const externalWidgetContainer = document.createElement('div');
        externalWidgetContainer.className = 'widget-container';
        const externalTitle = document.createElement('h4');
        externalTitle.textContent = 'External Widget (Port 5001)';
        externalWidgetContainer.appendChild(externalTitle);
        widgetsContainer.appendChild(externalWidgetContainer);

        // Add external widget script source
        const externalScriptSrc = document.createElement('script');
        externalScriptSrc.src = 'http://127.0.0.1:5001/static/widget.js';
        externalWidgetContainer.appendChild(externalScriptSrc);

        // Add external widget initialization
        const externalScript = document.createElement('script');
        externalScript.textContent = `
            new SurveyWidget({
                apiKey: 'uboqxXeUnuP9s3CcLqi3ek_e0D3pqUS9OsACTXaASmE',
                apiUrl: 'http://127.0.0.1:5001',
                questions: ${JSON.stringify([
                    {
                        "format": "text",
                        "question": "What is your name?",
                        "validation": {
                            "allowedCharacters": "letters and spaces only"
                        }
                    },
                    {
                        "format": "text",
                        "question": "What is your email address?",
                        "validation": {
                            "email": "valid email format"
                        }
                    }
                ])}
            });
        `;
        externalWidgetContainer.appendChild(externalScript);
    } else {
        // For Discord, show instructions
        testWidget.innerHTML = `
            <div class="discord-test-instructions">
                <h3>Testing Discord Integration</h3>
                <p>To test the Discord integration:</p>
                <ol>
                    <li>Make sure the bot is added to your server</li>
                    <li>Create a channel named 'webform-bot'</li>
                    <li>Enter your Discord User ID below to start the test</li>
                </ol>
                <div class="discord-test-input">
                    <input type="text" id="discordUserId" placeholder="Enter Discord User ID">
                    <button onclick="startDiscordTest()">Start Test</button>
                </div>
            </div>
        `;
    }
}

async function startDiscordTest() {
    const userId = document.getElementById('discordUserId').value;
    if (!userId) {
        alert('Please enter your Discord User ID');
        return;
    }

    try {
        const response = await fetch('/api/dm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`
            },
            body: JSON.stringify({
                userId,
                isStart: true,
                questions
            })
        });

        if (!response.ok) {
            throw new Error('Failed to start survey');
        }

        alert('Survey started! Check your Discord DMs.');
    } catch (error) {
        console.error('Error starting survey:', error);
        alert('Failed to start survey. Please check the console for details.');
    }
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