# Embeddable Chatbot Widget

Customizable chatbot widget that can be easily embedded into any website.

## Installation

1. Download the `widget.js` file and include it in your project:

```html
<script src="path/to/widget.js"></script>
```

2. Initialize the widget with your desired options:

```javascript
const chatbot = new ChatbotWidget({
    position: 'bottom-right', // or 'bottom-left'
    primaryColor: '#007bff', // any valid CSS color
    title: 'Chat with us', // header title
    placeholder: 'Type your message...' // input placeholder
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
