import fetch from 'node-fetch';

async function callMistralAPI(prompt) {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
            model: 'mistral-tiny',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 200
        })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Response generation functions
export async function generateWelcomeMessage(question, totalQuestions) {
    const prompt = `Act as a friendly survey bot. Generate a welcoming message to start a survey. The first question is: "${question}". Make it sound natural and conversational. Keep it concise (max 2 sentences).`;
    return await callMistralAPI(prompt);
}

export async function generateInvalidFormatMessage(question, format, options = null, validationResult) {
    const { error, details } = validationResult;
    const issues = details.issues.join(', ').toLowerCase();
    
    const prompt = `Act as a friendly survey bot. The user provided an invalid response "${details.provided}" to the question: "${question}".
The response should be ${details.expected}. The specific issues are: ${issues}.
Generate a friendly and helpful message explaining what was wrong and how to fix it. Keep it natural, encouraging, and concise (max 2 sentences).`;
    
    return await callMistralAPI(prompt);
}

export async function generateNextQuestionMessage(previousQuestion, previousAnswer, nextQuestion) {
    const prompt = `Act as a friendly survey bot. The user just answered "${previousAnswer}" to the question "${previousQuestion}". Now I need to ask them: "${nextQuestion}". Generate a natural transition that acknowledges their previous answer and leads to the new question. Keep it concise (max 2 sentences).`;
    return await callMistralAPI(prompt);
}

export async function generateCompletionMessage(answers) {
    const prompt = `Act as a friendly survey bot. The user just completed a survey with ${answers.length} questions. Generate a friendly completion message thanking them for their time. Keep it concise and warm (max 2 sentences).`;
    return await callMistralAPI(prompt);
}

export function getFormatInstructions(format, options = null, questionText = '') {
    // Keep format instructions minimal and only when necessary
    if (format === 'text' || questionText.includes('name')) {
        return '';
    }

    if (questionText.includes('email')) {
        return '(like example@domain.com)';
    }

    switch (format) {
        case 'number':
            return '(1-10)';
        case 'yesno':
            return '(yes/no)';
        case 'multiple':
            if (options) {
                return `Options: ${Object.values(options).join(', ')}`;
            }
            return '';
        default:
            return '';
    }
} 