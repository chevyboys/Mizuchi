let u = require('./General');
const Config = require("../../config/config.json");
const { Precondition } = require('@sapphire/framework');

const resolveMember = (triggerContainingMemberResolvable) => {
    if (!u.PrimaryServer) u = require('./General');
    if (!triggerContainingMemberResolvable) return null;
    let member;
    let guild = triggerContainingMemberResolvable.guild ? triggerContainingMemberResolvable.guild : u.PrimaryServer;
    if (triggerContainingMemberResolvable.member) member = triggerContainingMemberResolvable.member
    else if (triggerContainingMemberResolvable.user) {
        member = guild.members.cache.get(triggerContainingMemberResolvable.user) || guild.members.fetch(user) || u.PrimaryServer.members.cache.get(triggerContainingMemberResolvable.user) || u.PrimaryServer.members.fetch(user)
    }
    return member;
}
/**
 * Returns true if the member is a bot administrator
 * @param {Message|Interaction} trigger the message/interaction that triggered this 
 * @returns {boolean}
 */
let isBotAdmin = (trigger) => {
    return Config.AdminIds.includes(resolveMember(trigger)?.id)
}
/**
 * Finds if someone has at least one role in the provided list
 * @param {Message|Interaction} trigger the message/interaction that triggered this
 * @param {Array} AllowedRoleResolvableArray the roles that are allowed to use this trigger
 * @returns {boolean} If the user has any of the roles in Allowed Role Resolvable Array
 */
let basicPreconditionChecker = (trigger, AllowedRoleResolvableArray) => {
    return (isBotAdmin(trigger) ||
        (
            resolveMember(trigger) ?
                AllowedRoleResolvableArray.some(r => {
                    return resolveMember(trigger).roles.cache.map(r => r.id).includes(r)
                        //if any roles are allowed, then people with the administration permission should also be able to run the command
                        || (AllowdRoles.AllowedRoleResolvableArray.length > 0) ? resolveMember(trigger).permissions.has("ADMINISTRATOR") : false
                })
                : false
        )
    )
}

/**
     * The options for creating precondition checks for validating guildMember permissions
     * @param {MemberConditionsHandlerOptions} MemberConditionsHandlerOptions
     * @param {Discord.Interaction, Discord.Message} trigger the thing triggering the precondition
     * @param {Precondition} MemberConditionsHandlerOptions.PreconditionObject the precondition object to create the various checks on.
     * @param {funciton} [MemberConditionsHandlerOptions.AllowedRoleResolvableArray=[]] an array of Role ID snowflake, where any of those roles are permitted to use this piece. Also allows bot owners to use the command. If empty, allows bot owners only.
     * @param {string} [MemberConditionsHandlerOptions.rejectionMessage] the message to display on rejection. Defaults to "Only [role names] can use this command"
     * @param {boolean} MemberConditionsHandlerOptions.silent if the command should not respond to the user (where possible. Interactions must be replied to.)
     */
 function basicPreconditionHandler({ trigger, PreconditionObject, AllowedRoleResolvableArray, rejectionMessage, silent }) {
    return basicPreconditionChecker(trigger, AllowedRoleResolvableArray)
        ? PreconditionObject.ok()
        : PreconditionObject.error({
            message: rejectionMessage || AllowedRoleResolvableArray?.length > 0 ? `Only the role id(s) ${AllowedRoleResolvableArray.join()} can use this feature!` : "I'm sorry, but you can't do that",
            context: { silent: silent || false}
        })
}


let PreconditionMethods = {

    
    /**
     * Builds a basic role based precondition object
     * @param {object} buildOptions
     * @param {funciton} [buildOptions.AllowedRoleResolvableArray=[]] an array of Role ID snowflake, where any of those roles are permitted to use this piece. Also allows bot owners to use the command. If empty, allows bot owners only.
     * @param {string} [buildOptions.rejectionMessage] the message to display on rejection. Defaults to "Only [role names] can use this command"
     * @param {boolean} [buildOptions.silent] if the command should not respond to the user (where possible. Interactions must be replied to.)
     */
    build({AllowedRoleResolvableArray, rejectionMessage, silent}) {
        return class CustomPrecondition extends Precondition {
            messageRun(trigger) {
                return basicPreconditionHandler(
                    {
                        trigger: trigger,
                        PreconditionObject: this,
                        AllowedRoleResolvableArray: AllowedRoleResolvableArray,
                        rejectionMessage: rejectionMessage,
                        silent: silent
                    });
            }
            chatInputRun(trigger) {
                return basicPreconditionHandler(
                    {
                        trigger: trigger,
                        PreconditionObject: this,
                        AllowedRoleResolvableArray: AllowedRoleResolvableArray,
                        rejectionMessage: rejectionMessage,
                        silent: silent
                    });
            }
            contextMenuRun(trigger) {
                return basicPreconditionHandler(
                    {
                        trigger: trigger,
                        PreconditionObject: this,
                        AllowedRoleResolvableArray: AllowedRoleResolvableArray,
                        rejectionMessage: rejectionMessage,
                        silent: silent
                    });
            }
        }

    }

}
module.exports = PreconditionMethods;