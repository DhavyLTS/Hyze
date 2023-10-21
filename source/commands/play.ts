import { createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { CommandInteraction, Guild, GuildMember } from "discord.js";
import { tGuild } from "../types";
import Text from '../utils/text';
import ytSearch from 'yt-search';
import Client from "../client";
import path from 'node:path';
import ytdl from "ytdl-core";
import fs from "node:fs";

const playlistLinkRegex = /https?:\/\/youtube\.com\/watch\?.*?&list=([A-Za-z0-9_-]+)/;
const playlistLinkRegex2 = /https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=[A-Za-z0-9_-]+/;
const videoLinkRegex = /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]+/;

export const info = {
    name: "play",
    description: "Play a song",
    options: [
        {
            type: 3,
            name: "song",
            requred: false,
            description: "The song you want to play",
        }
    ]
}
export async function execute(interaction: CommandInteraction) {

    const Guild = interaction.guild as Guild;
    const Member = interaction.member as GuildMember;
    const Options = interaction.options;

    if (!Guild) return;

    if (!Member.voice.channel)
        return interaction.reply({ content: Text.bold(":warning: You are not in a voice channel"), ephemeral: true });

    if (!Options.get("song")?.value)
        return interaction.reply({ content: Text.bold(":warning: No song provided"), ephemeral: true });

    const guild = Client.guilds[Guild.id];

    if (!guild.dispatcher.voiceConnection) guild.dispatcher.voiceConnection = joinVoiceChannel({
        adapterCreator: Guild.voiceAdapterCreator,
        channelId: Member.voice.channel.id,
        guildId: Member.guild.id
    })

    await search(guild, interaction);
    if (!guild.dispatcher.audioPlayer)
        play(guild, interaction);
}

export async function search(GUILD: tGuild, interaction: CommandInteraction) {
    let query = interaction.options.get("song")?.value as string;
    const requestedBy = interaction.member?.user.id as string;

    if (playlistLinkRegex.test(query) || playlistLinkRegex2.test(query)) {
        const listId = query.split("list=")[1].split("&")[0];
        const result = await ytSearch({ listId });

        if (result.videos.length == 0) return interaction.reply({ content: "** :warning: Playlist Not Found **", ephemeral: true });

        const videos = result.videos.map(video => {
            return {
                duration: video.duration.seconds,
                title: video.title,
                url: video.videoId,
                requestedBy,
            }
        });

        GUILD.queue.push(...videos);

        return interaction.reply({ content: '** :notes: Playlist Added: **' + Text.crave(result.title), ephemeral: true });

    }

    else if (videoLinkRegex.test(query)) {
        const videoId = query.split("v=")[1].split("&")[0];
        const video = await ytSearch({ videoId });

        if (!video.videoId) return interaction.reply({ content: "** :warning: Video Not Found **", ephemeral: true });

        GUILD.queue.push({
            duration: video.duration.seconds,
            url: video.videoId,
            title: video.title,
            requestedBy
        })

        return interaction.reply({ content: '** :notes: Video Added: **' + Text.crave(video.title), ephemeral: true });
    }

    else {

        const result = await ytSearch({ query });
        const video = result.videos[0];
        if (!video) return interaction.reply({ content: "** :warning: Video Not Found **", ephemeral: true });
        GUILD.queue.push({
            duration: video.duration.seconds,
            url: video.videoId,
            title: video.title,
            requestedBy
        })

        return interaction.reply({ content: '** :notes: Video Added: **' + Text.crave(video.title), ephemeral: true });

    }

};

export async function play(guild: tGuild, interaction: CommandInteraction) {
    let filePath = path.resolve(__dirname, '..', 'temp', interaction.guild?.id + '.mp3');
    await ytdl(guild.queue[0].url, { filter: 'audioonly' })
        .pipe(fs.createWriteStream(filePath));
    setTimeout(async () => {

        guild.dispatcher.audioPlayer = createAudioPlayer();
        guild.dispatcher.audioResource = createAudioResource(filePath);
        guild.dispatcher.audioPlayer.play(guild.dispatcher.audioResource);
        guild.dispatcher.voiceConnection?.subscribe(guild.dispatcher.audioPlayer);

        guild.dispatcher.audioPlayer.on('stateChange', (oState, nState) => {
            if (nState.status == 'idle') {
                guild.queue.shift();
                console.log(guild.queue.length)
                if (guild.queue.length > 0) {
                    play(guild, interaction);
                }
                else {
                    guild.dispatcher.audioPlayer = null;
                    guild.dispatcher.voiceConnection = null;
                    fs.unlinkSync(filePath);
                }
            }
        });

    }, 2000)

};

export async function skip(guild: tGuild, interaction: CommandInteraction) {

    if (guild.queue.length == 0 || !guild.dispatcher.voiceConnection || !guild.dispatcher.audioPlayer)
        return interaction.reply({ content: Text.bold(":warning: No song playing: "), ephemeral: true });

    guild.dispatcher.audioPlayer.stop();

    interaction.reply({ content: Text.bold(":notes: Song Skipped "), ephemeral: true });

};

export async function stop(guild: tGuild, interaction: CommandInteraction) {

    if (guild.queue.length == 0 || !guild.dispatcher.voiceConnection || !guild.dispatcher.audioPlayer)
        return interaction.reply({ content: Text.bold(":warning: No song playing: "), ephemeral: true });

    guild.queue = [];
    guild.dispatcher.audioPlayer.stop();

    interaction.reply({ content: Text.bold(":stop_button: Queue Stopped "), ephemeral: true });

};