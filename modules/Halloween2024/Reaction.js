const u = require('../../utils/Utils.Generic');
const Active = require('./Active.js');
const snowflakes = require('../../config/snowflakes.json');
const event = require('./utils');
const { MessageReaction, User } = require('discord.js');
const ParticipantManager = require('./Participant.js');
const NPCSend = require('./NPC.js');
const inventoryHelper = require('./Inventory.js');


//get random emoji from eventEmoji
function getRandomEmoji() {
  return event.emoji[Math.floor(Math.random() * event.emoji.length)];
}

let reaction = {
  /**
   * 
   * @param {MessageReaction} reaction 
   * @param {User} user 
   * @param {ParticipantManager} Participants 
   * @returns 
   */
  onAdd: async (reaction, user, Participants) => {
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
            this.react(message);
          }
          this.remove(reaction);
          break;
        case "👻":
          if (Participants.get(user.id) && Participants.get(user.id)?.status != "ACTIVE") return;
          this.remove(reaction);
          if (!reaction.users.cache.has(message.client.user.id)) {
            return;
          } else {
            Participants.addHostile(user.id);
            const currentHostileCount = Participants.totalHostileToday(user.id);
            reaction.message.guild.client.user.setActivity(`More than ${Participants.getCurrentTotalHostileFound()} Ghosts caught!`);
            $userMention = Participants.totalHostileToday(user.id) < 1
              ? "<@" + user.id + ">"
              : member.displayName;

            NPCSend(channel,
              u.embed(
                {
                  description: `I see <@${user.id}> found a treat in <#${message.channel.id}> `,
                  footer: {
                    text: `Found Ghosts today: ${Participants.totalHostileToday(user.id)} | total: ${Participants.totalHostile(user.id)}\nFound Spirits today: ${Participants.totalFriendlyToday(user.id)} | total: ${Participants.totalFriendly(user.id)}`
                  }
                }
              ),
              {
                content: $userMention,
              });

            //TODO: handle the rewards
            switch (currentHostileCount) {
              case 5:
                break;
              case 50:
                //TODO: Add today's mask to the inventory and equip it
                Participants.get(user.id).status = "SUSPENDED";
                break;
              default:
            }
          }

          break;
        case "🧚‍♂️":
          if (Participants.get(user.id) && Participants.get(user.id)?.status == "BANNED") return;
          break;

      }

    } catch (error) {
      u.errorHandler(error, "Holiday reaction error");
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

  react: (msg, emoji = getRandomEmoji()) => {

  }
}


module.exports = reaction;