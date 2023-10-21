import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice"
import discord from 'discord.js';

export type tGuild = {
    queue: {
        requestedBy: string,
        duration: number,
        title: string,
        url: string,
    }[],
    dispatcher: {
        voiceConnection: VoiceConnection | null,
        audioResource: AudioResource | null,
        audioPlayer: AudioPlayer | null,
    }
}

export type tGuilds = { [key: string]: tGuild }

export type tCommand = {
    info: discord.ApplicationCommandDataResolvable;
    execute: (interaction: discord.CommandInteraction) => void;
}

export type tCommands = { [key: string]: tCommand; }