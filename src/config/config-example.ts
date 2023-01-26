
export const configOptions = {
    adminIds: [""],
    database: {},
    repo: new URL(""),
    token: "",
    adminServer: "",
    DEBUG: true
};

let roleConfigOptionsBase = configOptions
roleConfigOptionsBase.token = ""

export const roleConfigOptions = roleConfigOptionsBase;