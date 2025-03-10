import os
import discord
import logging

from discord.ext import commands
from dotenv import load_dotenv
from agent import MistralAgent

PREFIX = "!"

#set up logging
logger = logging.getLogger("discord")

#load environment variables
load_dotenv()

intents = discord.Intents.all()
bot = commands.Bot(command_prefix=PREFIX, intents=intents)

agent = MistralAgent()

token = os.getenv("DISCORD_TOKEN")


@bot.event
async def on_ready():
    logger.info(f"{bot.user} has connected to Discord!")


@bot.event
async def on_message(message: discord.Message):
    await bot.process_commands(message)

    if message.author.bot or message.content.startswith("!"):
        return

    #process bot responses with agent
    logger.info(f"Processing message from {message.author}: {message.content}")
    response = await agent.run(message)

    #send response back to channel
    await message.reply(response)


#ping
@bot.command(name="ping", help="Pings the bot.")
async def ping(ctx, *, arg=None):
    if arg is None:
        await ctx.send("Pong!")
    else:
        await ctx.send(f"Pong! Your argument was {arg}")
        
#start bot
bot.run(token)
