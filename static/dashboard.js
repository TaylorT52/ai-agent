// Function to load variables from the server
async function loadVariables() {
    try {
        console.log('Fetching variables from server...');
        const response = await fetch('/api/forms');
        console.log('Server response:', response);
        const forms = await response.json();
        console.log('Loaded forms:', forms);
        displayVariables(forms);
    } catch (error) {
        console.error('Error loading variables:', error);
        alert('Error loading variables. Please try again.');
    }
}

// Function to display variables in the list
function displayVariables(forms) {
    const variableList = document.getElementById('variableList');
    if (!variableList) {
        console.error('Variable list element not found!');
        return;
    }
    
    variableList.innerHTML = '';
    
    if (forms.length === 0) {
        variableList.innerHTML = '<p>No forms configured yet. Create one using the Natural Language tab or add variables manually.</p>';
        return;
    }
    
    forms.forEach(form => {
        const variableItem = document.createElement('div');
        variableItem.className = 'variable-item';
        variableItem.innerHTML = `
            <h3>${form.name}</h3>
            <p>${form.description || 'No description'}</p>
            <p>Created: ${new Date(form.created_at).toLocaleDateString()}</p>
            <p>Submissions: ${form.submissions}</p>
            <button onclick="viewForm(${form.id})">View</button>
            <button onclick="deleteForm(${form.id})">Delete</button>
        `;
        variableList.appendChild(variableItem);
    });
}

// Function to delete a form
async function deleteForm(id) {
    if (!confirm(`Are you sure you want to delete this form?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/forms/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Reload variables
            loadVariables();
        } else {
            console.error('Error deleting form');
            alert('Error deleting form. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while deleting the form. Please try again.');
    }
}

// Function to view a form's details
function viewForm(id) {
    alert(`Viewing form ${id} - This feature is under development.`);
    // In a real implementation, this would show a modal with form details
}

// Function to add a new variable (manual configuration)
async function addVariable(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        prompt: document.getElementById('prompt').value,
        validation: {
            type: document.getElementById('type').value,
            max_length: document.getElementById('max_length').value || null,
            required: document.getElementById('required').checked
        }
    };

    try {
        const response = await fetch('/api/collect/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // Clear form
            document.getElementById('variableForm').reset();
            // Reload variables
            loadVariables();
        } else {
            console.error('Error adding variable');
            alert('Error adding variable. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the variable. Please try again.');
    }
}

// Function to generate form structure from description
async function generateFormFromDescription() {
    const description = document.getElementById('formDescription').value;
    if (!description) {
        alert('Please enter a description of your form requirements');
        return;
    }

    try {
        const response = await fetch('/api/generate-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description })
        });

        if (response.ok) {
            const interpretation = await response.json();
            displayFormPreview(interpretation);
        } else {
            console.error('Error generating form structure');
            alert('Error generating form structure. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the form structure. Please try again.');
    }
}

// Function to display the AI's interpretation of the form requirements
function displayFormPreview(interpretation) {
    const previewElement = document.getElementById('formPreview');
    if (!previewElement) {
        console.error('Form preview element not found!');
        return;
    }

    let html = '<h3>AI Interpretation</h3>';
    html += '<p>Here\'s how the AI will collect this information:</p>';
    html += '<ul>';
    
    interpretation.fields.forEach(field => {
        html += `<li><strong>${field.name}</strong>: ${field.prompt} <em>(${field.type}${field.required ? ', required' : ''})</em></li>`;
    });
    
    html += '</ul>';
    html += '<p>The AI will validate responses and follow up if any information is incorrect or incomplete.</p>';
    html += '<button onclick="saveFormStructure()">Save This Form</button>';
    
    previewElement.innerHTML = html;
    
    // Store the interpretation for later use
    window.currentInterpretation = interpretation;
}

// Function to save the generated form structure
async function saveFormStructure() {
    if (!window.currentInterpretation) {
        alert('Please generate a form structure first');
        return;
    }

    const formName = prompt('Enter a name for this form:');
    if (!formName) return;

    const formData = {
        name: formName,
        description: document.getElementById('formDescription').value,
        structure: window.currentInterpretation
    };

    try {
        const response = await fetch('/api/forms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Form saved successfully!');
            // Switch to the manual config tab to show the saved form
            const evt = { currentTarget: document.querySelector('.tab-button:nth-child(2)') };
            openTab(evt, 'manualConfig');
            // Reload variables
            loadVariables();
        } else {
            console.error('Error saving form');
            alert('Error saving form. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while saving the form. Please try again.');
    }
}

// Function to regenerate API key
async function generateApiKey() {
    try {
        const response = await fetch('/api/regenerate-api-key', {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            currentApiKey = data.api_key;
            document.getElementById('apiKeyValue').textContent = currentApiKey;
        } else {
            console.error('Error generating API key');
            alert('Error generating API key. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the API key. Please try again.');
    }
}

// Function to copy API key to clipboard
function copyApiKey() {
    const apiKeyValue = document.getElementById('apiKeyValue').textContent;
    if (apiKeyValue && apiKeyValue !== '••••••••••••••••••••••••••') {
        navigator.clipboard.writeText(apiKeyValue)
            .then(() => alert('API key copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    } else {
        alert('Please generate an API key first');
    }
}

// Function to switch between tabs
function openTab(evt, tabName) {
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
    }

    const tabPanels = document.getElementsByClassName('tab-panel');
    for (let i = 0; i < tabPanels.length; i++) {
        tabPanels[i].className = tabPanels[i].className.replace(' active', '');
    }

    document.getElementById(tabName).className += ' active';
    evt.currentTarget.className += ' active';
    
    if (tabName === 'manualConfig') {
        loadVariables();
    }
}

// Function to start collection
async function startCollection() {
    console.log('Start collection button clicked');
    const userId = document.getElementById('discordUserId').value.trim();
    const discordUserIdError = document.getElementById('discordUserIdError');
    discordUserIdError.style.display = 'none';

    if (!userId) {
        discordUserIdError.textContent = 'Please enter your Discord User ID';
        discordUserIdError.style.display = 'block';
        return;
    }

    // Basic validation for Discord User ID (should be a number)
    if (!/^\d+$/.test(userId)) {
        discordUserIdError.textContent = 'Discord User ID should only contain numbers';
        discordUserIdError.style.display = 'block';
        return;
    }

    try {
        console.log('Sending start collection request...');
        const response = await fetch('/api/collect/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId })
        });
        console.log('Server response:', response);

        if (response.ok) {
            const result = await response.json();
            console.log('Collection started successfully:', result);
            alert('Collection started! Check your Discord DMs for the bot\'s message.');
        } else {
            const error = await response.json();
            console.error('Server error:', error);
            alert(`Error: ${error.message || 'Failed to start collection. Please try again.'}`);
        }
    } catch (error) {
        console.error('Error starting collection:', error);
        alert('An error occurred while starting the collection. Please try again.');
    }
}

// Add event listeners when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, setting up event listeners...');
    
    // Load initial variables
    loadVariables();

    // Add form submission handler
    const form = document.getElementById('variableForm');
    if (form) {
        console.log('Found variable form, adding submit listener');
        form.addEventListener('submit', addVariable);
    } else {
        console.error('Variable form not found!');
    }

    // Add start collection button handler
    const startButton = document.getElementById('startCollection');
    if (startButton) {
        console.log('Found start collection button, adding click listener');
        startButton.addEventListener('click', startCollection);
    } else {
        console.error('Start collection button not found!');
    }
    
    // Initialize API key display
    fetch('/api/regenerate-api-key', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.api_key) {
                currentApiKey = data.api_key;
                document.getElementById('apiKeyValue').textContent = currentApiKey;
            }
        })
        .catch(error => console.error('Error initializing API key:', error));
});

// Initialize global variables
let currentApiKey = '';
window.currentInterpretation = null;

// Get references to elements
const formDescription = document.getElementById('form-description');
const generateButton = document.getElementById('generate-form');
const previewContainer = document.getElementById('preview-container');
const apiKeyDisplay = document.getElementById('api-key');
const regenerateKeyButton = document.getElementById('regenerate-key');
const copyKeyButton = document.getElementById('copy-key');
const saveFormButton = document.getElementById('save-form');
const formNameInput = document.getElementById('form-name');
const myFormsContainer = document.getElementById('my-forms-container');
    
// Check if we have API key in local storage
let apiKey = localStorage.getItem('apiKey');
if (apiKey) {
    apiKeyDisplay.textContent = apiKey;
} else {
    // Fetch API key from server
    fetchApiKey();
}
    
// Load the user's forms
loadForms();
    
// Form fields generated from the description
let generatedFields = [];
    
// Event listeners
generateButton.addEventListener('click', generateForm);
regenerateKeyButton.addEventListener('click', regenerateApiKey);
copyKeyButton.addEventListener('click', copyApiKey);
saveFormButton.addEventListener('click', saveForm);
    
// Generate a form from the description
async function generateForm() {
    const description = formDescription.value.trim();
    if (!description) {
        showToast('Please enter a form description', 'error');
        return;
    }
        
    try {
        // Show loading state
        generateButton.disabled = true;
        generateButton.textContent = 'Generating...';
            
        const response = await fetch('/api/generate-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ description })
        });
            
        const data = await response.json();
            
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate form');
        }
            
        // Store the generated fields
        generatedFields = data.fields;
            
        // Render the preview
        renderFormPreview(generatedFields);
            
        // Show success message
        showToast('Form generated successfully', 'success');
            
    } catch (error) {
        console.error('Error generating form:', error);
        showToast(error.message, 'error');
    } finally {
        // Reset button state
        generateButton.disabled = false;
        generateButton.textContent = 'Generate Form';
    }
}
    
// Render the form preview
function renderFormPreview(fields) {
    // Clear previous preview
    previewContainer.innerHTML = '';
        
    if (!fields || fields.length === 0) {
        previewContainer.innerHTML = '<p class="text-center">No fields generated</p>';
        return;
    }
        
    // Create preview elements
    const previewTitle = document.createElement('h4');
    previewTitle.textContent = 'Form Preview';
    previewTitle.className = 'mb-3';
    previewContainer.appendChild(previewTitle);
        
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'form-preview-fields';
        
    fields.forEach(field => {
        const fieldCard = document.createElement('div');
        fieldCard.className = 'card mb-3 shadow-sm';
            
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
            
        const prompt = document.createElement('h5');
        prompt.className = 'card-title';
        prompt.textContent = field.prompt;
            
        const details = document.createElement('p');
        details.className = 'card-text text-muted';
        details.innerHTML = `
            <small>
                <strong>Name:</strong> ${field.name}<br>
                <strong>Type:</strong> ${field.type}<br>
                <strong>Required:</strong> ${field.required ? 'Yes' : 'No'}
            </small>
        `;
            
        // If it's a choice field, show the options
        if (field.type === 'choice' && field.options) {
            const options = document.createElement('div');
            options.className = 'mt-2';
            options.innerHTML = '<strong>Options:</strong><br>';
                
            field.options.forEach(option => {
                const optionEl = document.createElement('span');
                optionEl.className = 'badge bg-light text-dark me-2';
                optionEl.textContent = option;
                options.appendChild(optionEl);
            });
                
            cardBody.appendChild(prompt);
            cardBody.appendChild(details);
            cardBody.appendChild(options);
        } else {
            cardBody.appendChild(prompt);
            cardBody.appendChild(details);
        }
            
        fieldCard.appendChild(cardBody);
        fieldsContainer.appendChild(fieldCard);
    });
        
    previewContainer.appendChild(fieldsContainer);
        
    // Show the form save section
    document.getElementById('save-form-section').classList.remove('d-none');
}
    
// Save the form to the server
async function saveForm() {
    const formName = formNameInput.value.trim();
        
    if (!formName) {
        showToast('Please enter a form name', 'error');
        return;
    }
        
    if (!generatedFields || generatedFields.length === 0) {
        showToast('No form fields to save. Please generate a form first.', 'error');
        return;
    }
        
    try {
        // Show loading state
        saveFormButton.disabled = true;
        saveFormButton.textContent = 'Saving...';
            
        const response = await fetch('/api/forms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                name: formName,
                description: formDescription.value.trim(),
                structure: JSON.stringify(generatedFields)
            })
        });
            
        const data = await response.json();
            
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save form');
        }
            
        // Show success message
        showToast('Form saved successfully', 'success');
            
        // Reset form fields
        formNameInput.value = '';
        formDescription.value = '';
        previewContainer.innerHTML = '';
        generatedFields = [];
            
        // Hide the form save section
        document.getElementById('save-form-section').classList.add('d-none');
            
        // Reload forms
        loadForms();
            
    } catch (error) {
        console.error('Error saving form:', error);
        showToast(error.message, 'error');
    } finally {
        // Reset button state
        saveFormButton.disabled = false;
        saveFormButton.textContent = 'Save Form';
    }
}
    
// Fetch API key from server
async function fetchApiKey() {
    try {
        const response = await fetch('/api/regenerate-api-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
            
        const data = await response.json();
            
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch API key');
        }
            
        // Set API key
        apiKey = data.api_key;
        apiKeyDisplay.textContent = apiKey;
            
        // Store API key in local storage
        localStorage.setItem('apiKey', apiKey);
            
    } catch (error) {
        console.error('Error fetching API key:', error);
        showToast(error.message, 'error');
    }
}
    
// Regenerate API key
async function regenerateApiKey() {
    if (!confirm('Are you sure you want to regenerate your API key? This will invalidate your current key.')) {
        return;
    }
        
    try {
        // Show loading state
        regenerateKeyButton.disabled = true;
            
        const response = await fetch('/api/regenerate-api-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
            
        const data = await response.json();
            
        if (!response.ok) {
            throw new Error(data.error || 'Failed to regenerate API key');
        }
            
        // Set API key
        apiKey = data.api_key;
        apiKeyDisplay.textContent = apiKey;
            
        // Store API key in local storage
        localStorage.setItem('apiKey', apiKey);
            
        // Show success message
        showToast('API key regenerated successfully', 'success');
            
    } catch (error) {
        console.error('Error regenerating API key:', error);
        showToast(error.message, 'error');
    } finally {
        // Reset button state
        regenerateKeyButton.disabled = false;
    }
}
    
// Copy API key to clipboard
function copyApiKey() {
    const key = apiKeyDisplay.textContent;
        
    if (!key) {
        showToast('No API key to copy', 'error');
        return;
    }
        
    // Copy to clipboard
    navigator.clipboard.writeText(key)
        .then(() => {
            showToast('API key copied to clipboard', 'success');
        })
        .catch(err => {
            console.error('Error copying API key:', err);
            showToast('Failed to copy API key', 'error');
        });
}
    
// Load forms from server
async function loadForms() {
    try {
        const response = await fetch('/api/forms', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
            
        const forms = await response.json();
            
        if (!response.ok) {
            throw new Error(forms.error || 'Failed to load forms');
        }
            
        renderForms(forms);
            
    } catch (error) {
        console.error('Error loading forms:', error);
        myFormsContainer.innerHTML = `<p class="text-center text-muted">Error loading forms: ${error.message}</p>`;
    }
}
    
// Render forms list
function renderForms(forms) {
    myFormsContainer.innerHTML = '';
        
    if (!forms || forms.length === 0) {
        myFormsContainer.innerHTML = '<p class="text-center text-muted">No forms created yet</p>';
        return;
    }
        
    const formsList = document.createElement('div');
    formsList.className = 'list-group';
        
    forms.forEach(form => {
        const formItem = document.createElement('a');
        formItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        formItem.href = '#';
        formItem.onclick = (e) => {
            e.preventDefault();
            showFormDetails(form.id);
        };
            
        const formInfo = document.createElement('div');
        formInfo.innerHTML = `
            <h5 class="mb-1">${form.name}</h5>
            <p class="mb-1">${form.description || 'No description'}</p>
            <small>Created: ${new Date(form.created_at).toLocaleDateString()}</small>
        `;
            
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary rounded-pill';
        badge.textContent = `${form.submissions} responses`;
            
        formItem.appendChild(formInfo);
        formItem.appendChild(badge);
        formsList.appendChild(formItem);
    });
        
    myFormsContainer.appendChild(formsList);
}
    
// Show form details (to be implemented)
function showFormDetails(formId) {
    // This would show a modal with form details and integration options
    console.log('Show form details for ID:', formId);
        
    // For now, just show an alert
    alert(`Form details for ID: ${formId} - This would open a modal showing the form structure and integration code`); 
}
    
// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
        
    if (!toastContainer) {
        // Create toast container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
        
    const toastId = `toast-${Date.now()}`;
        
    // Create toast element
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
        
    document.getElementById('toast-container').innerHTML += toastHTML;
        
    // Initialize and show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
        
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
}
