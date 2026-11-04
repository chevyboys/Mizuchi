import { Client, Events, GatewayIntentBits } from "discord.js";

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
    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });
    this.client.login(this.token);
  }
}
