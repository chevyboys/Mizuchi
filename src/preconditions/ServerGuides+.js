const build = require("../utilities/Preconditions").build,
    Snowflakes = require("../../config/snowflakes.json")

let CustomPrecondition = build({
    AllowedRoleResolvableArray: [Snowflakes.roles.Admin, Snowflakes.roles.BotMaster, Snowflakes.roles.Moderator, Snowflakes.roles.CommunityGuide],
    rejectionMessage:  "Only the staff can do that",
})

module.exports = {
    CustomPrecondition
};