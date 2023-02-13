import { Collection, Snowflake } from "discord.js";
import { IDbGuildAuthor } from "./DbAuthor";
import { IDbClass } from "./DbGeneral";


export interface IDbQuestion extends IDbClass {
    id: number,
    messageId: Snowflake,
    status: QuestionStatus,
    questionText: string,
    answerText: string,
    author: Snowflake,
    timestamp: Date,
    users: Collection<Snowflake, IDbQuestionUser>,
    flags: QuestionFlag[]
}

export enum QuestionStatus {
    Discarded,
    Answered,
    Queued
}

export enum QuestionFlag {
    unansweredButTransfered,
    RAFOed,
}

export interface IDbQuestionUser {
    id: Snowflake,
    relationships: Array<QuestionUserRelationship>
}

export enum QuestionUserRelationship {
    Voter,
    Asker,
    Editor,
}