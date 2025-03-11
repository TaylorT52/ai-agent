# Sample Website with Discord Survey Integration

This is a sample website that demonstrates how to integrate the Discord Survey Widget into a real website. The site is designed as a gaming community platform with a built-in survey feature.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the sample site server:
   ```bash
   npm start
   ```

3. Make sure your Discord bot server is running on port 5000
4. Visit http://localhost:3000 in your browser

## Integrating the Survey Widget

1. Go to the Discord Survey Platform (http://localhost:5000)
2. Create your survey:
   - Generate an API key
   - Add your questions
   - Select response format
   - Save your questions
3. Copy the generated embed code
4. Open `index.html`
5. Locate the survey container in the survey section:
   ```html
   <div class="survey-container">
       <!-- Replace with your Discord Survey Widget embed code -->
   </div>
   ```
6. Paste your embed code in place of any existing content

## How It Works

1. The sample site runs on port 3000 and serves the static files
2. API requests to `/api/send-dm` are proxied to the Discord bot server (port 5000)
3. This avoids CORS issues and allows the survey widget to work properly

## Testing the Integration

1. Make sure both servers are running:
   - Discord bot server on port 5000
   - Sample site server on port 3000
2. Open http://localhost:3000 in your browser
3. Navigate to the Survey section
4. Enter a Discord User ID
5. Click "Start Survey"
6. Verify that the questions are sent to the specified Discord user

## Structure

- `server.js` - Express server for serving the site and proxying API requests
- `index.html` - Main website structure
- `style.css` - Website styling
- `package.json` - Project dependencies

## Notes

- The sample site is responsive and works on mobile devices
- The survey widget inherits the site's styling while maintaining its functionality
- Make sure to test the integration thoroughly before deploying to production

## Troubleshooting

If the survey widget isn't working:
1. Check that both servers are running:
   - `npm start` in the sample site directory
   - Discord bot server on port 5000
2. Check the browser console for error messages
3. Verify that your API key is valid
4. Make sure the Discord bot is properly configured and online 