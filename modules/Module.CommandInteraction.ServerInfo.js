const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const { MessageButton, MessageActionRow } = require("discord.js");
const snowflakes = require('../config/snowflakes.json');
let config = require("../config/config.json");


let memeLinks = [
  "https://wydds.cc/important.mp4",
  "https://i.imgflip.com/5frirx.jpg",
  "https://www.youtube.com/watch?v=bxqLsrlakK8",
  "https://www.youtube.com/watch?v=k4h6WK0D4O8",
  "https://www.youtube.com/watch?v=kCXzb1BGRrs"
]


const Module = new Augur.Module()
  .addInteractionCommand({
    name: "staff",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      await interaction.deferReply?.({ ephemeral: false });
      let SW = interaction.guild.roles.cache.get(snowflakes.roles.CommunityGuide).members.filter(m => !interaction.guild.roles.cache.get(snowflakes.roles.Admin).members.has(m.id)).filter(m => !interaction.guild.roles.cache.get(snowflakes.roles.Moderator).members.has(m.id)).map(m => m.displayName).sort().join("\n");

      let Mod = (await interaction.guild.roles.fetch(snowflakes.roles.Moderator)).members.map(m => m.displayName).join("\n");

      let Admin = (await interaction.guild.roles.fetch(snowflakes.roles.Admin)).members.map(m => m.displayName).join("\n");

      let botMasters = (await interaction.guild.roles.fetch(snowflakes.roles.BotMaster)).members.map(m => m.displayName).join("\n");

      let BotAssistants = (await interaction.guild.roles.fetch(snowflakes.roles.BotAssistant)).members.map(m => m.displayName).join("\n");

      let whisperRole = (interaction.guild.roles.cache.get(snowflakes.roles.Moderator));

      let color = whisperRole.hexColor;

      let embed = u.embed()
        .setTitle("Current " + interaction.guild.name + " Staff Members:")
        .setDescription(
          `<@&${snowflakes.roles.Admin}>:`
          + "```" + Admin + "```\n\n"
          + `<@&${snowflakes.roles.Moderator}>:`
          + "```" + Mod + "```\n\n"
          + `<@&${snowflakes.roles.CommunityGuide}>:`
          + "```" + SW + "```\n\n"
          + `<@&${snowflakes.roles.BotMaster}>:`
          + "```" + botMasters + "```\n\n"
          + `<@&${snowflakes.roles.BotAssistant}>:`
          + "```" + BotAssistants + "```\n\n"
          + "\n\n")
        .addFields([
          {
            name: "Join our staff:",
            value: config.staffApplicationLink ? config.staffApplicationLink : "```No Staff Application link is available at this time```"
          }
        ])
        .setColor(color);

      interaction.editReply({ embeds: [embed] });
    }

  })
  .addInteractionCommand({
    name: "repo",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      let components = new MessageActionRow()
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "View My Code",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Request a feature",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/issues/new/choose"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Report a bug",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/issues/new/choose"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "See Current Projects",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/projects/1"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Support the Developers",
            style: "LINK",
            url: "https://www.patreon.com/GhostBotCode"
          }));

      await interaction.reply({ content: "**__Helpful Links__**", components: [components], ephemeral: false });
    }

  })
  .addInteractionCommand({
    name: "links",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      let components = new MessageActionRow()
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Author's Blog",
            style: "LINK",
            url: "https://andrewkrowe.wordpress.com/"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Wiki",
            style: "LINK",
            url: "https://andrewkrowe.wordpress.com/"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Perfect Stranger Discord Server",
            style: "LINK",
            url: "https://discord.gg/VMmtJsRNZ2"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Code",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Adorable Cockatrices",
            style: "LINK",
            url: memeLinks[Math.floor(Math.random() * memeLinks.length)]
          }));

      await interaction.reply({ content: "**__Cool things to check out:__**", components: [components], ephemeral: false });
    }

  })
  .addInteractionCommand({
    name: "tone",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      let toneTags = ['/cb = clickbait', '/cp = copypasta', '/f = fake', '/gen or /g = genuine', '/hj = half-joking', '/hyp = hyperbole', '/ij = inside joke', '/j = joking', '/l or /ly = lyrics', '/lh = light-hearted', '/li = literally', '/lu = a little upset', '/m = metaphorically', '/neg or /nc = negative connotation', '/neu = neutral connotation', '/nm = not mad', '/nsrs = non-serious', '/p = platonic', '/pc = positive connotation', '/r = romantic', '/rh or /rt = rhetorical question', '/s = sarcastic', '/srs = serious', '/t = teasing', '/vent = venting']
      await interaction.reply({ content: "**__Tone Tags:__**\n" + toneTags.join("\n"), ephemeral: false });
    }

  })

module.exports = Module;
