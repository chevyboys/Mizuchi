/* eslint-disable no-useless-escape */
const Augur = require("augurbot"),
  u = require('../utils/Utils.Generic'),
  Jimp = require("jimp");
const { MessageAttachment, Collection } = require("discord.js");
const { MessageActionRow, MessageButton } = require("discord.js");
const snowflakes = require('../config/snowflakes.json');

const supportedFormats = ["png", "jpg", "jpeg", "bmp", "tiff", "gif"];

async function popart(msg, initialTransform) {
  try {
    let original;
    let content = msg.cleanContent.split(" ");
    content.shift();
    let suffix = content.join(" ");
    let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
    let match = urlexp.exec(suffix);
    let img;

    if (msg.attachments.size > 0) {
      original = msg.attachments.first().url;
    } else if (match) {
      original = match[1];
    } else {
      original = (await u.getMention(msg, true) || msg.member).displayAvatarURL({ size: 256, format: "png" });
    }

    if (!supportedFormats.some(format => original.indexOf("." + format) > -1)) {
      msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
      return null;
    }

    img = await Jimp.read(original);

    const canvas = new Jimp(536, 536, 0xffffffff);

    img.resize(256, 256);

    img.color(initialTransform);
    canvas.blit(img, 8, 272);

    img.color([{ apply: "spin", params: [60] }]);
    canvas.blit(img, 272, 8);

    img.color([{ apply: "spin", params: [60] }]);
    canvas.blit(img, 272, 272);

    img.color([{ apply: "spin", params: [120] }]);
    canvas.blit(img, 8, 8);

    return canvas;
  } catch (error) { u.errorHandler(error, msg); }
}

async function composite(msg, suffix, compositeType, overrideImage) {
  try {
    let target;
    let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
    let match = urlexp.exec(suffix)
    let attachment;
    if (msg.attachments.size > 0) {
      attachment = msg.attachments.first().url;
    } else return msg.reply("You need to attach an image")
    if (match) {
      target = match[1];
    } else {
      target = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
    }
    if (overrideImage) attachment = overrideImage;
    try {
      let av = await Jimp.read(target);
      let attachmentImage = await Jimp.read(attachment);
      av.resize(512, 512)
      attachmentImage.scaleToFit(512, Jimp.AUTO, Jimp.RESIZE_BEZIER)
      av.composite(attachmentImage, 0, 0, {
        mode: compositeType || Jimp.BLEND_MULTIPLY

      })
      await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await av.getBufferAsync(Jimp.MIME_PNG)] });
    } catch (error) {
      msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
    }
  } catch (e) { u.errorHandler(e, msg); }

}



const Module = new Augur.Module()
  .addCommand({
    name: "andywarhol",
    description: "'Andy Warhol' an avatar or attached image",
    category: "Silly",
    process: async (msg) => {
      try {
        const canvas = await popart(msg, [{ apply: "spin", params: [60] }]);
        if (canvas) await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_JPEG)] });
      } catch (e) { u.errorHandler(e, msg); }

    }
  })
  .addCommand({
    name: "pfp",
    description: "Get a user's avatar",
    syntax: "[@user]",
    category: "Members",
    process: async (msg) => {
      try {
        let user, member;
        if (msg.guild) member = (await u.getMention(msg)) || msg.member;
        user = (member ? member.user : (msg.mentions.users.first() || msg.author));
        let name = (member ? member.displayName : user.username);
        let embed = u.embed()
          .setAuthor(name)
          .setDescription(u.escapeText(name) + "'s Avatar")
          .setImage(msg.member.displayAvatarURL({ size: 512, dynamic: true }));
        msg.channel.send({ content: `<@${msg.author.id}> created:`, embeds: [embed] });
      } catch (error) { u.errorHandler(error, msg); }
    },
  })
  .addCommand({
    name: "blurple",
    description: "Blurple an Avatar",
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let target;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix)
        if (msg.attachments.size > 0) {
          target = msg.attachments.first().url;
        } else if (match) {
          target = match[1];
        } else {
          target = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
        }

        try {
          let av = await Jimp.read(target);
          av.color([
            { apply: "desaturate", params: [100] },
            { apply: "saturate", params: [63.64] }, // { apply: "saturate", params: [47.7] },
            { apply: "hue", params: [235] }         // { apply: "hue", params: [227] }
          ]);

          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await av.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }

      } catch (e) { u.errorHandler(e, msg); }
    }
  })
  .addCommand({
    name: "colorme",
    description: "Colorize an avatar or attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let color;
        let original;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix);

        if (msg.attachments.size > 0) {
          original = msg.attachments.first().url;
          color = parseInt(suffix.replace(/<@!?\d+>/g, ""), 10);
        } else if (match) {
          original = match[1];
          color = parseInt(match[2], 10);
        } else if ((color = parseInt(suffix, 10)) && suffix.split(" ").length == 1) {
          original = msg.author.displayAvatarURL({ size: 512, format: "png" });
        } else {
          original = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
          color = parseInt(suffix.replace(/<@!?\d+>/g, ""), 10);
        }

        color = color || (10 * (Math.floor(Math.random() * 35) + 1));

        try {
          let image = await Jimp.read(original);
          image.color([
            { apply: "hue", params: [color] }
          ]);
          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await image.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }

      } catch (e) { u.errorHandler(e, msg); }
    }
  })
  .addCommand({
    name: "flex",
    description: "Show it off.",
    category: "Silly",
    process: async (msg) => {
      try {
        const arm = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Emoji_u1f4aa.svg/128px-Emoji_u1f4aa.svg.png";
        const target = await u.getMention(msg, false) || msg.author;
        const staticURL = target.displayAvatarURL({ size: 128, dynamic: false, format: "png" }) || target.avatarURL({ size: 128, dynamic: false, format: "png" });

        const right = (await Jimp.read(arm)).flip(true, false);
        const mask = await Jimp.read("./storage/mask.png");
        const avatar = await Jimp.read(staticURL);
        const canvas = new Jimp(368, 128, 0x00000000);
        //send mask.png as a reply
        //maskReply = new MessageAttachment(await mask.getBufferAsync(Jimp.MIME_PNG), "mask.png");
        //await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [maskReply] });
        //send just the avatar as a reply
        //avatarReply = new MessageAttachment(await avatar.getBufferAsync(Jimp.MIME_PNG), "avatar.png");
        //await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [avatarReply] });

        if (Math.random() > 0.5) right.flip(false, true);
        const left = right.clone().flip(true, (Math.random() > 0.5));

        avatar.resize(128, 128);
        //avatar.mask(mask, 0, 0);
        //send just the avatar as a reply
        //avatarReply = new MessageAttachment(await avatar.getBufferAsync(Jimp.MIME_PNG), "avatar.png");
        //await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [avatarReply] });

        canvas.blit(left, 0, 4);
        canvas.blit(right, 248, 4);
        canvas.blit(avatar, 124, 0);

        await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });

      } catch (e) { u.errorHandler(e, msg); }
    }
  })
  .addCommand({
    name: "greyscale",
    description: "Greyscale an Avatar",
    aliases: ["grayscale", "bw"],
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let target;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix)
        if (msg.attachments.size > 0) {
          target = msg.attachments.first().url;
        } else if (match) {
          target = match[1];
        } else {
          target = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
        }

        try {
          let av = await Jimp.read(target);
          av.color([{ apply: "desaturate", params: [100] }]);
          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await av.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }
      } catch (e) { u.errorHandler(e, msg); }

    }
  }).addCommand({
    name: "normalize",
    description: "Normalizes an Avatar",
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let target;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix)
        if (msg.attachments.size > 0) {
          target = msg.attachments.first().url;
        } else if (match) {
          target = match[1];
        } else {
          target = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
        }

        try {
          let av = await Jimp.read(target);
          av.normalize();
          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await av.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }
      } catch (e) { u.errorHandler(e, msg); }

    }
  }).addCommand({
    name: "blur",
    description: "Blurs an Avatar",
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let target;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix)
        if (msg.attachments.size > 0) {
          target = msg.attachments.first().url;
        } else if (match) {
          target = match[1];
        } else {
          target = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
        }

        try {
          let av = await Jimp.read(target);
          av.blur(20)
          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await av.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }
      } catch (e) { u.errorHandler(e, msg); }

    }
  }).addCommand({
    name: "pixelate",
    description: "Pixelates an Avatar",
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let target;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix)
        if (msg.attachments.size > 0) {
          target = msg.attachments.first().url;
        } else if (match) {
          target = match[1];
        } else {
          target = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
        }

        try {
          let av = await Jimp.read(target);
          av.pixelate(20)
          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await av.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }
      } catch (e) { u.errorHandler(e, msg); }

    }
  }).addCommand({
    name: "sepia",
    description: "Sepias an Avatar",
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let target;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix)
        if (msg.attachments.size > 0) {
          target = msg.attachments.first().url;
        } else if (match) {
          target = match[1];
        } else {
          target = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
        }

        try {
          let av = await Jimp.read(target);
          av.sepia()
          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await av.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }
      } catch (e) { u.errorHandler(e, msg); }

    }
  })
  .addCommand({
    name: "invert",
    description: "Invert an avatar or attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      try {
        let original;
        let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
        let match = urlexp.exec(suffix);

        if (msg.attachments.size > 0) {
          original = msg.attachments.first().url;
        } else if (match) {
          original = match[1];
        } else {
          original = (await u.getMention(msg, false) || msg.author).displayAvatarURL({ size: 512, format: "png" });
        }

        try {
          let img = await Jimp.read(original);
          for (let x = 0; x < img.bitmap.width; x++) {
            for (let y = 0; y < img.bitmap.height; y++) {
              let { r, g, b, a } = Jimp.intToRGBA(img.getPixelColor(x, y));
              img.setPixelColor(Jimp.rgbaToInt(255 - r, 255 - g, 255 - b, a), x, y);
            }
          }
          await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await img.getBufferAsync(Jimp.MIME_PNG)] });
        } catch (error) {
          msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        }
      } catch (error) { u.errorHandler(error, msg); }

    }
  })
  .addCommand({
    name: "metal",
    description: "Rock on.",
    aliases: [":metal:", "🤘"],
    category: "Silly",
    process: async (msg) => {
      try {
        const hand = "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/259/sign-of-the-horns_1f918.png";
        const target = await u.getMention(msg, false) || msg.author;
        const staticURL = target.displayAvatarURL({ size: 128, dynamic: false, format: "png" });

        const right = await Jimp.read(hand);
        const mask = await Jimp.read("./storage/mask.png");
        const avatar = await Jimp.read(staticURL);
        const canvas = new Jimp(368, 128, 0x00000000);

        const left = right.clone().flip(true, false);

        avatar.resize(128, 128);
        avatar.mask(mask, 0, 0);

        canvas.blit(right, 0, 4);
        canvas.blit(left, 248, 4);

        canvas.blit(avatar, 120, 0);

        await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_PNG)] });

      } catch (e) { u.errorHandler(e, msg); }
    }
  })
  .addCommand({
    name: "personal",
    description: "For when you take something personally",
    category: "Silly",
    process: async (msg) => {
      try {
        let image = await Jimp.read('https://cdn.discordapp.com/attachments/789694239197626371/808446253737181244/personal.png');
        let target = await Jimp.read((await u.getMention(msg, false)).displayAvatarURL({ format: 'png', size: 512 }));
        let mask = await Jimp.read('./storage/mask.png');
        mask.resize(350, 350);
        target.resize(350, 350);
        target.mask(mask);
        image.blit(target, 1050, 75);
        await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await image.getBufferAsync(Jimp.MIME_PNG)] });

      } catch (e) { u.errorHandler(e, msg); }
    }
  })
  .addCommand({
    name: "popart",
    description: "'Pop art' an avatar or attached image",
    category: "Silly",
    process: async (msg) => {
      try {
        const canvas = await popart(msg, [
          { apply: "desaturate", params: [100] },
          { apply: "saturate", params: [50] }
        ]);
        if (canvas) await msg.channel.send({ content: `<@${msg.author.id}> created:`, files: [await canvas.getBufferAsync(Jimp.MIME_JPEG)] });
      } catch (e) { u.errorHandler(e, msg); }

    }
  })
  .addCommand({
    name: "multiply",
    description: "Multiply an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_MULTIPLY)
    }
  })
  .addCommand({
    name: "hardlight",
    description: "composite via hardlight on an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_HARDLIGHT)
    }
  })
  .addCommand({
    name: "overlay",
    description: "composite via overlay on an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_OVERLAY)
    }
  })
  .addCommand({
    name: "combine",
    description: "composite via puts the attached image over an avatar ",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_SOURCE_OVER)
    }
  })
  .addCommand({
    name: "add",
    description: "composite via hardlight on an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_ADD)
    }
  }).addCommand({
    name: "ace",
    description: "put an ace border on an image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_SOURCE_OVER, "https://twibbon.blob.core.windows.net/twibbon/2017/173/a646f6a2-2e1d-4913-a988-58c15abf94c0.png")
    }
  }).addCommand({
    name: "pride",
    description: "put a pride border on an image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_SOURCE_OVER, "https://www.pngkey.com/png/full/117-1172719_border-with-the-rainbows-colors-for-any-lgbt.png")
    }
  }).addCommand({
    name: "christmas",
    description: "put a christmas border on an image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_SOURCE_OVER, "https://i.pinimg.com/originals/76/fc/32/76fc32aff9ad61caa2f2a72b8a8256b1.png")
    }
  }).addCommand({
    name: "armbaby",
    description: "For armbaby",
    category: "Silly",
    process: async (msg) => {

      let original;
      let content = msg.cleanContent.split(" ");
      content.shift();
      let suffix = content.join(" ");
      let urlexp = /\<?(https?:\/\/\S+)\>?(?:\s+)?(\d*)/;
      let match = urlexp.exec(suffix);

      if (msg.attachments.size > 0) {
        original = msg.attachments.first().url;
      } else if (match) {
        original = match[1];
      } else {
        original = (await u.getMention(msg, true) || msg.member).displayAvatarURL({ size: 256, format: "png" });
      }

      if (!supportedFormats.some(format => original.indexOf("." + format) > -1)) {
        msg.reply("I couldn't use that image! Make sure its a PNG, JPG, or JPEG.");
        return null;
      }
      try {
        let image = await Jimp.read('https://cdn.discordapp.com/attachments/450079288201576478/730192818357665832/arm_baby.png');
        let target = await Jimp.read(original);
        let mask = await Jimp.read('./storage/mask.png');
        image.scaleToFit(512, Jimp.AUTO, Jimp.RESIZE_HERMITE)
        const size = 320
        mask.resize(size, size);
        mask.blur(5);
        target.resize(size, size);
        target.mask(mask);
        image.blit(target, 180, 175);
        await msg.channel.send({ files: [await image.getBufferAsync(Jimp.MIME_PNG)] });

      } catch (e) { u.errorHandler(e, msg); }
    }
  }).addCommand({
    name: "screen",
    description: "composite via screen on an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_SCREEN)
    }
  }).addCommand({
    name: "darken",
    description: "composite via darkening on an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_DARKEN)
    }
  }).addCommand({
    name: "lighten",
    description: "composite via lighten on an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_LIGHTEN)
    }
  }).addCommand({
    name: "exclusion",
    description: "composite via exclusion on an avatar by an attached image",
    category: "Silly",
    process: async (msg, suffix) => {
      await composite(msg, suffix, Jimp.BLEND_EXCLUSION)
    }
  }).addCommand({
    name: "button",
    description: "For when you need a big red button",
    category: "Silly",
    hidden: true,
    process: async (msg) => {
      msg.reply({
        content: "Don't press the button",
        components: [new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('dontpushthebutton')
            .setLabel('🔴')
            .setStyle('DANGER')
        )]
      })
    }
  }).addInteractionHandler({
    customId: `dontpushthebutton`, process: (interaction) => {
      //This was added to celebrate 150 years of people pushing buttons
      //Check to see if the user has already pressed the button. If so, add to the counter of how many times they've pressed it
      let responses = [];
      let numberOfTimesPressed = 0;
      if (peopleWhoHavePressedTheButton.has(interaction.user.id)) {
        peopleWhoHavePressedTheButton.set(interaction.user.id, peopleWhoHavePressedTheButton.get(interaction.user.id) + 1);
        numberOfTimesPressed = peopleWhoHavePressedTheButton.get(interaction.user.id);
        responses = [
          "You pressed the button!",
          "You weren't supposed to press the button!",
          "You pressed the button, didn't you?",
          "How dare",
          "How could you?",
          "You monster",
          "Nooooo",
          "Don't press that again",
          "Huh. You pushed it.",
          "You definitely shouldn't have done that",
          "You pressed the button, now what?",
          "You pressed the button!",
          "You weren't supposed to press the button!",
          "You pressed the button, didn't you?",
          "How dare",
          "How could you?",
          "You monster",
          "Nooooo",
          "Don't press that again",
          "Huh. You pushed it.",
          "You definitely shouldn't have done that",
          "You pressed the button, now what?",
          "You pressed the button!",
          "You weren't supposed to press the button!",
          "You pressed the button, didn't you?",
          "How dare",
          "How could you?",
          "You monster",
          "Nooooo",
          "Don't press that again",
          "Huh. You pushed it.",
          "You definitely shouldn't have done that",
          "You pressed the button, now what?",
          "No! Not the button!",
          "Don't do it.... again.",
          "Don't push it" + (numberOfTimesPressed + 1) + "* times!",
          "You've pressed it *" + numberOfTimesPressed + "* times!",
          "You have not enough minerals",
          "Are you sure you want to do that?",
          "No. Denied.",
          "Wasing not of wasing is",
          "Stahp. That tickles",
          "I wonder what happens if you press the button 100 times. Will reality cease to exist?",
          "No. Bad. I'm getting the spray bottle",
          "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHN5MjBlN2xnY2kzemNxZGZtaWJoaGszcmJpOXJxN2I3bTcxeWlrciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UBMjCB1nwnGnI7vitO/giphy.gif",
          "No. Bad. I'm getting the spray bottle",
          "Fine. You win. The secret is at <https://wydds.cc/important.mp4>",
          "You must get along with Chaos elementals.",
          "Why must you do this to me.",
          "You know, there's more to life than pressing buttons.",
          "You're getting a little too button happy",
          "You're such a rebel",
          "How could you do this to me?",
          "How Dare.",
          "You know, The first known use of push-button was circa 1874. It's been **150** years. You'd think we'd have learned by now.",
          "The name came from the French word *bouton* (something that sticks out), rather than from the kind of buttons used on clothing. The initial public reaction was curiosity mixed with fear, some of which was due to widespread fear of electricity, which was a relatively new technology at the time.",
          "Why do you all keep pressing the button? Does it make you feel powerful?",
          "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWt2a2thdnN1YjBqYWZqeGU5ZzlnNTZtOGt3enU4cXlmMmJiN2x5OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JdSlA1a1zKVAyze/giphy.gif"
        ];

      } else {
        //If they haven't pressed the button, add them to the array and set the counter to 1
        peopleWhoHavePressedTheButton.set(interaction.user.id, 1);
        numberOfTimesPressed = 1;

        responses = [
          "You pressed the button!",
          "You weren't supposed to press the button!",
          "You pressed the button, didn't you?",
          "How dare",
          "How could you?",
          "You monster",
          "Nooooo",
          "Don't press that again",
          "Huh. You pushed it.",
          "You definitely shouldn't have done that",
          "You pressed the button, now what?",
          "You pressed the button!",
          "You weren't supposed to press the button!",
          "You pressed the button, didn't you?",
          "How dare",
          "How could you?",
          "You monster",
          "Nooooo",
        ];
      }

      let response = responses[Math.floor(Math.random() * responses.length)];
      interaction.guild.channels.cache.get(snowflakes.channels.secret).send(`<@${interaction.user.id}> pressed the button ${numberOfTimesPressed} times \n\nresponse:\n\`\`\`${response}\`\`\``);
      interaction.reply({
        content: response,
        ephemeral: true
      })
    }
  });


let peopleWhoHavePressedTheButton = new Collection();


module.exports = Module;
