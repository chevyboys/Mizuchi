const { GuildMember } = require('discord.js');
const sharp = require('sharp');
const axios = require('axios');

hexToRgb = (hex) => {
  const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const result = hexRegex.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Manipulates an image by applying a color tint and layering.
 *
 * @async
 * @param {Object} options - The options for the image manipulation.
 * @param {string} options.folderName - The name of the folder where the image layers are stored.
 * @param {GuildMember} options.member - The member object, which contains user information.
 * @param {string} options.hexColor - The hex color to tint the image with.
 * @returns {Promise<Buffer>} A promise that resolves with the manipulated image as a Buffer.
 */
async function manipulateImage({ folderName, member, hexColor }) {
  const animated = member.avatar ? member.avatar?.startsWith('a_') : member.user.avatar?.startsWith('a_');;
  const backgroundLayerPath = `./storage/pristine/${folderName.trim()}/background.png`;
  const lineLayerPath = `./storage/pristine/${folderName.trim()}/line.png`;
  //get the profile picture as a gif if they have an animated avatar, otherwise get it as a png
  const backgroundLayer = sharp(backgroundLayerPath).resize(256, 256);

  //create a new image that is the color of the role and has the alpha layer of the background
  const colorLayer = (sharp({
    create: {
      width: 256,
      height: 256,
      channels: 3,
      background: hexToRgb(hexColor)
    }
  }).composite([{ input: await backgroundLayer.toBuffer(), blend: "dest-in" }])).png();


  const lineLayer = sharp(lineLayerPath).resize(256, 256);
  const profilePicture = await axios.get(member.displayAvatarURL({ format: animated ? "gif" : "png" }), { responseType: "arraybuffer" })
    .then((res) => { return res.data })
    .then((data) => { return sharp(data, { animated: animated ? animated : undefined }).resize(256, 256) }
    );



  const layeredImage = await profilePicture.composite([ //composite the profile picture with the background and line layers
    { input: await colorLayer.toBuffer(), tile: true, gravity: 'northeast' },
    { input: await lineLayer.toBuffer(), tile: true, gravity: 'northwest' }
  ]);
  console.log(hexColor)
  console.log(animated)
  //layeredImage.clone().gif().toFile(`./storage/pristine/${folderName.trim()}/test.gif`);
  //return the image as either a png or a gif
  return await (animated ? layeredImage.gif().toBuffer() : layeredImage.gif().toBuffer());
}


module.exports = manipulateImage;