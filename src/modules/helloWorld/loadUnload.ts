import { ChironClient, ModuleOnLoadComponent, ModuleOnUnloadComponent, SlashCommandComponent } from "chironbot";
import { SlashCommandBuilder } from "discord.js";
export let HelloWorldUnregisterSlashCommand = new SlashCommandComponent({
    builder: new SlashCommandBuilder().setName('unregister').setDescription('jetisons this module'),
    enabled: true,
    category: "main",
    permissions: (interaction) => { return true; },
    process: async (interaction) => {
        if (HelloWorldUnregisterSlashCommand.module?.client instanceof ChironClient)
            await HelloWorldUnregisterSlashCommand.module?.client?.modules.unregister(HelloWorldUnregisterSlashCommand.module);
        interaction.isRepliable() ? await interaction.reply("Jettison the module!") : console.error("could not reply");
        console.log("Jettisoned")
    }
});
export let Reload = new SlashCommandComponent({
    builder: new SlashCommandBuilder().setName('reload').setDescription('reloads all modules'),
    enabled: true,
    category: "main",
    permissions: (interaction) => { return true; },
    process: async (interaction) => {
        if (interaction.isRepliable()) interaction.deferReply()
        if (Reload.module?.client instanceof ChironClient)
            await Reload.module?.client?.modules.reload();
        interaction.isRepliable() ? await interaction.editReply("Reloaded the modules!") : console.error("could not reply");
        console.log("Reloaded all modules");
    }

})
export let loaded = new ModuleOnLoadComponent({
    enabled: true,
    process: (inputString) => {
        console.log(inputString || "initialized");
    }
})

export let unloaded = new ModuleOnUnloadComponent({
    enabled: true,
    process: () => {
        console.log("unloading");
        return "Reloaded";
    }
})

