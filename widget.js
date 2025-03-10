class ChatbotWidget {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'bottom-right',
            primaryColor: options.primaryColor || '#007bff',
            title: options.title || 'Chat with us',
            placeholder: options.placeholder || 'Type your message...',
            ...options
        };
        
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createStyles();
        this.createWidget();
        this.attachEventListeners();
    }

    createStyles() {
        const styles = `
            .chatbot-widget {
                position: fixed;
                z-index: 9999;
                max-height: 600px;
                width: 350px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                transition: all 0.3s ease;
                opacity: 0;
                pointer-events: none;
            }
            
            .chatbot-widget.open {
                opacity: 1;
                pointer-events: all;
                transform: translateY(0);
            }
            
            .chatbot-widget.bottom-right {
                bottom: 100px;
                right: 20px;
                transform: translateY(20px);
            }
            
            .chatbot-widget.bottom-left {
                bottom: 100px;
                left: 20px;
                transform: translateY(20px);
            }
            
            .chatbot-toggle {
                position: fixed;
                bottom: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--primary-color);
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .chatbot-toggle:hover {
                transform: scale(1.1);
            }
            
            .chatbot-toggle.bottom-right {
                right: 20px;
            }
            
            .chatbot-toggle.bottom-left {
                left: 20px;
            }
            
            .chatbot-header {
                padding: 20px;
                background: var(--primary-color);
                color: white;
                border-radius: 10px 10px 0 0;
                font-weight: bold;
            }
            
            .chatbot-messages {
                height: 400px;
                overflow-y: auto;
                padding: 20px;
            }
            
            .message {
                margin-bottom: 15px;
                display: flex;
                align-items: flex-start;
            }
            
            .message.user {
                flex-direction: row-reverse;
            }
            
            .message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 15px;
                background: #f0f0f0;
                margin: 0 10px;
            }
            
            .message.user .message-content {
                background: var(--primary-color);
                color: white;
            }
            
            .chatbot-input {
                padding: 20px;
                border-top: 1px solid #eee;
            }
            
            .chatbot-input form {
                display: flex;
                gap: 10px;
            }
            
            .chatbot-input input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                outline: none;
            }
            
            .chatbot-input button {
                padding: 10px 20px;
                background: var(--primary-color);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            
            .chatbot-input button:hover {
                opacity: 0.9;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    createWidget() {
        //toggle button
        this.toggleButton = document.createElement('div');
        this.toggleButton.className = `chatbot-toggle ${this.options.position}`;
        this.toggleButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        
        //widget container
        this.widget = document.createElement('div');
        this.widget.className = `chatbot-widget ${this.options.position}`;
        
        //widget content
        this.widget.innerHTML = `
            <div class="chatbot-header">${this.options.title}</div>
            <div class="chatbot-messages"></div>
            <div class="chatbot-input">
                <form>
                    <input type="text" placeholder="${this.options.placeholder}">
                    <button type="submit">Send</button>
                </form>
            </div>
        `;
        
        document.documentElement.style.setProperty('--primary-color', this.options.primaryColor);
        
        document.body.appendChild(this.toggleButton);
        document.body.appendChild(this.widget);
        
        this.messagesContainer = this.widget.querySelector('.chatbot-messages');
        this.form = this.widget.querySelector('form');
        this.input = this.widget.querySelector('input');
    }

    attachEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggle());
        
        //handle message submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = this.input.value.trim();
            if (message) {
                this.addMessage(message, 'user');
                this.input.value = '';
                
                //API CALL HERE
                setTimeout(() => {
                    this.addMessage('Thank you for your message! This is a demo response.', 'bot');
                }, 1000);
            }
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.widget.classList.toggle('open');
        if (this.isOpen) {
            this.input.focus();
        }
    }

    addMessage(content, type) {
        const message = {
            content,
            type,
            timestamp: new Date()
        };
        
        this.messages.push(message);
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotWidget;
} else {
    window.ChatbotWidget = ChatbotWidget;
}
