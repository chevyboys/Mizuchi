const u = require('../../utils/Utils.Generic');
const Active = require('./Active.js');
const snowflakes = require('../../config/snowflakes.json');
const event = require('./utils');
const { MessageReaction, User } = require('discord.js');
const ParticipantManager = require('./Participant.js');
const Participant = ParticipantManager.Participant;
const NPCSend = require('./NPC.js');
const inventoryHelper = require('./Inventory.js');
const Flurry = require('./Flurry.js');
const moment = require('moment');


//get random emoji from eventEmoji
function getRandomEmoji() {
  return event.emoji[Math.floor(Math.random() * event.emoji.length)];
}

let reactionObj = {
  /**
   * 
   * @param {MessageReaction} reaction 
   * @param {User} user 
   * @param {ParticipantManager} Participants 
   * @returns 
   */
  /*onAdd: async (reaction, user, Participants) => {
    if (user.bot || !Active.getActive) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    let message = reaction.message;
    let channel = message.guild.channels.cache.get(snowflakes.channels.botSpam);
    let member = await message.guild.members.fetch(user.id);
    try {
      switch (reaction.emoji.toString()) {
        case "🔮": //The Admin add reaction to message
          //check permissions
          if (event.isAdmin(member)) {
            await reactionObj.react(message);
          }
          reactionObj.remove(reaction);
          break;
        case "👻":
          if (Participants.get(user.id) && Participants.get(user.id)?.status != "ACTIVE" && reaction.message.channel.id != channel.id) return reactionObj.remove(reaction);
          reactionObj.remove(reaction);
          if (!reaction.users.cache.has(message.client.user.id)) {
            return;
          } else {
             `<@${user.id}>` = Participants.totalHostileToday(user.id) < 1 ? "<@" + user.id + ">"
              : member.displayName;
            Participants.addHostile(user.id);
            const currentHostileCount = Participants.totalHostileToday(user.id);
            reaction.message.guild.client.user.setActivity(`More than ${Participants.totalEventHostile()} Ghosts caught!`);



            //TODO: handle the rewards
            switch (currentHostileCount) {
              case 5:
                NPCSend(channel,
                  u.embed(
                    {
                      description: `<@${user.id}> has achieved the title of <@&${snowflakes.roles.Holiday[0]}>`,
                      footer: {
                        text: `Found Ghosts today: ${Participants.totalHostileToday(user.id)} | total: ${Participants.totalHostile(user.id)}\nFound Spirits  today: ${Participants.totalFriendlyToday(user.id)} | total: ${Participants.totalFriendly(user.id)}`
                      }
                    }
                  ),
                  {
                    content:  `<@${user.id}>`,
                    allowedMentions: { parse: ["users"] }
                  });

                await member.roles.add(snowflakes.roles.Holiday[0]);

                break;
              case 50:
                //TODO: Add today's mask to the inventory and equip it
                Participants.get(user.id).status = "SUSPENDED";
                Participants.write();
                NPCSend(channel,
                  u.embed(
                    {
                      description: `<@${user.id}> has fallen to the darkness`,
                      footer: {
                        text: `Found Ghosts today: ${Participants.totalHostileToday(user.id)} | total: ${Participants.totalHostile(user.id)}\nFound Spirits today: ${Participants.totalFriendlyToday(user.id)} | total: ${Participants.totalFriendly(user.id)}`
                      }
                    }
                  ),
                  {
                    content:  `<@${user.id}>`,
                    allowedMentions: { parse: ["users"] }
                  });

                await member.roles.add(snowflakes.roles.Holiday[1]);

                //message the user and let them know they can use the star emoji to help spread the ghosts
                member.user.send("You have been consumed by the darkness. As an ally of the night, you can the ⭐ emoji to spread the ghosts to other messages.");
                break;
              default:
                NPCSend(channel,
                  u.embed(
                    {
                      description: `I see <@${user.id}> captured a ghost in <#${message.channel.id}> `,
                      footer: {
                        text: `Found Ghosts today: ${Participants.totalHostileToday(user.id)} | total: ${Participants.totalHostile(user.id)}\nFound Spirits today: ${Participants.totalFriendlyToday(user.id)} | total: ${Participants.totalFriendly(user.id)}`
                      }
                    }
                  ),
                  {
                    content:  `<@${user.id}>`,
                    allowedMentions: (currentHostileCount == 1 ? { parse: ["users"] } : {})
                  });
            }
          }

          break;
        case "🧚‍♂️":
          if (Participants.get(user.id) && Participants.get(user.id)?.status == "BANNED") return;
          reactionObj.remove(reaction);
          if (!reaction.users.cache.has(message.client.user.id)) {
            return;
          } else {
            Participants.addFriendly(user.id);
            const currentFriendlyCount = Participants.totalHostileToday(user.id);
          }
          break;
        case "⭐":
          //if the participant has holiday[1] role, and participant.canUseAbility, create a reaction on the message and setLastAbilityUse
          if (reaction.message.guild.roles.cache.get(snowflakes.roles.Holiday[1]) && Participants.get(user.id).canUseAbility) {
            reactionObj.react(reaction.message);
            Participants.get(user.id).setLastAbilityUse();
          }
          //remove the star reaction
          reaction.remove();
      }

    } catch (error) {
      u.errorHandler(error, "Holiday reaction error");
    }

  },*/

  onAdd: async (reaction, user, Participants) => {
    {
      if (!Active.getActive) return;
      let message = reaction.message;
      if (!message.guild) return;
      let channel = message.guild.channels.cache.get(snowflakes.channels.botSpam);
      let member = await message.guild.members.fetch(user.id);
      if (event.emoji.indexOf(reaction.emoji.toString().toLowerCase()) > -1 && !user.bot && reaction.users.cache.has(message.client.user.id) && message.channel.permissionsFor(message.client.user).has("MANAGE_MESSAGES")) {
        let status;
        try {
          let index = Participants.get(user.id);
          if (!index) {
            Participants.addParticipant({
              userID: user.id,
            })
            index = Participants.get(user.id);
          }

          const participant = Participants.get(user.id);
          //if the user is not active, or has found more than 50 sweets, and the message is not in the event channel, remove the reaction and return unless its christmas eve or christmas day
          if ((participant.status != "ACTIVE" || participant.Hostile > 50) && message.channel.id != event.channel && moment().format("MM/DD") != "10/31" && message.channel.id != channel.id) {
            reaction.users.remove(user);
            return;
          }
          participant.Hostile.add();
          const currentHostileCount = participant.Hostile.totalToday();
          NPCSend(channel,
            u.embed(
              {
                description: `I see <@${user.id}> captured a ghost in <#${message.channel.id}> `,
                footer: {
                  text: `Found Ghosts today: ${Participants.totalHostileToday(user.id)} | total: ${Participants.totalHostile(user.id)}\nFound Spirits today: ${Participants.totalFriendlyToday(user.id)} | total: ${Participants.totalFriendly(user.id)}`
                }
              }
            ),
            {
              content: `<@${user.id}>`,
              allowedMentions: (currentHostileCount == 1 ? { parse: ["users"] } : {})
            });
          /////////////////////////
          switch (currentHostileCount) {
            case 5:
              NPCSend(channel,
                u.embed(
                  {
                    description: `<@${user.id}> has achieved the title of <@&${snowflakes.roles.Holiday[0]}>`,
                    footer: {
                      text: `Found Ghosts today: ${Participants.totalHostileToday(user.id)} | total: ${Participants.totalHostile(user.id)}\nFound Spirits  today: ${Participants.totalFriendlyToday(user.id)} | total: ${Participants.totalFriendly(user.id)}`
                    }
                  }
                ),
                {
                  content: `<@${user.id}>`,
                  allowedMentions: { parse: ["users"] }
                });

              await member.roles.add(snowflakes.roles.Holiday[0]);
              msg.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.cache.get(event.channel).send("Welcome to the hidden event channel <@" + this.user + ">!");
              break;
            case 50:
              Participants.get(user.id).status = "SUSPENDED";
              Participants.write();
              NPCSend(channel,
                u.embed(
                  {
                    description: `<@${user.id}> has fallen to the darkness`,
                    footer: {
                      text: `Found Ghosts today: ${Participants.totalHostileToday(user.id)} | total: ${Participants.totalHostile(user.id)}\nFound Spirits today: ${Participants.totalFriendlyToday(user.id)} | total: ${Participants.totalFriendly(user.id)}`
                    }
                  }
                ),
                {
                  content: `<@${user.id}>`,
                  allowedMentions: { parse: ["users"] }
                });

              await member.roles.add(snowflakes.roles.Holiday[1]);

              //message the user and let them know they can use the star emoji to help spread the ghosts
              member.user.send("You have been consumed by the darkness. As an ally of the night, you can the ⭐ emoji to spread the ghosts to other messages.");

              break;
          }
          //TODO: Add today's mask to the inventory and equip it

          await reactionObj.remove(reaction);
        } catch (error) { u.errorHandler(error, "Holiday reaction error"); }
      }
      else if (reaction.emoji.toString().toLowerCase().indexOf("🔮") > -1 && config.AdminIds.includes(user.id) || member.roles.cache.hasAny([snowflakes.roles.Admin, snowflakes.roles.Helper, snowflakes.roles.Moderator, snowflakes.roles.CommunityGuide, snowflakes.roles.BotMaster, snowflakes.roles.WorldMaker] || event.isAdmin(member))) {
        reaction.remove()
        await reaction.message.react(getRandomEmoji());
      } else if (reaction.emoji.toString().toLowerCase().indexOf("⭐") > -1) {
        u.errorHandler("⭐ reaction detected", "Gift reaction detected, Triggered by " + user.username + " in " + message.guild.name + " in channel " + message.channel.name + "\n User participant object information: " + JSON.stringify(Participants.get(user.id)));
        let index = Participants.get(user.id);
        if (!index || (Participants.get(user.id).status != "SUSPENDED" && Participants.get(user.id).status != "INACTIVE") || reaction.message.channel.id == event.channel) {
          reaction.users.remove(user);
          return;
        } else if (Participants.get(user.id).canUseAbility == false) {
          reaction.users.remove(user);
          return;
        } else {
          //disabling this since the abuse case isn't as bad as I thought it would be
          //participants.cache[index].updateAbilityUse();
          reaction.users.remove(user)
          return await reactionObj.react(reaction.message);
        }
      } else if (reaction.emoji.toString().toLowerCase().indexOf("✨") > -1) {
        //if the users status is not inactive, remove the reaction, and return
        u.errorHandler("✨ reaction detected", "Twinkle reaction detected, Triggered by " + user.username + " in " + message.guild.name + " in channel " + message.channel.name + "\n User participant object information: " + JSON.stringify(Participants.get(user.id)));
        let index = Participants.get(user.id);
        if (!index || Participants.get(user).status != "INACTIVE") {
          reaction.users.remove(user);
          return;
        } else if (Participants.get(user).canUseAbility == true) {
          Participants.get(user).lastAbilityUse = Date.now();
          Flurry.start(message.channel);
          reaction.users.remove(user);
          return;
        } else {
          removeReaction(reaction)
          return;
        }
      }
    }
  },
  /**
   * 
   * @param {Reaction} reaction 
   */
  remove: (reaction) => {
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
  },

  react: async (msg, emoji = getRandomEmoji()) => {
    return await msg.react(emoji);
  }
}


module.exports = reactionObj;