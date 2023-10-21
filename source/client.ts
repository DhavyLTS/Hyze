import { tCommand, tCommands, tGuilds } from './types';
import Discord from 'discord.js';
import path from 'node:path';
import fs from 'node:fs'

export default class Client {

    public static bot: Discord.Client = new Discord.Client({ intents: ["GuildVoiceStates", "GuildMessages", "GuildMembers", "Guilds"] });
    public static commands: tCommands = {};
    public static guilds: tGuilds = {};

    public static Init() {

        Client.loadCommands();

        Client.bot.on('ready', Client.Ready);
        Client.bot.on('interactionCreate', Client.createInteraction);

        Client.bot.login(process.env.TOKEN);

    };

    private static Ready() {
        if (!Client.bot.user) return console.warn('Bot not found');
        console.info('Bot is ready!', Client.bot.user.username);
        const commands = Object.values(Client.commands).map((command: tCommand) => command.info);
        Client.bot.application?.commands.set(commands);
    };

    private static async loadCommands() {
        const commands = fs.readdirSync(path.resolve(__dirname, 'commands'));
        for (const command of commands) {
            const commandFile = await import('./commands/' + command);
            const { info, execute } = commandFile;
            Client.commands[info.name] = { info, execute };
        };
    };

    private static createInteraction(interaction: Discord.Interaction) {
        if (interaction.isCommand() && interaction.guild) {
            if (!Client.guilds[interaction.guild.id])
                Client.guilds[interaction.guild.id] = {
                    queue: [],
                    dispatcher: {
                        voiceConnection: null,
                        audioResource: null,
                        audioPlayer: null,
                    }
                };
            return Client.commands[interaction.commandName].execute(interaction);
        }


    };


}