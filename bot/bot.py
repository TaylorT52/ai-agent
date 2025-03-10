import os
import discord
import logging
import asyncio
from discord.ext import commands
from dotenv import load_dotenv
from agent import MistralAgent
from user_manager import UserManager
from form_handler import FormHandler

PREFIX = "!"

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("discord")

# Load the environment variables
load_dotenv()

# Create the bot with all intents
# The message content and members intent must be enabled in the Discord Developer Portal for the bot to work.
intents = discord.Intents.all()
bot = commands.Bot(command_prefix=PREFIX, intents=intents)

# Import the Mistral agent from the agent.py file
agent = MistralAgent()

# Initialize the user manager and form handler
user_manager = UserManager()
form_handler = FormHandler(user_manager)

# Dictionary to track users with active form collection sessions
active_form_users = {}

# Get the token from the environment variables
token = os.getenv("DISCORD_TOKEN")

print("Starting bot...")

@bot.event
async def on_ready():
    """
    Called when the client is done preparing the data received from Discord.
    Prints message on terminal when bot successfully connects to discord.

    https://discordpy.readthedocs.io/en/latest/api.html#discord.on_ready
    """
    print(f"Bot is ready! Logged in as {bot.user}")
    logger.info(f"{bot.user} has connected to Discord!")


@bot.event
async def on_message(message: discord.Message):
    """
    Called when a message is sent in any channel the bot can see.

    https://discordpy.readthedocs.io/en/latest/api.html#discord.on_message
    """
    # Don't delete this line! It's necessary for the bot to process commands.
    await bot.process_commands(message)

    # Ignore messages from self or other bots to prevent infinite loops.
    if message.author.bot or message.content.startswith("!"):
        return
    
    # Check if this user has an active form collection session
    user_id = str(message.author.id)
    if user_id in active_form_users:
        # Process form response
        is_complete = await form_handler.process_response(
            user_id, 
            message.content,
            callback=lambda resp: message.author.send(resp)
        )
        
        if is_complete:
            # Form collection is complete, remove from active sessions
            del active_form_users[user_id]
        
        return

    # Process the message with the agent you wrote
    # Open up the agent.py file to customize the agent
    logger.info(f"Processing message from {message.author}: {message.content}")
    response = await agent.run(message)

    # Send the response back to the channel
    await message.reply(response)


# Commands

# This example command is here to show you how to add commands to the bot.
# Run !ping with any number of arguments to see the command in action.
# Feel free to delete this if your project will not need commands.
@bot.command(name="ping", help="Pings the bot.")
async def ping(ctx, *, arg=None):
    if arg is None:
        await ctx.send("Pong!")
    else:
        await ctx.send(f"Pong! Your argument was {arg}")

@bot.command(name="register", help="Register a new account with the bot")
async def register(ctx):
    """Register a new user account."""
    # Delete the command message for privacy
    await ctx.message.delete()
    
    user = ctx.author
    
    # Send registration instructions via DM
    try:
        await user.send("Welcome to the registration process! Please enter a password for your account:")
        
        def check(m):
            return m.author == user and isinstance(m.channel, discord.DMChannel)
        
        # Wait for password
        password_msg = await bot.wait_for('message', check=check, timeout=60.0)
        password = password_msg.content
        
        # Register the user
        success = user_manager.register_user(
            str(user.id),
            str(user),
            password
        )
        
        if success:
            await user.send("Registration successful! You can now use the bot's features.")
        else:
            await user.send("Registration failed. You might already have an account.")
            
    except asyncio.TimeoutError:
        await user.send("Registration timed out. Please try again.")
    except Exception as e:
        await user.send(f"An error occurred during registration. Please try again later.")
        logger.error(f"Registration error: {e}")

@bot.command(name="signin", help="Sign in to your existing account")
async def signin(ctx):
    """Sign in to an existing account."""
    # Delete the command message for privacy
    await ctx.message.delete()
    
    user = ctx.author
    
    # Send signin instructions via DM
    try:
        await user.send("Please enter your password to sign in:")
        
        def check(m):
            return m.author == user and isinstance(m.channel, discord.DMChannel)
        
        # Wait for password
        password_msg = await bot.wait_for('message', check=check, timeout=60.0)
        password = password_msg.content
        
        # Authenticate the user
        success = user_manager.authenticate_user(str(user.id), password)
        
        if success:
            await user.send("Sign in successful! You can now use all bot features.")
        else:
            await user.send("Sign in failed. Please check your password and try again.")
            
    except asyncio.TimeoutError:
        await user.send("Sign in timed out. Please try again.")
    except Exception as e:
        await user.send(f"An error occurred during sign in. Please try again later.")
        logger.error(f"Sign in error: {e}")

@bot.command(name="formcollect", help="Start a form collection process from an API request")
async def form_collect(ctx, form_id: str = "sample-form"):
    """Start a form collection process with the user."""
    # Try to send a direct message to the user
    user = ctx.author
    user_id = str(user.id)
    
    try:
        # Start the form collection process
        success, session_id = await form_handler.start_form_collection(
            user_id,
            form_id,
            callback=lambda resp: user.send(resp)
        )
        
        if success:
            # Add the user to active form sessions
            active_form_users[user_id] = session_id
            
            if ctx.guild:  # If this was a server command, acknowledge it
                await ctx.send(f"{user.mention}, I've sent you a DM to collect the form information.")
        else:
            await user.send(f"Failed to start form collection: {session_id}")
    
    except Exception as e:
        logger.error(f"Error starting form collection: {e}")
        await user.send("An error occurred while trying to start the form collection. Please try again later.")

@bot.command(name="api_collect", help="Start a form collection process from an API request")
async def api_collect(ctx, discord_user_id: str, form_id: str, api_key: str = None):
    """Start a form collection process with another user via API."""
    # This command should only be usable by authorized users
    if ctx.author.id != bot.owner_id and not ctx.author.guild_permissions.administrator:
        await ctx.send("You don't have permission to use this command.")
        return
    
    # In a real implementation, we would validate the API key
    
    try:
        # Find the user
        user = await bot.fetch_user(int(discord_user_id))
        if not user:
            await ctx.send(f"Could not find user with ID {discord_user_id}")
            return
        
        # Start the form collection process
        success, session_id = await form_handler.start_form_collection(
            discord_user_id,
            form_id,
            callback=lambda resp: user.send(resp)
        )
        
        if success:
            # Add the user to active form sessions
            active_form_users[discord_user_id] = session_id
            await ctx.send(f"Form collection started for user {user}")
        else:
            await ctx.send(f"Failed to start form collection: {session_id}")
    
    except Exception as e:
        logger.error(f"Error starting API form collection: {e}")
        await ctx.send(f"An error occurred: {str(e)}")

print("About to run bot...")  

# Start the bot, connecting it to the gateway
bot.run(token)