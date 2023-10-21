import { CommandInteraction, Guild } from "discord.js"
import Client from "../client";
import { stop } from "./play";

export const info = {
    name: "stop",
    description: "Stop entire queue",
}

export const execute = async (interaction: CommandInteraction) => {

    const guild = interaction.guild as Guild;
    if (!guild) return;

    const GUILD = Client.guilds[guild.id];

    if (!GUILD.dispatcher.voiceConnection || !GUILD.dispatcher.audioPlayer || GUILD.queue.length == 0)
        return interaction.reply({ content: "** :warning: No song playing **", ephemeral: true });

    stop(GUILD, interaction);

}