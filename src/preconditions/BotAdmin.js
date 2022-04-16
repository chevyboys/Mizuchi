const build = require("../utilities/Preconditions").build,
    Snowflakes = require("../../config/snowflakes.json")

let CustomPrecondition = build({ 
    AllowedRoleResolvableArray : [],
    rejectionMessage: "Only bot administrators can do that",
    silent : true})

module.exports = {
    CustomPrecondition
};