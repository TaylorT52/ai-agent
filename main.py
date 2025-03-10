import threading
from app import app
from bot import discord_bot
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_flask():
    """Run the Flask app"""
    app.run(host='localhost', port=5001)

def run_discord_bot():
    """Run the Discord bot"""
    discord_bot.run()

if __name__ == '__main__':
    # Start Flask in a separate thread
    logger.info("Starting Flask app...")
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Run Discord bot in main thread
    logger.info("Starting Discord bot...")
    run_discord_bot()
