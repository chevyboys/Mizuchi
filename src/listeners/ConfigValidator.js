const { Listener } = require('@sapphire/framework');
const u = require("../utilities/General");


/**
 * function fieldMismatches
 * @param {Object} obj1 First object for comparison
 * @param {Object} obj2 Second object for comparison
 * @returns String[] Two-element array. The first contains keys found in first object but not the second. The second contains keys found in the second object but not the first.
 */
function fieldMismatches(obj1, obj2) {
    const keys1 = new Set(Object.keys(obj1));
    const keys2 = new Set(Object.keys(obj2));

    const m1 = [];
    const m2 = [];
    for (const key of keys1) {
        if (keys2.has(key)) {
            if (obj1[key] != null && !Array.isArray(obj1[key]) && typeof obj1[key] === "object") {
                const [m_1, m_2] = fieldMismatches(obj1[key], obj2[key]);
                for (const m of m_1) {
                    m1.push(key + "." + m);
                }
                for (const m of m_2) {
                    m2.push(key + "." + m);
                }
            }
            keys2.delete(key);
        } else {
            m1.push(key);
        }
    }
    for (const key of keys2) {
        if (keys1.has(key)) {
            if (obj1[key] != null && typeof obj1[key] === "object") {
                const [m_1, m_2] = fieldMismatches(obj1[key], obj2[key]);
                for (const m of m_1) {
                    m1.push(key + "." + m);
                }
                for (const m of m_2) {
                    m2.push(key + "." + m);
                }
            }
        } else {
            m2.push(key);
        }
    }

    return [m1, m2];
}

class ReadyListener extends Listener {
    constructor(context, options) {
        super(context, {
            ...options,
            once: false,
            event: 'ready'
        });
    }
    run() {
        try {
            const requiredHidden = [
              "../../config/config",
              "../../config/snowflakes",
            ];
            for (const filename of requiredHidden) {
              const prod = require(filename + ".json");
              const repo = require(filename + "-example.json");
              // console.log(`Checking ${filename}`);
              const [m1, m2] = fieldMismatches(prod, repo);
              if (m1.length > 0) {
                u.errorLog.send({ embeds: [
                  u.embed()
                  .addField("Config file and example do not match.", `Field(s) \`${m1.join("`, `")}\` in file ${filename + ".json"} but not example file.`)
                ] });
              }
              if (m2.length > 0) {
                u.errorLog.send({ embeds: [
                  u.embed()
                  .addField("Config file and example do not match.", `Field(s) \`${m2.join("`, `")}\` in example file but not ${filename + ".json"}`)
                ] });
              }
            }
          } catch (e) {
            u.errorHandler(e, "Error in Config Validation");
          }
    }
}

module.exports = {
    ReadyListener
};