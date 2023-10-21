import { CommandInteraction, Guild } from "discord.js"
import Client from "../client";
import { skip } from "./play";

export const info = {
    name: "skip",
    description: "Skip the current song",
}

export const execute = async (interaction: CommandInteraction) => {

    const guild = interaction.guild as Guild;
    if (!guild) return;

    const GUILD = Client.guilds[guild.id];

    if (!GUILD.dispatcher.voiceConnection || !GUILD.dispatcher.audioPlayer || GUILD.queue.length == 0)
        return interaction.reply({ content: "** :warning: No song playing **", ephemeral: true });

    skip(GUILD, interaction);

}