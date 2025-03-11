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
        
        // Create typing indicator
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'typing-indicator';
        this.typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        this.typingIndicator.style.display = 'none';
        this.body.appendChild(this.typingIndicator);
        
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

    async addMessage(content, type) {
        if (type === 'bot') {
            // Show typing indicator
            this.typingIndicator.style.display = 'inline-block';
            this.body.scrollTop = this.body.scrollHeight;
            
            // Simulate typing delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
            
            // Hide typing indicator
            this.typingIndicator.style.display = 'none';
        }
        
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
    width: 380px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
}

.widget-header {
    background: #5865F2;
    color: white;
    padding: 16px 20px;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.widget-body {
    padding: 20px;
    height: 380px;
    overflow-y: auto;
    background: #F8F9FD;
    scroll-behavior: smooth;
}

.widget-input {
    display: flex;
    padding: 16px;
    background: white;
    border-top: 1px solid #E8E9EC;
    gap: 12px;
}

.widget-input input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #E8E9EC;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
    outline: none;
}

.widget-input input:focus {
    border-color: #5865F2;
    box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.1);
}

.widget-input button {
    background: #5865F2;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: background-color 0.2s;
}

.widget-input button:hover {
    background: #4752C4;
}

.message {
    margin-bottom: 16px;
    max-width: 85%;
    font-size: 14px;
    line-height: 1.5;
    position: relative;
    clear: both;
}

.user-message {
    background: #5865F2;
    color: white;
    padding: 12px 16px;
    border-radius: 12px 12px 0 12px;
    float: right;
    word-wrap: break-word;
}

.bot-message {
    background: white;
    color: #2C2F33;
    padding: 12px 16px;
    border-radius: 12px 12px 12px 0;
    float: left;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    word-wrap: break-word;
}

/* Custom scrollbar for webkit browsers */
.widget-body::-webkit-scrollbar {
    width: 8px;
}

.widget-body::-webkit-scrollbar-track {
    background: transparent;
}

.widget-body::-webkit-scrollbar-thumb {
    background: #E8E9EC;
    border-radius: 4px;
}

.widget-body::-webkit-scrollbar-thumb:hover {
    background: #D4D6DC;
}

/* Message animations */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message {
    animation: slideIn 0.3s ease forwards;
}

/* Typing indicator */
.typing-indicator {
    padding: 12px 16px;
    background: white;
    border-radius: 12px 12px 12px 0;
    display: inline-block;
    margin-bottom: 16px;
    position: relative;
    animation: slideIn 0.3s ease forwards;
}

.typing-indicator span {
    height: 8px;
    width: 8px;
    background: #5865F2;
    display: inline-block;
    border-radius: 50%;
    margin-right: 5px;
    animation: bounce 1.3s linear infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.3s; }

@keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Export widget
window.SurveyWidget = SurveyWidget; 