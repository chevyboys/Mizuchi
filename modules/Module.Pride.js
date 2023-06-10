const Module = new (require("augurbot")).Module;

const fs = require('fs');
const u = require('../utils/Utils.Generic');
const Jimp = require("jimp");
const supportedFormats = ["png", "jpg", "jpeg", "bmp", "tiff", "gif"];
const snowflakes = require('../config/snowflakes.json');
const { closest } = require("fastest-levenshtein");


//get the names of all the files in storage/flags without the file name extension
const getFlagNames = () => {
  return fs.readdirSync('./storage/flags').map(file => file.trim().split('.')[0]);
}

//get the names of all the files in storage/runes without the file name extension
const getRuneNames = () => {
  return fs.readdirSync('./storage/runes').map(file => file.trim().split('.')[0]);
}

//get the names of all the folders in storage/emoji
const getEmoji = () => {
  let source = './storage/emoji';
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

const flagFile = (flagName) => {
  return `./storage/flags/${(u.smartSearchSort(getFlagNames(), flagName)[0]) || closest(flagName, getFlagNames())}.png`;
}

const getFlagFromOption = interaction => {
  if (interaction.options.get("flag").value == "Profile Picture") return interaction.member.displayAvatarURL({ size: 512, format: "png", dynamic: false });
  else return flagFile(interaction.options.get("flag").value);
}

const border = async (interaction) => {
  const member = interaction.member;
  const flag = await Jimp.read(getFlagFromOption(interaction));
  const staticURL = member.displayAvatarURL({ size: 512, format: "png", dynamic: false });
  const border = await Jimp.read("./storage/Border.png");
  const mask = await Jimp.read("./storage/mask.png");
  const avatar = await Jimp.read(staticURL);
  avatar.resize(300, 300);
  mask.resize(300, 300);
  border.resize(300, 300);
  flag.resize(300, 300);
  flag.mask(border, 0, 0);
  avatar.composite(flag, 0, 0, { mode: Jimp.BLEND_SOURCE_OVER });
  const canvas = new Jimp(300, 300, 0x00000000);
  canvas.composite(avatar, 0, 0);
  canvas.mask(mask, 0, 0);
  return await interaction.editReply({ content: `<@${interaction.member.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });
}

emoji = async (interaction) => {
  const emojiOverlay = await Jimp.read(`./storage/emoji/${(u.smartSearchSort(getEmoji(), interaction.options.get("emoji").value)[0]) || closest(interaction.options.get("emoji").value, getEmoji())}/Overlay.png`);
  const mask = await Jimp.read(`./storage/emoji/${(u.smartSearchSort(getEmoji(), interaction.options.get("emoji").value)[0]) || closest(interaction.options.get("emoji").value, getEmoji())}/Mask.png`)
  const flag = await Jimp.read(getFlagFromOption(interaction));
  emojiOverlay.resize(300, 300);
  mask.resize(300, 300);
  flag.resize(300, 300);
  flag.mask(mask, 0, 0);
  flag.composite(emojiOverlay, 0, 0, { mode: Jimp.BLEND_SOURCE_OVER });
  const canvas = new Jimp(300, 300, 0x00000000);
  canvas.composite(flag, 0, 0);
  canvas.mask(mask, 0, 0);
  canvas.resize(100, 100);
  return await interaction.editReply({ content: `<@${interaction.member.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });
}

rune = async (interaction) => {
  const rune = await Jimp.read(`./storage/runes/${(u.smartSearchSort(getRuneNames(), interaction.options.get("rune").value)[0]) || closest(interaction.options.get("rune").value, getRuneNames())}.png`);
  const flag = await Jimp.read(getFlagFromOption(interaction));
  rune.resize(300, 300);
  flag.resize(300, 300);
  flag.composite(rune, 0, 0, { mode: Jimp.BLEND_SOURCE_OVER });
  const canvas = new Jimp(300, 300, 0x00000000);
  canvas.composite(flag, 0, 0);
  return await interaction.editReply({ content: `<@${interaction.member.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });
}


const Command = {
  name: "pride",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    //call the handlers for the border sub command, the hug sub command, and the rune sub command
    let member = interaction.member;
    let subCommand = interaction.options._subcommand;
    let subCommandOptions = interaction.options._hoistedOptions;
    await interaction.deferReply();
    switch (subCommand) {
      case "border":
        return await border(interaction, subCommandOptions);
      case "emoji":
        return await emoji(interaction, subCommandOptions);
      case "rune":
        return await rune(interaction, subCommandOptions);
      default:
        break;
    }
  }
}


Module.addEvent("interactionCreate", async (interaction) => {
  if (!interaction.isAutocomplete() || interaction.commandName != Command.name) return;
  const focusedOption = interaction.options.getFocused(true);

  switch (focusedOption.name) {
    case "flag":
      let flags = u.smartSearchSort(getFlagNames(), focusedOption.value, 2, 10);
      flags.push("Profile Picture");
      await interaction.respond(flags.map(flag => ({ name: flag, value: flag })));
      break;
    case "rune":
      let runes = u.smartSearchSort(getRuneNames(), focusedOption.value, 2, 10);
      await interaction.respond(runes.map(rune => ({ name: rune, value: rune })));
      break;
    case "emoji":
      let emoji = u.smartSearchSort(getEmoji(), focusedOption.value, 2, 10);
      await interaction.respond(emoji.map(emoji => ({ name: emoji, value: emoji })));
      break;
    default:
      break;
  }

}).addInteractionCommand(Command)
module.exports = Module;









