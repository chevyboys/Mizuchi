import { BotClient } from "./base.mts";
import { token } from './env.mts';

const client = new BotClient(token);

client.start();
