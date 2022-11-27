const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const { BaseMessageComponent, MessageButton, MessageActionRow } = require("discord.js");
const snowflakes = require('../config/snowflakes.json');
let config = require("../config/config.json");


let memeLinks = [
  "https://cdn.discordapp.com/attachments/697869453605601352/877448909289570334/23.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/872373056788647956/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/866100984644370452/Screenshot_2021-07-17_4.35.15_PM.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/866085686922182666/image0.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/865359106893283348/SPOILER_image0.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/864500694340861972/image0.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/863472979698778132/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/863203443429998592/oCzVSchIsDKEfiXzdBtTl9fN8_NACy9OkearlnDQ1ms2.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/862880074101293116/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/862590524119973939/Screenshot_2021-07-08_123030.png",
  "https://i.imgflip.com/5frirx.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/879162753451958333/image0.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/881772517772124160/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/882118059983249408/Untitled-1.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/885528399232254002/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/856364802817261578/152124081788493360.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/856363710990123038/152124081788493360.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/856362031242149918/152124081788493360.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/856360044438356009/152124081788493360.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/831172147559792730/55biha.png",
  "https://cdn.discordapp.com/attachments/677347543750934528/911528031137443881/Jin_slide_aabbb.gif",
  "https://cdn.discordapp.com/attachments/697869453605601352/880556213589389402/Confused_Math_Corin.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/933133090249908234/Iceberg_26122021104304.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/931422425919389756/received_269847078157064.jpeg",
  "https://cdn.discordapp.com/attachments/697869453605601352/924898168607494165/SPOILER_aged_like_fine_wine.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/924771025160384572/Polish_20211226_1406251742.jpg",
  "https://media.discordapp.net/attachments/824862207270977557/920717254377762866/ezgif.com-gif-maker_24.gif",
  "https://cdn.discordapp.com/attachments/697869453605601352/911964611476094986/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/911473470045564928/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/909373921323782164/unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/908126909366419456/SPOILER_unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/908094210622783569/SPOILER_unknown.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/907482456813350952/SOUBREAD2.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/903140346840633394/5s3ft3.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/901271050338320394/ZomboMeme_23102021061857.jpg",
  "https://cdn.discordapp.com/attachments/697869453605601352/898826116255608842/Jin_nosee.png",
  "https://cdn.discordapp.com/attachments/697869453605601352/895890645699407962/zgni7pn5l9u512.png",
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

      let Mod = interaction.guild.roles.cache.get(snowflakes.roles.Moderator).members.filter(m => !interaction.guild.roles.cache.get(snowflakes.roles.Admin).members.has(m.id)).map(m => m.displayName).sort().join("\n");

      let Admin = interaction.guild.roles.cache.get(snowflakes.roles.Admin).members.map(m => m.displayName).sort().join("\n");

      let whisperRole = (interaction.guild.roles.cache.get(snowflakes.roles.Moderator));

      let color = whisperRole.hexColor;

      let embed = u.embed().setTitle("Current Climbers Court Staff Members:").setDescription(`<@&${snowflakes.roles.Admin}>:` + "```" + Admin + "```\n\n" + `<@&${snowflakes.roles.Moderator}>:` + "```" + Mod + "```\n\n" + `<@&${snowflakes.roles.CommunityGuide}>:` + "```" + SW + "```\n\n\n\n").addFields([{ name: "Join our staff:", value: config.staffApplicationLink ? config.staffApplicationLink : "```No Staff Application link is available at this time```" }]).setColor(color);

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
            disabled: true,
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
