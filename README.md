widget:
```html
<script src="path/to/widget.js"></script>
<script>
    const chatbot = new ChatbotWidget({
        position: 'bottom-right', // or 'bottom-left'
        primaryColor: '#007bff', // any valid CSS color
        title: 'Chat with us', // header title
        placeholder: 'Type your message...', // input placeholder
        apiUrl: 'http://localhost:5000/api/chat' // backend API URL
    });
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
| apiUrl | string | 'http://localhost:5000/api/chat' | Backend API URL for chat processing |


