import dotenv from 'dotenv';
import assert from 'node:assert';

dotenv.config();

export const token = process.env['DISCORD_TOKEN']!;
assert(token, "DISCORD_TOKEN environment variable is not set");