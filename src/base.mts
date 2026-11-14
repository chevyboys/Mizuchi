import { Client, Events, GatewayIntentBits } from "discord.js";
import { AppDataSource } from "./database/dataSource.js";

const options = {
  intents: [GatewayIntentBits.Guilds],
};

export class BotClient {
  private client: Client;
  private token: string;

  public constructor(token: string) {
    this.client = new Client(options);
    this.token = token;
  }

  public start() {
    // When the client is ready, run this code (only once).
    // The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
    // It makes some properties non-nullable.

    // This initializes our connection to the DB. 
    // I'm unsure if this is the ideal place to put it due to my unfamiliarity with discord bots, 
    // but it should essentially run exactly once when the bot is starting up, before it does anything remotely related to the DB
    // -L0b
    AppDataSource.initialize()
      .then(() => {
        console.log("Data Source has been initialized dynamically!");
      })
      .catch((err) => {
        console.error("Error during Data Source initialization", err);
      });

    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });
    this.client.login(this.token);
  }
}
