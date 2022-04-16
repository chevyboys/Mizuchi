const build = require("../utilities/Preconditions").build,
    Snowflakes = require("../../config/snowflakes.json")

let CustomPrecondition = build({
    AllowedRoleResolvableArray: [Snowflakes.roles.Admin, Snowflakes.roles.BotMaster, Snowflakes.roles.Moderator],
    rejectionMessage:  "Only the bot masters and moderation staff can do that",
})

module.exports = {
    CustomPrecondition
};