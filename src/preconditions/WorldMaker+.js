const build = require("../utilities/Preconditions").build,
    Snowflakes = require("../../config/snowflakes.json")

let CustomPrecondition = build({
    AllowedRoleResolvableArray: [Snowflakes.roles.Admin, Snowflakes.roles.BotMaster, Snowflakes.roles.Moderator],
    rejectionMessage:  "Only the world maker and administration staff can do that",
})

module.exports = {
    CustomPrecondition
};