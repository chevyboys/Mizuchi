Each file or folder(?) in here is dedicated to a module of Icarus. 
Each module can contain multiple commands, and register event handlers, a clockwork function, init function, and unload function.
Each file in this folder should be capitalized as per the PascalCase standards. Module files should follow the naming convention of Module.{Category}.{Purpose}.js
Categories are sorted by the primary means users are inteded to interact with a feature:
* CommandInteraction: The generic category for things that rely on slash commands, or text commands  that have not yet been converted to slash commands
* Context menu: This should have the additional .User or .Message Sub categories to delineate which is which.
* Events: Things that are caused by an external event, rather then a user interaction.
* Infrastructure: Things that make the bot function. For example, registering commands