import { ChironModule } from "chironbot";
import { HelloWorldContextMenu } from "./helloWorld/contextMenu";
import { HelloWorldEventComponent } from "./helloWorld/event";
import { HelloWorldMessageButtonSender, HelloWorldMessageComponentInteraction } from "./helloWorld/messageComponentInteraction";
import { HelloWorldScheduleComponent } from "./helloWorld/scheduledJobs";
import { HelloWorldSlashCommand, HelloWorldSecondSlashCommand } from "./helloWorld/slashCommand";
import { HelloWorldEchoCommand, HelloWorldTextCommand } from "./helloWorld/textCommand";
import { HelloWorldUnregisterSlashCommand, loaded, Reload, unloaded } from "./helloWorld/loadUnload";
export const Module = new ChironModule({
    name: "hello world",
    components: [
        HelloWorldSlashCommand,
        HelloWorldTextCommand,
        HelloWorldEventComponent,
        HelloWorldContextMenu,
        HelloWorldMessageButtonSender,
        HelloWorldMessageComponentInteraction,
        HelloWorldScheduleComponent,
        HelloWorldUnregisterSlashCommand,
        HelloWorldEchoCommand,
        loaded,
        unloaded,
        Reload,
        HelloWorldSecondSlashCommand
    ]
});
