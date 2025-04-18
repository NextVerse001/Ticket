require('dotenv').config();
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const chalk = require('chalk');
const express = require('express');  // Import Express
const config = require('./config.json');

// Create a new Discord client
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

const Discord = require('discord.js');
client.discord = Discord;
client.config = config;

client.commands = new Collection();

// Ensure the commands directory exists
if (!fs.existsSync('./commands')) {
  fs.mkdirSync('./commands', { recursive: true });
}

const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Ensure the events directory exists
if (!fs.existsSync('./events')) {
  fs.mkdirSync('./events', { recursive: true });
}

const eventFiles = fs
  .readdirSync('./events')
  .filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  client.on(event.name, (...args) => event.execute(...args, client));
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client, config);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

// Check for the DISCORD_TOKEN secret (must be set in Render)
if (!process.env.DISCORD_TOKEN) {
  console.error('Please set the DISCORD_TOKEN secret in the Secrets tab');
  process.exit(1);
}

// Log in to Discord using the token
client.login(process.env.DISCORD_TOKEN);

// Set up a basic Express web server to listen on the assigned Render port
const app = express();
const port = process.env.PORT || 3000;  // Default to 3000 if no port is set

app.get('/', (req, res) => {
  res.send('Your Discord bot is running!');
});

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});
