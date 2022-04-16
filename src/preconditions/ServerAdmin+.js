const build = require("../utilities/Preconditions").build,
    Snowflakes = require("../../config/snowflakes.json")

let CustomPrecondition = build({
    AllowedRoleResolvableArray: [Snowflakes.roles.Admin],
    rejectionMessage: "Only the bot masters and server administration can do that",
})

module.exports = {
    CustomPrecondition
};