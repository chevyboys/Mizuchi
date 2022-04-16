const build = require("../utilities/Preconditions").build,
    Snowflakes = require("../../config/snowflakes.json")

let CustomPrecondition = build({ 
    AllowedRoleResolvableArray : [Snowflakes.roles.Admin, Snowflakes.roles.BotMaster],
    rejectionMessage: "Only the bot masters and administrators can do that",
    silent : false})

module.exports = {
    CustomPrecondition
};