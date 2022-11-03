const Augur = require("augurbot"),
    u = require("../utils/Utils.Generic");
const snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const holidayFilePath = "./config/holidays.json",
    moment = require("moment");
const Module = new Augur.Module;
// /**
//  * 
//  * @member {string} name
//  * @member {string} greeting
//  * @member {object} botStatus
//  * @member {string} botStatus.type
//  * @member {string} botStatus.message
//  * @member {number} bestTimezoneModifier
//  * @member {Date} date 
//  * @member {Date} endDate 
//  * @member {string} emoji
//  */
// class Holiday {
//     /**
//      * 
//      * @param {object} object 
//      * @param {string} object.name
//      * @param {string} object.greeting
//      * @param {object} object.botStatus
//      * @param {string} object.botStatus.type
//      * @param {string} object.botStatus.message
//      * @param {number} object.bestTimezoneModifier
//      * @param {Date} object.date
//      * @param {Date} object.endDate
//      * @param {string} object.emoji
//      */
//     constructor(object) {
//         if (!object.name) {
//             throw new Error("No name in holiday object")
//         } else if (!object.greeting) {
//             throw new Error("No greeting in holiday object " + object.name);
//         } else if (!object.botStatus) {
//             throw new Error("No botStatus in holiday object " + object.name);
//         }
//         if (!object.bestTimezoneModifier) {
//             object.bestTimezoneModifier = 0;
//         }
//         if (!object.date) {
//             throw new Error("No date in holiday object " + object.name);
//         } else if (!object.date == "manual" && !Date.parse(object.date)) {
//             throw new Error("Invalid date " + object.date + " in object " + object.name);
//         }
//         this.name = object.name;
//         this.greeting = object.greeting;
//         this.botStatus = object.botStatus;
//         this.bestTimezoneModifier = object.bestTimezoneModifier;
//         this.date = object.date == "manual" ? "manual" : new Date(object.date);
//         this.endDate = object.date == "manual" ? "manual" : new Date(object.endDate || object.date);
//         this.emoji = object.emoji || "";
//         this.color = object.color || "#36ff50";
//         this.imageURL = object.imageURL;
//         this.url = object.url || "https://www.patreon.com/GhostBotCode"

//     }

//     static read() {
//         let data = JSON.parse(fs.readFileSync(holidayFilePath));
//         let holidays = [];
//         for (const holiday of data) {
//             holidays.push(new Holiday(holiday));
//         }
//         return holidays;
//     }

//     read() {
//         return Holiday.read()
//     }

//     write() {
//         try {
//             let data;
//             if (fs.existsSync(holidayFilePath)) {
//                 //file exists
//                 data = this.read()
//             } else {
//                 data = [];
//             }
//         } catch (err) {
//             console.error(err)
//         }
//         data.push(this);
//         fs.writeFileSync(`.${holidayFilePath}`, JSON.stringify(data, null, 4));
//     }

//     async celebrate(Module) {
//         let embed = u.embed()
//             .setAuthor({
//                 name: `${this.emoji}    ${this.greeting}    ${this.emoji}`,
//                 url: this.url,
//                 iconURL: Module.client.user.displayAvatarURL()
//             })
//             .setColor(this.color)
//             .setDescription(this.url != "https://www.patreon.com/GhostBotCode" ? "*click the link above to learn more about today* " : " - From all of us here on the Climber's Court Staff.")
//         if (this.imageURL) {
//             embed.setImage(this.imageURL);
//         }
//         let message = {
//             embeds: [
//                 embed
//             ]
//         }
//         this.setBotStatusForHoliday(Module)
//         let guild = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
//         let channel = guild.channels.cache.get(snowflakes.channels.general);
//         channel.send(message);
//     }

//     async setBotStatusForHoliday(Module) {
//         await Module.client.user.setActivity({ type: this.botStatus.type, name: this.botStatus.message.replace("  ", " ").trim() });
//     }
// }

/**
 * Precondition: Holiday file contains a holiday object
 */
// function prepareTheCelebration(Module, noMessage, skipdatecheck, holidayNameOverride) {
//     let holidays = Holiday.read();
//     let today = new Date();
//     let clientActivity = Module.client.presence.activities
//     if (holidayNameOverride) {
//         holidays = holidays.filter(h => holidayNameOverride.toLowerCase().indexOf(h.name.toLowerCase()) > -1)
//     }

//     for (const holiday of holidays) {
//         if ((holiday.date != "manual" && holiday.date.getMonth() == today.getMonth() && holiday.date.getDate == today.getDate) || skipdatecheck) {
//             holiday.setBotStatusForHoliday(Module);
//             if (moment().hours() == 12 + holiday.bestTimezoneModifier && !noMessage || skipdatecheck) {
//                 //it is the correct date and time to celebrate! let's do this!
//                 holiday.celebrate(Module);
//             }
//         } else if (holiday.date != "manual" && holiday.endDate.getMonth() == today.getMonth() && holiday.endDate.getDate < today.getDate() && clientActivity == holiday.botStatus.message) {
//             //clear out status after the holiday ends
//             Module.client.user.setActivity({ type: "WATCHING", name: " for news" })
//         }
//     }

// }




Module.setClockwork(() => {
    let hours = 1 //set this to change how many hours between each check. Suggest 1 to avoid random missing holidays
    let minutes = hours * 60
    let seconds = minutes * 60;
    try {
        return setInterval(() => { prepareTheCelebration(Module) }, seconds * 1000);
    } catch (error) { u.errorHandler(error, "Blog Clockwork"); }
}).addCommand({
    name: "forceholiday",
    description: "Forces the holiday check post in case of an error",
    hidden: true,
    process: async function (msg) {
        try {
            await msg.react("📃");
            let specificHoliday = null;
            if (msg.content.trim().toLowerCase() != "!forceholiday") specificHoliday = msg.content;
            prepareTheCelebration(msg, false, true, specificHoliday);
        } catch (e) { u.errorHandler(e, msg); }
    },
    permissions: (msg) => Module.config.adminId.includes(msg.author.id)
}).addEvent('ready', () => { prepareTheCelebration(Module, true) })

module.exports = Module;