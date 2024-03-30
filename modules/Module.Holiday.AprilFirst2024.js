//Initalization, imports, etc
const { MessageReaction, User, CommandInteraction, Message, MessageSelectMenu, MessageActionRow, } = require('discord.js');
const snowflakes = require('../config/snowflakes.json')
const Module = new (require("augurbot")).Module;
const fs = require('fs');
const config = require('../config/config.json');
const u = require('../utils/Utils.Generic');
const event = require("../modules/AprilFirst2024/utils");
const odds = event.odds;
const Participant = require("../modules/AprilFirst2024/Participant");
const NPCSend = require("../modules/AprilFirst2024/NPC");
const moment = require("moment");
const manipulateImage = require('../modules/AprilFirst2024/imageManipulation');
const embedColor = event.colors.find(c => c.name.toLowerCase().includes("blurple"))?.color || event.colors[event.colors.length - 1].color;

///things that can be manually set
const endedButNotCleaned = false;
const firstDayOfHanukkah = "12/07"; //MM/DD
const settings = {
  findablePerDay: 500, //Recomended: 50
}
const announcements = {
  flurry: "Spirits are flooding into this channel! Catch them before they escape!",
  extendedFlurry: "Restless spirits fill this channel, and will rise for hours to come if not stopped!",
  notEnoughSweets: "Catch a spirit before you can gift one!",
  openingAnnouncement: "*T'was the night of all hallows eve when our brave adventurers gathered together in the climbers court. But as they sat down to dine together, they heard a dark laughter from hundreds of throats. It seems the mana construct makers had delved too deep, and released the spirits hidden in a dark chamber deep inside the code. A dark fate awaited the brave adventurers if they failed to trap each of the spirits.*\n\n Be the first to click on a 👻 reaction from the bots on a message lest the spirit escape!",
  nameOfFindable: "ghost",
  needsToWaitBeforeCollecting: "has been consumed by the darkness, and until they recover, they can react with the 😈 emoji up to once every sixty seconds to free another spirit!",
  dailyReset: "The ground rumbles as a new wave of spirits rise, reseting the progress of our brave adventurers!",
}


//active should be set based on a file in the same directory as pristine waters called active.json. if it doesn't exist, it should be created with the value of false
//if active.json exists
let active;
if (!fs.existsSync('./data/holiday/active.json')) {
  fs.writeFileSync('./data/holiday/active.json', JSON.stringify({ active: false }));
  active = false;
} else {
  active = require('../data/holiday/active.json').active;
}

//if active.json is true, set active to true



function setActive(bool) {
  active = bool;
  fs.writeFileSync('./data/holiday/active.json', JSON.stringify({ active: bool }));
}



let flurries = [snowflakes.channels.botSpam];
function flurry(channel, hidden = false) {
  if (!hidden) NPCSend(channel, u.embed({
    description: announcements.flurry,
  }));
  flurries.push(channel.id);
  setTimeout(() => {
    flurries.splice(flurries.indexOf(channel.id), 1);
  }, 10 * 60 * 1000);
}

function extendedFlurry(channel, minutes, hidden = false) {
  if (!hidden) NPCSend(channel, u.embed({
    description: announcements.extendedFlurry,
  }));
  flurries.push(channel.id);
  setTimeout(() => {
    flurries.splice(flurries.indexOf(channel.id), 1);
  }, minutes * 60 * 1000);
}

function blizzard(channel, extendedMinutes = 0, hidden = false) {
  //triggers a flurry in every channel where all the following are true:
  // - The channel is not the event channel (if it is the event channel trigger the eventChannelFulrry function)
  // - The channel is not a DM
  // - The channel is not a channel where the everyone role cannot send messages
  // - The channel is not a channel where the bot cannot send messages
  // - The channel is not a channel where the bot cannot add reactions
  // - The channel is not a channel where the bot cannot manage messages
  // - The channel is not a thread
  // - The channel is not the bot spam channel

  //get all the channels in the guild
  return channel.guild.channels.fetch().then((channels) => {
    //filter out all the channels that don't meet the above criteria
    return channels = channels.filter(element => element.type == "GUILD_TEXT" &&
      element.id != event.channel &&
      element.type != "DM" &&
      element.permissionsFor(channel.guild.roles.everyone).has("SEND_MESSAGES") &&
      element.permissionsFor(channel.guild.roles.everyone).has("VIEW_CHANNEL") &&
      element.permissionsFor(channel.guild.roles.everyone).has("ADD_REACTIONS") &&
      //make sure the bot user can manage messages (not the everyone role)
      element.permissionsFor(channel.guild.me).has("MANAGE_MESSAGES") &&
      !element.isThread() &&
      element.id != snowflakes.channels.botSpam
    );
  }).then((channels) => {
    //for each channel, trigger a flurry
    return Promise.all(channels.map(element => extendedMinutes ? extendedFlurry(element, extendedMinutes, hidden) : flurry(element, hidden)));
  }).then(() => {
    //send a message indicating the appropriate type of feast in the event channel as the bot, not the NPC; The NPC cannot send messages into the event channel because it is a thread
    let eventChannel = channel.guild.channels.cache.get(event.channel);
    if (extendedMinutes) {
      if (!hidden) {
        eventChannel.send(u.embed({
          description: announcements.extendedFlurry,
          color: embedColor,
        }));
      }
      return extendedFlurry(eventChannel, extendedMinutes, true);
    }
    else {
      if (!hidden) {
        eventChannel.send({
          embeds: [u.embed({
            description: announcements.flurry,
            color: embedColor,
          })],
          content: "Event Special Announcement"
        })
      };
    }
    return flurry(eventChannel, true);
  }
  )
}


class Participants {
  cache = [];
  #_savePath = './data/holiday/cache.json';
  constructor() {
    if (fs.existsSync(this.#_savePath)) {
      this.cache = require("." + this.#_savePath).map(element => new Participant(element));
    } else {
      this.cache = [];
      this.write();
    }
  }
  async write(guild) {
    const writeable = await Promise.all(this.cache.map(async (element) => await element.getWriteable(guild)));
    return fs.writeFileSync(this.#_savePath, JSON.stringify(writeable, 0, 4));
  }
  async gift(giver, reciever, client) {
    let egg = [
      "You require more minerals",
      "You Must Construct Additional Pylons!",
      "Spawn more Overlords!",
      "We Require More Vespene Gas!",
      "Not Enough Minerals!",
      "Insufficient Vespene Gas!",
    ]

    if (client.guilds.cache.get(snowflakes.guilds.PrimaryServer).members.cache.get(reciever).bot) return "While we appreciate the consideration from one so illustrious, the server elementals have no need for this.";
    let giverIndex = this.cache.findIndex(element => giver == element.user);
    let recieverIndex = this.cache.findIndex(element => reciever == element.user);
    if (giverIndex == -1) {
      this.cache.push(new Participant({ user: giver, count: 0, MultiDayCount: 0, currency: 0, gifted: 0, received: 0, multiDayGifted: 0, multiDayReceived: 0, }));
      giverIndex = this.cache.length - 1;
      this.write();
      //roll a dice between 1 and 1000, if the result is less than the length of the egg array, return the egg message corresponding to the index of the roll
      if (Math.floor(Math.random() * 1000) < egg.length) return egg[Math.floor(Math.random() * egg.length)];
      else return announcements.notEnoughSweets;

    }
    if (recieverIndex == -1) {
      this.cache.push(new Participant({ user: reciever, count: 0, MultiDayCount: 0, currency: 0, gifted: 0, received: 0, multiDayGifted: 0, multiDayReceived: 0 }));
      recieverIndex = this.cache.length - 1;
    }
    if (giverIndex == recieverIndex) return "You can't gift to yourself!";
    if (this.cache[giverIndex].adjustedCount > 0) {
      this.cache[giverIndex].updateGifted(client);
      await this.cache[recieverIndex].updateReceived(client);
      this.write();
      return "Your gift has been sent!";
    } else {
      this.write();
      switch (Math.floor(Math.random() * 100)) {
        case 0:
          return egg[0];
        case 1:
          return egg[1];
        case 2:
          return egg[2];
        default:
          return announcements.notEnoughSweets;
      }
    }
  }
}

const participants = new Participants();

//get random emoji from eventEmoji
function getRandomEmoji() {
  return event.emoji[Math.floor(Math.random() * event.emoji.length)];
}

async function begin(msg) {
  await event.setHolidayBotIcon(msg.client);
  await event.generateRoles(msg.guild);
  setActive(true);
  NPCSend(msg.channel, u.embed({
    description: announcements.openingAnnouncement,
  },
  ),
    {
      content: `<@&${snowflakes.roles.Updates.AllUpdates}>, <@&${snowflakes.roles.Updates.MetaUpdates}>, <@&${snowflakes.roles.Updates.HolidayUpdates}>`,
      allowedMentions: { roles: [snowflakes.roles.Updates.AllUpdates, snowflakes.roles.Updates.MetaUpdates, snowflakes.roles.Updates.HolidayUpdates] }
    });
}

function removeReaction(reaction) {
  let returnable = null;
  try {
    returnable = reaction.remove();
  } catch (error) {
    if ((error.stack ? error.stack : error.toString()).toLowerCase().includes("unknown message")) return;
    else if ((error.stack ? error.stack : error.toString()).toLowerCase().includes("missing permissions")) {
      u.errorHandler(error, "Holiday reaction error: Missing manage messages permissions in " + reaction.message.guild.name + " in channel **" + reaction.message.channel.name + "**");
      return reaction.users.remove(reaction.message.client.user.id);
    }
    else u.errorHandler(error, "Holiday reaction error in " + reaction.message.guild.name + " in channel **" + reaction.message.channel.name + "**");
  } finally {
    return returnable;
  }
}

Module.addEvent("messageReactionAdd",
  /**
   * 
   * @param {MessageReaction} reaction 
   * @param {User} user 
   */
  async (reaction, user) => {
    if (!active) return;
    let message = reaction.message;
    let channel = message.guild.channels.cache.get(snowflakes.channels.botSpam);
    let member = await message.guild.members.fetch(user.id);
    if (event.emoji.indexOf(reaction.emoji.toString().toLowerCase()) > -1 && !user.bot && reaction.users.cache.size >= 1 && message.channel.permissionsFor(message.client.user).has("MANAGE_MESSAGES")) {
      let status;
      try {
        let index = participants.cache.findIndex(element => user == element.user);
        if (!participants.cache[index]) {
          participants.cache.push(new Participant({ user: user, count: 0, MultiDayCount: 0, currency: 0, gifted: 0, received: 0, multiDayGifted: 0, multiDayReceived: 0 }));
          index = participants.cache.length - 1;
        }
        //if the user is not active, or has found more than 50 sweets, and the message is not in the event channel, remove the reaction and return unless its christmas eve or christmas day
        if ((participants.cache[index].status != "ACTIVE" || participants.cache[index].adjustedCount > settings.findablePerDay) && message.channel.id != event.channel && moment().format("MM/DD") != "12/24" && moment().format("MM/DD") != "12/25") {
          reaction.users.remove(participants.cache[index].user);
          return;
        }
        if (index != -1) {
          const userCount = participants.cache[index];
          status = await userCount.updateCount(message.client);

        } else {
          participants.cache.push(new Participant({ user: user }));
        }
        NPCSend(channel,
          u.embed(
            {
              description: `I see <@${user.id}> found a ${announcements.nameOfFindable} in <#${message.channel.id}> `,
              footer: {
                text: `Found today: ${participants.cache[index].adjustedCount} | total: ${participants.cache[index].MultiDayCount + participants.cache[index].count}\nGifted today: ${participants.cache[index].gifted} | total: ${participants.cache[index].MultiDayGifted + participants.cache[index].gifted}\nReceived today: ${participants.cache[index].received} | total: ${participants.cache[index].MultiDayReceived + participants.cache[index].received}\n`
              }
            }
          ),
          {
            content: `<@${user.id}>`,
          }
        );
        if (status == "SUSPENDED") {
          NPCSend(channel,
            u.embed(
              {
                description: `<@${user.id}> ` + announcements.needsToWaitBeforeCollecting,
                footer: {
                  text: `Captured today: ${participants.cache[index].adjustedCount} | total: ${participants.cache[index].MultiDayCount + participants.cache[index].count}\nGifted today: ${participants.cache[index].gifted} | total: ${participants.cache[index].MultiDayGifted + participants.cache[index].gifted}\nReceived today: ${participants.cache[index].received} | total: ${participants.cache[index].MultiDayReceived + participants.cache[index].received}\n`
                }
              }
            ),
            {
              content: `<@${user.id}>`,
              allowedMentions: { users: [user.id] }
            }
          );
        }
        // Write cache to a JSON file
        participants.write();


        await removeReaction(reaction)
      } catch (error) { u.errorHandler(error, "Holiday reaction error"); }
    }
    else if (reaction.emoji.toString().toLowerCase().indexOf("🔮") > -1 && config.AdminIds.includes(user.id) || member.roles.cache.hasAny([snowflakes.roles.Admin, snowflakes.roles.Helper, snowflakes.roles.Moderator, snowflakes.roles.CommunityGuide, snowflakes.roles.BotMaster, snowflakes.roles.WorldMaker])) {
      reaction.remove()
      await reaction.message.react(getRandomEmoji());
    } else if (reaction.emoji.toString().toLowerCase().indexOf("😈") > -1) {
      u.errorHandler("😈 reaction detected", "Gift reaction detected, Triggered by " + user.username + " in " + message.guild.name + " in channel " + message.channel.name + "\n User participant object information: " + JSON.stringify(participants.cache.find(element => user == element.user)));
      let index = participants.cache.findIndex(element => user == element.user);
      if (index == -1 || (participants.cache[index].status != "SUSPENDED" && participants.cache[index].status != "INACTIVE") || reaction.message.channel.id == event.channel) {
        reaction.users.remove(participants.cache[index].user);
        return;
      } else if (participants.cache[index].canUseAbility(1) == false) {
        reaction.users.remove(participants.cache[index].user);
        return;
      } else {
        //disabling this since the abuse case isn't as bad as I thought it would be
        //participants.cache[index].updateAbilityUse();
        reaction.users.remove(participants.cache[index].user)
        return await reaction.message.react(getRandomEmoji());
      }
    } else if (reaction.emoji.toString().toLowerCase().indexOf("✨") > -1) {
      //if the users status is not inactive, remove the reaction, and return
      u.errorHandler("✨ reaction detected", "Twinkle reaction detected, Triggered by " + user.username + " in " + message.guild.name + " in channel " + message.channel.name + "\n User participant object information: " + JSON.stringify(participants.cache.find(element => user == element.user)));
      let index = participants.cache.findIndex(element => user == element.user);
      if (index == -1 || participants.cache[index].status != "INACTIVE") {
        reaction.users.remove(participants.cache[index].user);
        return;
      } else if (participants.cache[index].canUseAbility(30) == true) {
        participants.cache[index].updateAbilityUse();
        flurry(message.channel);
        reaction.users.remove(participants.cache[index].user);
        return;
      } else {
        removeReaction(reaction)
        return;
      }
    }
  }).addEvent("messageCreate",
    /**
     * 
     * @param {Message} msg 
     * @returns 
     */
    async (msg) => {
      if (!active) return;
      if (msg.channel.type == "DM") return;
      //if it is the 24th or 25th of december , react to every message
      if (flurries.includes(msg.channel.id) || msg.channel.id == event.channel || (moment().format("MM/DD") == "12/24" || moment().format("MM/DD") == "12/25")) {
        msg.react(getRandomEmoji());
      } else {
        /*if the channel has:
         - More than two messages in the last 10 minutes from non bots
         - passes a 1% chance to trigger
         - The triggering message author is not a bot
         - The triggering message is not in the event channel
         - The triggering message is not in a DM
         - The triggering message is not in a channel where the everyone role cannot send messages
         Then have a flurry in the channel
        */
        if (msg.channel.messages.cache.filter(element => element.createdTimestamp > Date.now() - 10 * 60 * 1000 && !element.author.bot).size > 2 && Math.floor(Math.random() * 100) < 1 && !msg.author.bot && event.channel != msg.channel.id && msg.channel.type != "DM" && msg.guild.roles.everyone.permissionsIn(msg.channel).has("SEND_MESSAGES")) {
          //if the channel name is general, have a chance for an extended flurry
          if (msg.channel.name.toLowerCase() == "general" && Math.floor(Math.random() * 100) < 10) {
            extendedFlurry(msg.channel, 180);
          }
          else flurry(msg.channel);
        }
      }
      if (
        msg.author &&
        !msg.webhookId &&
        !msg.author.bot &&
        msg.type == "DEFAULT" &&
        (msg.member.roles.cache.has(snowflakes.roles.Holiday[1]) ? (Math.random() * 100 < odds) : (Math.random() * 100 < odds + 5))
      ) {
        msg.react(getRandomEmoji());
      }
    }).setClockwork(() => {
      if (!active) return;
      try {
        return setInterval(async () => {
          let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
          const TargetUSTime = 5; //5 AM is the target MST time. The Devs are MST based, so this was the easiest to remember
          const modifierToConvertToBotTime = 7;
          if (moment().hours() == TargetUSTime + modifierToConvertToBotTime) {

            participants.cache.forEach(async (element) => {
              element.dailyReset();
              await (await (Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)).members.fetch(element.user)).roles.remove(snowflakes.roles.Holiday);
            });
          }
          participants.write();
        }

          , 60 * 60 * 1000);
      } catch (e) { u.errorHandler(e, "event Clockwork Error"); }
    })/**/




Module.addCommand({ //TODO: REMOVE THIS
  name: "begin",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.BotMaster),
  process: async (msg) => {
    await begin(msg);
    await msg.react("✔");
  }
}).addCommand({ //TODO: REMOVE THIS
  name: "clean",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.BotMaster),
  process: async (msg) => {
    await event.cleanRoles(msg.guild);
    await event.cleanHolidayBotIcon(msg.client);
    //delete the active.json file and the cache.json file
    fs.unlinkSync('./data/holiday/active.json');
    fs.unlinkSync('./data/holiday/cache.json');
    await msg.channel.send("Roles cleaned");
  }
}).addCommand({
  name: "write",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.BotMaster),
  process: async (msg) => {
    participants.write(msg.guild).then(() => {
      msg.channel.send("Cache written");
    });
  }
}).addCommand({
  name: "flurry",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.Admin)
    || msg.member.roles.cache.has(snowflakes.roles.BotMaster)
    || msg.member.roles.cache.has(snowflakes.roles.WorldMaker)
    || msg.member.roles.cache.has(snowflakes.roles.Moderator)
    || msg.member.roles.cache.has(snowflakes.roles.CommunityGuide),
  process: async (msg) => {
    if (msg.content.includes("extended")) extendedFlurry(msg.channel, 180, msg.content.includes("hidden"));
    else flurry(msg.channel, msg.content.includes("hidden"));
    u.clean(msg, 0);
  }
}).addCommand(
  {
    name: "blizzard",
    guild: snowflakes.guilds.PrimaryServer,
    permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.Admin)
      || msg.member.roles.cache.has(snowflakes.roles.BotMaster)
      || msg.member.roles.cache.has(snowflakes.roles.WorldMaker)
      || msg.member.roles.cache.has(snowflakes.roles.Moderator)
      || msg.member.roles.cache.has(snowflakes.roles.CommunityGuide),
    process: async (msg) => {
      if (msg.content.includes("extended")) blizzard(msg.channel, 180, msg.content.includes("hidden"));
      else blizzard(msg.channel, 0, msg.content.includes("hidden"));
      u.clean(msg, 0);
      //notify mods that a blizzard was started in the mod requests channel
      let embed = u.embed({
        description: "A " + (msg.content.includes("extended") ? "grand " : "") + "haunting everywhere has been started by " + msg.member.displayName + " using the &blizzard command!\nIt will last for " +
          (msg.content.includes("extended") ? "three hours" : "ten minutes") + "." + (msg.content.includes("hidden") ? "\nThis haunting was hidden." : ""),
        color: embedColor,
      });
      msg.guild.channels.cache.get(snowflakes.channels.modRequests).send({ embeds: [embed] });
    }

  }
)
  .addCommand({
    name: "dailyreset",
    guild: snowflakes.guilds.PrimaryServer,
    permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.Admin)
      || msg.member.roles.cache.has(snowflakes.roles.BotMaster)
      || msg.member.roles.cache.has(snowflakes.roles.WorldMaker)
      || msg.member.roles.cache.has(snowflakes.roles.Moderator)
      || msg.member.roles.cache.has(snowflakes.roles.CommunityGuide),
    process: async (msg) => {
      if (!active) return msg.channel.send("The event is not active");
      participants.cache.forEach(async (element) => {
        element.dailyReset();
        (await msg.guild.members.fetch(element.user)).roles.remove(snowflakes.roles.Holiday);
      });
      participants.write();
      msg.channel.send("Daily reset complete");
      //if it isn't the 24th or 25th of december
      if (moment().format("MM/DD") != "12/24" && moment().format("MM/DD") != "12/25") {
        msg.guild.channels.cache.get(snowflakes.channels.general).send(announcements.dailyReset);
      } else {
        msg.guild.channels.cache.get(snowflakes.channels.general).send("Radiance wishes you all a Merry Christmas!");
        NPCSend(msg.guild.channels.cache.get(snowflakes.channels.general), u.embed({
          description: "Let there be rejoicing and feasting for everyone! The coffers are open for all to enjoy all day long! The cooldown have been removed and restrictions lifted! Go forth and find new sweets!",
          color: embedColor,
        }));
      }
    }
  });


//Things for the command interaction
let folderNames = fs.readdirSync("./storage/pristine/");
let folderOptions = folderNames.map(element => {
  return {
    label: element,
    value: element,
    description: element,
    emoji: "🖼️"
  }
});
const folderRow = new MessageActionRow().addComponents(
  new MessageSelectMenu(
    {
      customId: "PristineAvatarOverlayFolderSelector",
      options: folderOptions,
      placeholder: "Select an overlay",
    }
  )

);

async function handlePristineAvatarOverlaySelectionMenus(interaction) {
  //interaction.deferUpdate();
  let folderMenu = interaction.message.components[0];
  let colorMenu = interaction.message.components[1];
  let folder = folderMenu.components[0].placeholder;
  let colorRoleName = interaction.message.components[1].components[0].placeholder;
  if (interaction.customId == "PristineAvatarOverlayFolderSelector") {
    folderMenu.components[0].placeholder = interaction.values[0];
    folder = interaction.values[0];
  }
  else if (interaction.customId == "PristineAvatarOverlayColorSelector") {
    colorRoleName = interaction.guild.roles.cache.get(interaction.values[0]).name;
    colorMenu.components[0].placeholder = colorRoleName;
  }
  if (!(interaction.message.components[0].components[0].placeholder == "Select an overlay") && !(interaction.message.components[1].components[0].placeholder == "Select a color")) {
    //get the hex color from the event cache for the user's selected color
    let color = participants.cache.find(element => interaction.user.id == element.user).unlockedColors.find(element => ("spooky " + element.name).toLowerCase() == colorRoleName.toLowerCase())?.color;
    return manipulateImage({
      folderName: folder,
      member: interaction.member,
      hexColor: color
    }).then((image) => {
      return interaction.update({
        embeds: interaction.message.embeds,
        components: [folderMenu, colorMenu],
        files: [{
          attachment: image,
          //if the user has an animated avatar, set the file name to avatar.gif, otherwise set it to avatar.png
          name: interaction.member.user.avatar.startsWith("a_") ? "avatar.gif" : "avatar.png"

        }
        ]
      })
    })
  }
  else return interaction.update({
    embeds: interaction.message.embeds,
    components: [folderMenu, colorMenu]
  })


}


Module.addInteractionCommand({
  name: "halloween",
  guildId: snowflakes.guilds.PrimaryServer,
  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  process: async (interaction) => {
    if (!active) return interaction.reply({
      embeds: [u.embed(
        {
          description: `The event is not active`,
          color: embedColor,
        }
      )],
      ephemeral: true
    });
    switch (interaction.options.getSubcommand()) {
      case "inventory":
        let index = participants.cache.findIndex(element => interaction.user.id == element.user);
        if (index == -1) {
          participants.cache.push(new Participant({ user: interaction.user.id, count: 0, MultiDayCount: 0, currency: 0, gifted: 0, received: 0, multiDayGifted: 0, multiDayReceived: 0 }));
        }
        let participantObj = participants.cache[index];
        let colors = await participantObj.getunlockedColorRoles(interaction.client);
        let colorOptions = colors.map(element => {
          return {
            label: element.name,
            value: element.id,
            description: element.description,
            emoji: element.emoji
          }
        })
        colorOptions.push({
          label: "None",
          value: "none",
          description: "Remove all event roles",
          emoji: "❌"
        });
        interaction.reply({
          embeds: [u.embed(
            {
              description: `You have found ${participantObj.MultiDayCount + participantObj.count} ${announcements.nameOfFindable}s over the course of the event, ${participantObj.MultiDayGifted + participantObj.gifted} of which you have gifted to others, and ${participantObj.MultiDayReceived + participantObj.received} of which you have received from others.\n\nYou have access to the following roles:`
                + colors.map(element => `\n<@&${element.id}>`).join(""),
              color: embedColor,
            }
          )],
          ephemeral: true,
          components: [
            //the menu to select roles from
            {
              type: 1,
              components: [
                {
                  type: 3,
                  custom_id: "PristineRoleSelector",
                  options: colorOptions,
                }
              ]
            }
          ]
        })
        break;

      case "gift":
        if (endedButNotCleaned) return interaction.reply({ content: "the event is closed for the year" });
        else {
          let user = interaction.options.getUser("recipient");
          await participants.gift(interaction.user.id, user.id, interaction.client).then((result) => {
            interaction.reply(result);
          }
          );
        }

        break;

      case "help":
        interaction.reply({
          embeds: [u.embed(
            {
              description: `In order to participate in this event, you will need to find various reactions left by the bots throughout the server. Each one you get progresses you towards rewards, both daily, and longer term rewards.`
                + "\n\n **__Credits__** \nThis event was created by Ghost, with help from the following amazing people:\nKritta\nDuke Tersael\nRels\nLan\n\n **__Special Thanks__**:\nPandora K Ballard,",
              color: embedColor,
            }
          )],
          ephemeral: true
        })
        break;

      case "leaderboard":
        //get the first 25 participants, sorted by the number of sweets they have found
        let leaderboard = participants.cache.sort((a, b) => b.multidayAdjustedCount + b.adjustedCount - a.multidayAdjustedCount - a.adjustedCount).slice(0, 10);
        let leaderboardFoundToday = participants.cache.sort((a, b) => b.count - a.count).slice(0, 10);
        let leaderboardGiftedToday = participants.cache.sort((a, b) => b.gifted - a.gifted).slice(0, 10);
        let leaderboardGiftedTotal = participants.cache.sort((a, b) => b.MultiDayGifted + b.gifted - a.MultiDayGifted - a.gifted).slice(0, 10);
        let totalPeopleWhoHaveFoundOrGivenSweets = participants.cache.filter(element => element.MultiDayCount + element.count + element.MultiDayGifted + element.gifted > 0).length;
        let totalSweetsFound = participants.cache.reduce((accumulator, currentValue) => accumulator + currentValue.count + currentValue.MultiDayCount, 0);
        let totalGiftsGiven = participants.cache.reduce((accumulator, currentValue) => accumulator + currentValue.MultiDayGifted + currentValue.gifted, 0);
        let leaderboardEmbed = u.embed({
          title: "Leaderboard",
          description: leaderboard.map((element, index) => {
            return `${index + 1}. <@${element.user}>: ${element.multidayAdjustedCount + element.adjustedCount} ${announcements.nameOfFindable}${(element.multidayAdjustedCount + element.adjustedCount > 1) ? "s" : ""} collected over the course of the event`
          }).join("\n"),
          fields: [
            {
              name: "Most " + announcements.nameOfFindable + "s found today",
              value: leaderboardFoundToday.map((element, index) => {
                return `${index + 1}. <@${element.user}>: ${element.count}`
              }).join("\n"),
              inline: true
            },
            {
              name: "Most unique colors unlocked",
              value: leaderboard.map((element, index) => {
                //get the unlocked color roles for each participant, ensure no duplicates are counted, and return the number of unique colors unlocked
                return `${index + 1}. <@${element.user}>: ${element.getunlockedColorRoles(interaction.client).length}/${event.colors.length}`
              }).join("\n"),
              inline: true
            },
            {
              name: "Most " + announcements.nameOfFindable + "s gifted today",
              value: leaderboardGiftedToday.map((element, index) => {
                return `${index + 1}. <@${element.user}>: ${element.gifted}`
              }).join("\n"),
              inline: false
            },
            {
              name: "Most " + announcements.nameOfFindable + "s gifted total (" + totalGiftsGiven + ")",
              value: leaderboardGiftedTotal.map((element, index) => {
                return `${index + 1}. <@${element.user}>: ${element.MultiDayGifted + element.gifted}`
              }).join("\n"),
              inline: true
            },

          ],
          footer: {
            text: "You currently have " + (participants.cache.findIndex(element => interaction.user.id == element.user) == -1 ?
              0 : participants.cache[participants.cache.findIndex(element => interaction.user.id == element.user)].adjustedCount) + " " + announcements.nameOfFindable + "s today"
              + "\nYou have found " + (participants.cache.findIndex(element => interaction.user.id == element.user) == -1 ?
                0 : participants.cache[participants.cache.findIndex(element => interaction.user.id == element.user)].multidayAdjustedCount + participants.cache[participants.cache.findIndex(element => interaction.user.id == element.user)].adjustedCount)
              + " " + announcements.nameOfFindable + "s over the course of the event.\n" + totalPeopleWhoHaveFoundOrGivenSweets + " people have found " + totalSweetsFound + " " + announcements.nameOfFindable + "s so far this year."

          },
          color: embedColor,
        })
        interaction.reply({
          embeds: [leaderboardEmbed],
          ephemeral: true
        })
        break;

      case "avatar":
        //the avatar sub command should send a message with two menus, one to select a folder name from ./storage/pristine/ and one to select a color from the event color roles in the user's inventory

        //get all the folders in ./storage/pristine/

        //get all the color roles in the user's inventory
        //get the participant object for the user
        let participant = participants.cache.find(element => interaction.user.id == element.user);
        //get the unlocked color roles for the user
        let unlockedColorRoles = await participant.getunlockedColorRoles(interaction.client);
        //get the color options for the menu
        let userColorOptions = unlockedColorRoles.map(element => {
          return {
            label: element.name,
            value: element.id,
            description: element.description,
            emoji: element.emoji
          }
        });
        if (userColorOptions.length == 0) return interaction.reply({
          embeds: [u.embed({
            description: "You do not have any event colors unlocked",
            color: embedColor,
          })],
          ephemeral: true
        });
        //get the folder options for the menu

        //create the message
        interaction.reply({
          embeds: [u.embed({
            description: "Create an event avatar overlay",
            color: embedColor,
          })],
          ephemeral: true,
          components: [
            //the menu to select the folder from
            folderRow,
            //the menu to select the color from
            new MessageActionRow().addComponents(
              new MessageSelectMenu(
                {
                  customId: "PristineAvatarOverlayColorSelector",
                  options: userColorOptions,
                  placeholder: "Select a color",
                }
              )
            )
          ]
        })

    }
  }
}).addInteractionHandler({
  customId: "PristineRoleSelector",
  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  process: async (interaction) => {
    let index = participants.cache.findIndex(element => interaction.user.id == element.user);
    if (index == -1) {
      participants.cache.push(new Participant({ user: interaction.user.id, count: 0, MultiDayCount: 0, currency: 0, gifted: 0, received: 0, multiDayGifted: 0, multiDayReceived: 0 }));
    }
    let participantObj = participants.cache[index];
    let colors = await participantObj.getunlockedColorRoles(interaction.client);
    let role = colors.find(element => element.id == interaction.values[0]);
    if (interaction.values[0] == "none") {
      interaction.member.roles.remove(colors.map(element => element.id));
      return interaction.reply({
        content: `All event colors have been removed.`,
        ephemeral: true
      })
    }
    else if (role) {
      //remove all color roles from the user
      return interaction.member.roles.remove(colors.map(element => element.id).filter(e => e != role)).then(() => {
        return interaction.member.roles.add(role);
      }).then(() => {
        return interaction.reply({
          content: `You have been given the <@&${role.id}> role.`,
          ephemeral: true
        })
      });

    } else {
      interaction.reply({
        content: "You do not have access to that role.",
        ephemeral: true
      });
    }
  }
}).addInteractionHandler({
  customId: "PristineAvatarOverlayFolderSelector",
  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  process: async (interaction) => {
    //get the currently selected options in the two menus from the interaction
    return await handlePristineAvatarOverlaySelectionMenus(interaction);

  }
}).addInteractionHandler({
  customId: "PristineAvatarOverlayColorSelector",
  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  process: async (interaction) => {
    return await handlePristineAvatarOverlaySelectionMenus(interaction);
  }
});

//the JSON registration with discord for the event interaction commands should look like this:
// {
//   "name": "festival",
//   "description": "Pristine Waters Event",
//   "options": [
//     {
//       "name": "inventory",
//       "description": "View and manage your event roles",
//       "type": 1
//     },
//     {
//       "name": "gift",
//       "description": "Gift a sweet to another user",
//       "type": 1,
//       "options": [
//         {
//           "name": "recipient",
//           "description": "The user to gift to",
//           "type": 6,
//           "required": true
//         }
//       ]
//     },
//     {
//       "name": "help",
//       "description": "Get help with the event",
//       "type": 1
//     }
//   ]
// }


//Hannukah
Module.setClockwork(() => {
  try {
    return setInterval(() => {
      //if today is the first day of hannukah, change the bot's avatar to Hanukkah1.png avatar
      //if today is the second day of hannukah, change the bot's avatar to Hanukkah2.png avatar
      //if today is the third day of hannukah, change the bot's avatar to Hanukkah3.png avatar
      //if today is the fourth day of hannukah, change the bot's avatar to Hanukkah4.png avatar
      //if today is the fifth day of hannukah, change the bot's avatar to Hanukkah5.png avatar
      //if today is the sixth day of hannukah, change the bot's avatar to Hanukkah6.png avatar
      //if today is the seventh day of hannukah, change the bot's avatar to Hanukkah7.png avatar
      //if today is the eighth day of hannukah, change the bot's avatar to Hanukkah8.png avatar

      if (moment().format("MM/DD") == firstDayOfHanukkah) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah1.png")))
      }
      else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(1, "day").format("MM/DD")) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah2.png")))
      }
      else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(2, "day").format("MM/DD")) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah3.png")))
      }
      else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(3, "day").format("MM/DD")) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah4.png")))
      }
      else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(4, "day").format("MM/DD")) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah5.png")))
      }
      else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(5, "day").format("MM/DD")) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah6.png")))
      }
      else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(6, "day").format("MM/DD")) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah7.png")))
      }
      else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(7, "day").format("MM/DD")) {
        Module.client.user.setAvatar(('./avatar/' + ("Hanukkah8.png")))
      } else if (moment().format("MM/DD") == "12/24") {
        //set the avatar to the blueStar.png avatar, set the status to watching silent night, and set the activity type to "WATCHING", link to
        let blueStar = "./avatar/blueStar.png";
        Module.client.user.setAvatar(blueStar);
        Module.client.user.setActivity("Silent Night", { type: "WATCHING", url: "https://www.youtube.com/watch?v=PrLoWt2tfqg", });
      } else if (moment().format("MM/DD") == "12/25") {
        //set the avatar to the blueStar.png avatar, set the status to watching silent night, and set the activity type to "WATCHING", link to
        let blueStar = "./avatar/blueStar.png";
        Module.client.user.setAvatar(blueStar);
        Module.client.user.setActivity("A Wonderful Christams Time", { type: "WATCHING", url: "https://www.youtube.com/watch?v=t_xq3Bj_tas", });
      }
      //if the month is december, set the bot's avatar to winter.png
      else if (moment().format("MM") == "12") {
        Module.client.user.setAvatar(event.avatar || ('./avatar/' + ("winter.png")))
      } else if (moment().format("MM/DD") == "01/02") {
        Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.cache.get(snowflakes.channels.modRequests).send("Please have a bot master update the hanukkah start date in the code (modules/Module.Holiday.PristineWaters.js)");
      }
      //if its april first set the avatar to TavareChaos.png
      else if (moment().format("MM/DD") == "04/01") {
        Module.client.user.setAvatar(('./avatar/' + ("TavareChaos.png")))
      }

    }, 3 * 60 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "Hannukah PFP update error"); }
})


module.exports = Module;
