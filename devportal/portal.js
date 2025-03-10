// Add question button click handler
document.querySelector('button[type="button"]').addEventListener('click', function() {
    const container = document.getElementById('questionsContainer');
    const questionCount = container.children.length + 1;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    questionDiv.innerHTML = `
        <h3>Question ${questionCount}</h3>
        <input type="text" name="question${questionCount}" placeholder="Enter your question">
        <select name="format${questionCount}" class="format-select">
            <option value="">Select data format</option>
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="phone">Phone Number</option>
            <option value="date">Date</option>
            <option value="number">Number</option>
            <option value="url">URL</option>
        </select>
        <div class="format-options" id="formatOptions${questionCount}">
            <label>
                <input type="checkbox" name="required${questionCount}"> Required field
            </label>
            <label>
                <input type="checkbox" name="validate${questionCount}"> Validate format
            </label>
        </div>
    `;
    
    container.appendChild(questionDiv);
    
    // Add event listener for the new format select
    const newSelect = questionDiv.querySelector('.format-select');
    newSelect.addEventListener('change', function() {
        const options = this.nextElementSibling;
        options.classList.toggle('show', this.value !== '');
    });
});

// Show format options when format is selected
document.querySelectorAll('.format-select').forEach(select => {
    select.addEventListener('change', function() {
        const options = this.nextElementSibling;
        options.classList.toggle('show', this.value !== '');
    });
});

function generateCode() {
    const form = document.getElementById('chatbotConfig');
    const formData = new FormData(form);
    const questions = [];
    
    // Collect questions and formats
    const questionContainers = document.querySelectorAll('.question-container');
    for (let i = 1; i <= questionContainers.length; i++) {
        const question = formData.get(`question${i}`);
        const format = formData.get(`format${i}`);
        const required = formData.get(`required${i}`) === 'on';
        const validate = formData.get(`validate${i}`) === 'on';
        
        if (question && format) {
            questions.push({
                question,
                format,
                required,
                validate
            });
        }
    }

    // Generate the code
    const config = {
        position: formData.get('position'),
        primaryColor: formData.get('primaryColor'),
        title: formData.get('botName'),
        placeholder: 'Type your message...',
        questions: questions
    };

    const codeLines = [
        '// Configuration for your chatbot',
        'const config = ' + JSON.stringify(config, null, 4) + ';'
    ];

    const codePreview = document.getElementById('codePreview');
    codePreview.textContent = codeLines.join('\n');
}

function copyCode() {
    const codeElement = document.getElementById('codePreview');
    const textArea = document.createElement('textarea');
    textArea.value = codeElement.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Code copied to clipboard!');
}

// Generate code when form is submitted
document.getElementById('chatbotConfig').addEventListener('submit', function(e) {
    e.preventDefault();
    generateCode();
});

// Initialize format options for existing questions
document.querySelectorAll('.format-select').forEach(select => {
    const options = select.nextElementSibling;
    options.classList.toggle('show', select.value !== '');
});