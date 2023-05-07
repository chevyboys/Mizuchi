import { Collection, Snowflake } from "discord.js";

export interface IDbClass {
    /*get: get,
    set: set,
    add: add,
    setAll: setAll,
    getAll: getAll*/
}

export interface IDbClassGet {
    (getter: Snowflake | string | number): IDbClass | undefined
}

export interface IDbClassSet {
    (Object: IDbClass): void
}

export interface IDbClassAdd {
    (options: any): IDbClass
}

export interface IDbClassSetAll {
    (source: any): void
}

export interface IDbClassGetAll {
    (): Collection<any, any> | Array<any>
}