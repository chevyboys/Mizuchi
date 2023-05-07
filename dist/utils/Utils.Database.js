/*export { DbGuildWelcomeTypes, DbGuildRoleDuty, DbGuildEmojiDuty } from "./Database/Interfaces/DbGuild";

export { QuestionStatus, QuestionUserRelationship, QuestionFlag } from "./Database/Interfaces/DbQuestion";

export { DbQuestion as Question } from "./Database/Classes/DbQuestion";

export { DbUser as User } from "./Database/Classes/DbUser";

export { DbGuild as Guild } from "./Database/Classes/DbGuild";*/
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export { prisma as Database };
