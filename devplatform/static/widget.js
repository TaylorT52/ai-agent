class SurveyWidget {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = config.apiUrl;
        this.questions = config.questions;
        this.currentQuestion = 0;
        this.answers = [];
        this.useNaturalLanguage = config.useNaturalLanguage || false;
        this.eventListeners = new Map();
        this.createWidget();
    }

    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    dispatchEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }

    createWidget() {
        // Create widget container
        this.widget = document.createElement('div');
        this.widget.className = 'survey-widget';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'widget-header';
        header.textContent = 'Survey';
        header.onclick = () => this.toggleWidget();
        
        // Create body
        this.body = document.createElement('div');
        this.body.className = 'widget-body';
        
        // Create input area
        this.inputArea = document.createElement('div');
        this.inputArea.className = 'widget-input';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your answer...';
        
        const button = document.createElement('button');
        button.textContent = 'Send';
        button.onclick = () => this.handleResponse(input.value);
        
        this.inputArea.appendChild(input);
        this.inputArea.appendChild(button);
        
        // Assemble widget
        this.widget.appendChild(header);
        this.widget.appendChild(this.body);
        this.widget.appendChild(this.inputArea);
        
        // Add to page
        document.body.appendChild(this.widget);
        
        // Start survey
        this.startSurvey();
    }

    async startSurvey() {
        try {
            const welcomeMessage = await this.generateMessage('welcome', {
                question: this.questions[0].question,
                totalQuestions: this.questions.length
            });
            this.addMessage(welcomeMessage, 'bot');
            this.dispatchEvent('surveyStarted', {
                totalQuestions: this.questions.length,
                firstQuestion: this.questions[0].question
            });
        } catch (error) {
            console.error('Error starting survey:', error);
            this.addMessage('An error occurred while starting the survey. Please try again.', 'bot');
        }
    }

    async handleResponse(response) {
        if (!response.trim()) return;
        
        // Clear input
        const input = this.inputArea.querySelector('input');
        input.value = '';
        
        // Show user's response
        this.addMessage(response, 'user');

        const currentQuestion = this.questions[this.currentQuestion];
        const validationResult = this.validateResponse(response, currentQuestion);
        
        if (!validationResult.isValid) {
            try {
                const errorMessage = await this.generateMessage('error', {
                    question: currentQuestion.question,
                    format: currentQuestion.format,
                    options: currentQuestion.options,
                    validationResult
                });
                this.addMessage(errorMessage, 'bot');
                this.dispatchEvent('validationError', {
                    question: currentQuestion,
                    error: validationResult
                });
            } catch (error) {
                console.error('Error generating error message:', error);
                this.addMessage(validationResult.error, 'bot');
            }
            return;
        }
        
        // Store answer
        const answer = {
            question: currentQuestion.question,
            answer: response,
            format: currentQuestion.format,
            timestamp: new Date().toISOString()
        };
        this.answers.push(answer);
        this.dispatchEvent('questionAnswered', {
            questionIndex: this.currentQuestion,
            answer
        });
        
        // Move to next question
        this.currentQuestion++;
        
        try {
            if (this.currentQuestion >= this.questions.length) {
                // Survey complete
                const completionMessage = await this.generateMessage('completion', {
                    answers: this.answers
                });
                this.addMessage(completionMessage, 'bot');
                this.inputArea.style.display = 'none';
                this.dispatchEvent('surveyCompleted', {
                    answers: this.answers,
                    duration: Date.now() - this.startTime
                });
            } else {
                // Next question
                const nextQuestion = this.questions[this.currentQuestion];
                const nextMessage = await this.generateMessage('next', {
                    previousQuestion: currentQuestion.question,
                    previousAnswer: response,
                    nextQuestion: nextQuestion.question,
                    remainingQuestions: this.questions.length - this.currentQuestion
                });
                this.addMessage(nextMessage, 'bot');
                this.dispatchEvent('nextQuestion', {
                    previousQuestion: currentQuestion,
                    nextQuestion,
                    progress: (this.currentQuestion / this.questions.length) * 100
                });
            }
        } catch (error) {
            console.error('Error generating message:', error);
            this.addMessage('An error occurred. Please try again.', 'bot');
        }
    }

    validateResponse(response, question) {
        response = response.trim();
        
        if (question.question.toLowerCase().includes('email')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(response)) {
                return {
                    isValid: false,
                    error: 'Invalid email format',
                    details: {
                        provided: response,
                        expected: 'An email address like user@example.com',
                        issues: ['Invalid email format']
                    }
                };
            }
        }

        if (question.question.toLowerCase().includes('name')) {
            if (!/^[a-zA-Z\s'-]+$/.test(response)) {
                return {
                    isValid: false,
                    error: 'Invalid name format',
                    details: {
                        provided: response,
                        expected: 'A name using letters only',
                        issues: ['Invalid characters in name']
                    }
                };
            }
        }

        switch (question.format) {
            case 'number':
                const num = parseInt(response);
                if (isNaN(num) || num < 1 || num > 10) {
                    return {
                        isValid: false,
                        error: 'Invalid number',
                        details: {
                            provided: response,
                            expected: 'A number between 1 and 10',
                            issues: ['Number out of range or invalid']
                        }
                    };
                }
                break;
            case 'yesno':
                if (!['yes', 'no'].includes(response.toLowerCase())) {
                    return {
                        isValid: false,
                        error: 'Invalid yes/no response',
                        details: {
                            provided: response,
                            expected: '"yes" or "no"',
                            issues: ['Response must be yes or no']
                        }
                    };
                }
                break;
            case 'multiple':
                if (!question.options || !Object.keys(question.options).includes(response.toUpperCase())) {
                    return {
                        isValid: false,
                        error: 'Invalid option',
                        details: {
                            provided: response,
                            expected: `One of: ${Object.keys(question.options).join(', ')}`,
                            issues: ['Selected option not in available choices']
                        }
                    };
                }
                break;
        }
        
        return { isValid: true };
    }

    async generateMessage(type, data) {
        try {
            const response = await fetch(`${this.apiUrl}/api/generate-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    type,
                    data,
                    useAI: true // Flag to indicate we want to use Mistral API
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to generate message: ${response.status}`);
            }
            
            const result = await response.json();
            return result.message;
        } catch (error) {
            console.error('Error generating message:', error);
            // Enhanced fallback messages that are more conversational
            switch (type) {
                case 'welcome':
                    return `Hi there! 👋 I'm here to help you with a quick survey. We'll start with ${data.question} There are ${data.totalQuestions} questions in total, and it should only take a few minutes.`;
                case 'error':
                    const { error, details } = data.validationResult;
                    return `I couldn't quite understand that response. ${error} Could you please provide ${details.expected}?`;
                case 'next':
                    return `Thanks for that! Now, I'd like to ask you ${data.nextQuestion}`;
                case 'completion':
                    return `Thank you so much for taking the time to complete this survey! Your responses have been recorded. Have a great day! 😊`;
                default:
                    return `I apologize, but I'm having trouble processing that. Could you please try again?`;
            }
        }
    }

    addMessage(content, type) {
        const message = document.createElement('div');
        message.className = `message ${type}-message`;
        message.textContent = content;
        this.body.appendChild(message);
        this.body.scrollTop = this.body.scrollHeight;
    }

    toggleWidget() {
        this.body.style.display = this.body.style.display === 'none' ? 'block' : 'none';
        this.inputArea.style.display = this.body.style.display;
    }
}

// Add widget styles
const styles = `
.survey-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}

.widget-header {
    background: #007bff;
    color: white;
    padding: 15px;
    font-weight: bold;
    cursor: pointer;
}

.widget-body {
    padding: 15px;
    max-height: 400px;
    overflow-y: auto;
}

.widget-input {
    display: flex;
    padding: 10px;
    border-top: 1px solid #eee;
}

.widget-input input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 10px;
}

.widget-input button {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}

.message {
    margin-bottom: 10px;
    padding: 8px 12px;
    border-radius: 15px;
    max-width: 80%;
}

.user-message {
    background: #007bff;
    color: white;
    margin-left: auto;
}

.bot-message {
    background: #f1f1f1;
    color: #333;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Export widget
window.SurveyWidget = SurveyWidget; 