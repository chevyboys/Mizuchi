import * as mysql from "mysql";
import * as Discord from "discord.js";
import { configOptions } from "../../config/config";
import { IChironClient } from "chironbot/dist/Headers/Client";
import { Collection, Snowflake } from "discord.js";
let hasBeenInitialized = false;
export const con = mysql.createConnection(configOptions.database.mysql);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const days = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]
export let clientPrimaryInstance: IChironClient;


export function cleanString(str: string) {
    return str.replace(/[\W_]+/g, " ");;
}
export function assertIsSnowflake(snowflake: string) {
    let discordEpoch = Date.parse("01 Jan 2015 00:00:00 GMT");
    let timestamp = new Date(Discord.SnowflakeUtil.timestampFrom(snowflake)).getTime()
    if (!/^\d+$/.test(snowflake) || timestamp <= discordEpoch || timestamp > Date.now()) {
        return false
    } else return true;
}

export function assertIsCakeDay(string: string) {
    if (string == "opt-out") return true;
    if (string.length == 6 || string.length == 5 || string.length == 7) {
        let parts = string.split(" ");
        if (parts.length == 2 && months.includes(parts[0].replace(" ", "")) && days.includes(parts[1].replace(" ", ""))) {
            return true
        }
    }
    throw (string + ":" + JSON.stringify(string) + " is not a valid CakeDay")
}

export function initialize(client: IChironClient) {
    hasBeenInitialized = true;
    clientPrimaryInstance = client;
}