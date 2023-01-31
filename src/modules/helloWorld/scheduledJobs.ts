import { ChironClient, ScheduleComponent } from "chironbot";
import { ChannelType, PermissionFlagsBits, TextChannel } from "discord.js";




export const HelloWorldScheduleComponent = new ScheduleComponent({
    chronSchedule: '0 * * * * *', //runs once every minute
    /*
        *    *    *    *    *    *
        ┬    ┬    ┬    ┬    ┬    ┬
        │    │    │    │    │    │
        │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
        │    │    │    │    └───── month (1 - 12)
        │    │    │    └────────── day of month (1 - 31)
        │    │    └─────────────── hour (0 - 23)
        │    └──────────────────── minute (0 - 59)
        └───────────────────────── second (0 - 59, OPTIONAL)
    */
    enabled: true,
    process: async (date: Date) => {
        if (HelloWorldScheduleComponent.module?.client instanceof ChironClient) {
            //YOUR CODE HERE



            //Example code, says hi in a channel named general, or fall back to any other channel the bot can talk in every minute
            const guildId = HelloWorldScheduleComponent.module.client.config.adminServer;
            const guildObject = await HelloWorldScheduleComponent.module.client.guilds.fetch(guildId);
            const botMember = guildObject?.members.me;
            const messageableChannels = guildObject?.channels.cache.filter(c => c.type != ChannelType.GuildCategory && c.permissionsFor(botMember ? botMember : guildObject.roles.everyone).has(PermissionFlagsBits.SendMessages));
            const channel = messageableChannels.find(c => c.name.toLowerCase().indexOf('general') > -1) || messageableChannels.first();

            if (channel) {
                (channel as TextChannel).send("Hello World!")
                console.log("Hello World!")
            } else {
                console.log("Hello world! (I couldn't find a channel to send that in)")
            }

            //End Example Code
        }

        else throw new Error("Invalid Client");
    }
})