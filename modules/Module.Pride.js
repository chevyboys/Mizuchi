const Module = new (require("augurbot")).Module;

const fs = require('fs');
const u = require('../utils/Utils.Generic');
const Jimp = require("jimp");
const supportedFormats = ["png", "jpg", "jpeg", "bmp", "tiff", "gif"];
const snowflakes = require('../config/snowflakes.json');
const { closest } = require("fastest-levenshtein");

async function bilateralSmoothing(image) {
  const width = image.getWidth();
  const height = image.getHeight();
  const halfDiameter = 3; // Set the desired half diameter value for smoothing

  // Create a temporary image for storing smoothed pixels
  const buffer = new Jimp(width, height);

  function calculateWeight(distance, intensityDifference, intensitySigma, spatialSigma) {
    const spatialWeight = Math.exp(-(distance * distance) / (2 * spatialSigma * spatialSigma));
    const intensityWeight = Math.exp(-(intensityDifference * intensityDifference) / (2 * intensitySigma * intensitySigma));
    return spatialWeight * intensityWeight;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rAccumulator = 0;
      let gAccumulator = 0;
      let bAccumulator = 0;
      let weightAccumulator = 0;

      for (let dy = -halfDiameter; dy <= halfDiameter; dy++) {
        const yPos = y + dy;
        if (yPos < 0 || yPos >= height) continue;

        for (let dx = -halfDiameter; dx <= halfDiameter; dx++) {
          const xPos = x + dx;
          if (xPos < 0 || xPos >= width) continue;

          const intensityDifference = Math.sqrt(
            Math.pow(image.getPixelColor(xPos, yPos) & 0xff - image.getPixelColor(x, y) & 0xff, 2) +
            Math.pow((image.getPixelColor(xPos, yPos) >> 8) & 0xff - (image.getPixelColor(x, y) >> 8) & 0xff, 2) +
            Math.pow((image.getPixelColor(xPos, yPos) >> 16) & 0xff - (image.getPixelColor(x, y) >> 16) & 0xff, 2)
          );
          const distance = Math.sqrt(dx * dx + dy * dy);
          const weight = calculateWeight(distance, intensityDifference, 50, 25); // Set the desired sigma values for intensity and spatial smoothing

          rAccumulator += (image.getPixelColor(xPos, yPos) & 0xff) * weight;
          gAccumulator += ((image.getPixelColor(xPos, yPos) >> 8) & 0xff) * weight;
          bAccumulator += ((image.getPixelColor(xPos, yPos) >> 16) & 0xff) * weight;
          weightAccumulator += weight;
        }
      }

      const pixelColor = Jimp.rgbaToInt(
        Math.round(rAccumulator / weightAccumulator),
        Math.round(gAccumulator / weightAccumulator),
        Math.round(bAccumulator / weightAccumulator),
        image.getPixelColor(x, y) & 0xff
      );
      buffer.setPixelColor(pixelColor, x, y);
    }
  }

  return buffer;
}

function createMaskFromTransparentImage(image) {


  // Create a new image with the same dimensions
  const mask = new Jimp(image.getWidth(), image.getHeight());

  // Iterate over each pixel in the image
  image.scan(0, 0, image.getWidth(), image.getHeight(), (x, y, idx) => {
    // Get the RGBA values of the current pixel
    const alpha = image.bitmap.data[idx + 3];

    // Determine the color for the current pixel in the mask
    const maskColor = alpha === 0 ? 0x000000ff : 0xffffffff;

    // Set the color in the mask image
    mask.setPixelColor(maskColor, x, y);
  });


  return mask;
}



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

const getSword = () => {
  let source = './storage/sword';
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

const emoji = async (interaction) => {
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

const rune = async (interaction) => {
  const rune = await Jimp.read(`./storage/runes/${(u.smartSearchSort(getRuneNames(), interaction.options.get("rune").value)[0]) || closest(interaction.options.get("rune").value, getRuneNames())}.png`);
  const flag = await Jimp.read(getFlagFromOption(interaction));
  rune.resize(300, 300);
  flag.resize(300, 300);
  flag.composite(rune, 0, 0, { mode: Jimp.BLEND_SOURCE_OVER });
  const canvas = new Jimp(300, 300, 0x00000000);
  canvas.composite(flag, 0, 0);
  return await interaction.editReply({ content: `<@${interaction.member.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });
}

const sword = async (interaction) => {
  const maskBlur = 5;

  //Get images
  const flag1 = (await Jimp.read(getFlagFromOption(interaction)));
  flag1.rotate(90);
  flag1.resize(600, 300);
  flag1.color([{ apply: 'saturate', params: [20 + 0.5 * interaction.options.get("intensity").value || 40] }]);
  flag1.color([{ apply: 'darken', params: [20] }]);
  flag1;
  const flag2 = flag1.clone().flip(true, false);
  const saekes1 = await Jimp.read(`./storage/sword/${(u.smartSearchSort(getSword(), interaction.options.get("sword").value)[0]) || closest(interaction.options.get("sword").value, getEmoji())}/Base1.png`);
  const saekes2 = await Jimp.read(`./storage/sword/${(u.smartSearchSort(getSword(), interaction.options.get("sword").value)[0]) || closest(interaction.options.get("sword").value, getEmoji())}/Base2.png`);
  const saekes3 = await Jimp.read(`./storage/sword/${(u.smartSearchSort(getSword(), interaction.options.get("sword").value)[0]) || closest(interaction.options.get("sword").value, getEmoji())}/Base3.png`);
  const saekes4 = await Jimp.read(`./storage/sword/${(u.smartSearchSort(getSword(), interaction.options.get("sword").value)[0]) || closest(interaction.options.get("sword").value, getEmoji())}/Base4.png`);

  const saekes1Mask = createMaskFromTransparentImage(saekes1);
  const saekes2Mask = createMaskFromTransparentImage(saekes2);
  const saekes3Mask = createMaskFromTransparentImage(saekes3);
  const saekes4Mask = createMaskFromTransparentImage(saekes4);

  //resize everything
  saekes1.resize(300, 300);
  saekes2.resize(300, 300);
  saekes3.resize(300, 300);
  saekes4.resize(300, 300);
  saekes1Mask.resize(300, 300);
  saekes2Mask.resize(300, 300);
  saekes3Mask.resize(300, 300);
  saekes4Mask.resize(300, 300);

  //assemble canvases
  const maskCanvas = new Jimp(1200, 300, 0x00000000);
  maskCanvas.composite(saekes1Mask, 0, 0);
  maskCanvas.composite(saekes2Mask, 300, 0);
  maskCanvas.composite(saekes3Mask, 600, 0);
  maskCanvas.composite(saekes4Mask, 900, 0);
  maskCanvas.blur(maskBlur);

  const flagCanvas = new Jimp(1200, 300, 0x00000000);
  flagCanvas.composite(flag1, 0, 0);
  flagCanvas.composite(flag2, 600, 0);
  flagCanvas.blur(40);
  flagCanvas.opacity((interaction.options.get("intensity").value + 50) / 100 || 0.7);

  //create the canvas and composite the images onto it
  const canvas = new Jimp(1200, 300, 0x00000000);
  canvas.blit(saekes1, 0, 0);
  canvas.blit(saekes2, 300, 0);
  canvas.blit(saekes3, 600, 0);
  canvas.blit(saekes4, 900, 0);

  //Combine canvases
  canvas.composite(flagCanvas, 0, 0, { mode: Jimp.BLEND_OVERLAY });
  canvas.mask(maskCanvas, 0, 0);

  canvas.rotate(90);

  /*return await interaction.editReply({ content: `<@${interaction.member.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });
  ///**/


  await interaction.editReply({ content: `<@${interaction.member.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });
  //await interaction.followUp({ content: `<@${interaction.member.id}> created:`, files: [await maskCanvas.getBufferAsync(Jimp.MIME_PNG)] });/**/
  //await interaction.followUp({ content: `<@${interaction.member.id}> created:`, files: [await flagCanvas.getBufferAsync(Jimp.MIME_PNG)] });/**/
  return;
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
      case "sword":
        return await sword(interaction, subCommandOptions);
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
    case "sword":
      let sword = u.smartSearchSort(getSword(), focusedOption.value, 2, 10);
      await interaction.respond(sword.map(sword => ({ name: sword, value: sword })));
      break;
    default:
      break;
  }

})
if (new Date().getMonth() == 5)
  Module.addInteractionCommand(Command);
module.exports = Module;









