class DiscordWidgetData {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.options = {
            pollInterval: options.pollInterval || 5000,
            containerSelector: options.containerSelector || '#discord-data',
            baseUrl: options.baseUrl || '',
            onNewData: options.onNewData || null
        };
        
        this.init();
    }

    init() {
        // Create container if it doesn't exist
        if (!document.querySelector(this.options.containerSelector)) {
            const container = document.createElement('div');
            container.id = this.options.containerSelector.replace('#', '');
            document.body.appendChild(container);
        }

        // Start polling
        this.startPolling();
    }

    async fetchData() {
        try {
            const response = await fetch(`${this.options.baseUrl}/api/completed-surveys`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.displayData(data.data);
                if (this.options.onNewData) {
                    this.options.onNewData(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching Discord data:', error);
        }
    }

    displayData(surveys) {
        const container = document.querySelector(this.options.containerSelector);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '20px';

        // Add header
        const header = table.createTHead();
        const headerRow = header.insertRow();
        ['User ID', 'Questions', 'Answers', 'Completed At'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.padding = '8px';
            th.style.borderBottom = '2px solid #ddd';
            th.style.textAlign = 'left';
            headerRow.appendChild(th);
        });

        // Add data
        const tbody = table.createTBody();
        surveys.forEach(survey => {
            const row = tbody.insertRow();
            
            // User ID
            const userCell = row.insertCell();
            userCell.textContent = survey.userId;
            userCell.style.padding = '8px';
            userCell.style.borderBottom = '1px solid #ddd';

            // Questions
            const questionsCell = row.insertCell();
            questionsCell.textContent = survey.questions.map(q => q.question).join(', ');
            questionsCell.style.padding = '8px';
            questionsCell.style.borderBottom = '1px solid #ddd';

            // Answers
            const answersCell = row.insertCell();
            answersCell.textContent = survey.answers.map(a => a.answer).join(', ');
            answersCell.style.padding = '8px';
            answersCell.style.borderBottom = '1px solid #ddd';

            // Completed At
            const timeCell = row.insertCell();
            timeCell.textContent = new Date(survey.completedAt).toLocaleString();
            timeCell.style.padding = '8px';
            timeCell.style.borderBottom = '1px solid #ddd';
        });

        container.appendChild(table);
    }

    startPolling() {
        this.fetchData();
        setInterval(() => this.fetchData(), this.options.pollInterval);
    }
}

// Auto-initialize if API key is provided in URL or data attribute
document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('apiKey') || document.querySelector('[data-discord-api-key]')?.dataset.discordApiKey;

    if (apiKey) {
        window.discordData = new DiscordWidgetData(apiKey);
    }
}); 