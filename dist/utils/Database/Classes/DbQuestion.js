import { Collection } from "discord.js";
import { assertIsSnowflake, con } from "../DatabaseGeneral";
import { QuestionStatus } from "../Interfaces/DbQuestion";
export class DbQuestion {
    id;
    messageId;
    status;
    questionText;
    answerText;
    author;
    timestamp;
    users;
    flags;
    constructor(options) {
        this.id = options.id;
        this.messageId = options.messageId;
        this.status = options.status;
        this.questionText = options.questionText;
        this.answerText = options.answerText;
        this.author = options.author;
        this.timestamp = options.timestamp;
        this.users = options.users;
        this.flags = options.flags;
    }
    static async get(optionId) {
        let query = "SELECT `Question`.*, `QuestionFlagRelationship`.`questionFlagId`, `QuestionUserRelationship`.`discordUserId`, `QuestionUserRelationshipType`.`name` AS `relationshipType`, `QuestionFlag`.`name` AS `flag`, `Author`.`userId` AS `authorUserId` FROM `Question` LEFT JOIN `QuestionFlagRelationship` ON `QuestionFlagRelationship`.`questionId` = `Question`.`id` LEFT JOIN `QuestionUserRelationship` ON `QuestionUserRelationship`.`questionId` = `Question`.`id` LEFT JOIN `QuestionUserRelationshipType` ON `QuestionUserRelationship`.`questionUserRelationshipTypeId` = `QuestionUserRelationshipType`.`id` LEFT JOIN `QuestionFlag` ON `QuestionFlagRelationship`.`questionFlagId` = `QuestionFlag`.`id` LEFT JOIN `Author` ON `Question`.`answererAuthorId` = `Author`.`id`";
        if (typeof optionId == typeof 2) {
            query += "WHERE Question.id = " + con.escape(optionId) + ";";
        }
        else if (assertIsSnowflake(optionId.toString())) {
            query += "WHERE Question.messageId = " + con.escape(optionId) + ";";
        }
        else
            throw new Error("Improper question specifier, it must be a valid snowflake or a number");
        let questionRows = await new Promise((fulfill, reject) => {
            con.query(query, function (error, result) {
                if (!result || result == undefined) {
                    reject("No question with that id was found");
                }
                else {
                    let x = result[0];
                    if (!x || x == undefined)
                        fulfill([]);
                    else {
                        if (error)
                            reject(error);
                        else
                            fulfill(result);
                    }
                }
            });
        });
        let userRelationships = new Collection;
        let questionFlags = [];
        for (const row of questionRows) {
            if (!(userRelationships.find(r => r.relationships.includes(row.relationshipType) && row.discordUserId == r.id))) {
                if (userRelationships.has(row.discordUserId)) {
                    userRelationships.get(row.discordUserId)?.relationships.push(row.relationshipType);
                }
                else {
                    userRelationships.set(row.discordUserId, new DbQuestionUser({
                        id: row.discordUserId,
                        relationships: [row.relationshipType]
                    }));
                }
            }
            if (!questionFlags.includes(row.flag)) {
                questionFlags.push(row.flag);
            }
        }
        return new DbQuestion({
            id: questionRows[0].id,
            messageId: questionRows[0].messageId,
            status: QuestionStatus[questionRows[0].status],
            questionText: questionRows[0].questionText,
            answerText: questionRows[0].answerText,
            author: questionRows[0].authorUserId,
            timestamp: questionRows[0].timestamp,
            users: userRelationships,
            flags: questionFlags,
        });
    }
}
class DbQuestionUser {
    id;
    relationships;
    constructor(options) {
        this.id = options.id;
        this.relationships = options.relationships;
    }
}
