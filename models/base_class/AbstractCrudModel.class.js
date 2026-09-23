const Augur = require("augurbot");
const mysql = require("mysql2/promise"); // Updated to mysql2
const Discord = require("discord.js");
const { errorHandler } = require("./Utils.Error");
const { webhook } = require("./Webhook");
const {AugurClient} = require("augurbot");

/**
 * @member AugurClient client
 */
class AbstractCrudModel {
  /**
   * @type AugurClient
   */
  static client;
  /**
   * @type mysql.Pool
   */
  static pool;
  #id;

  constructor(id) {
    if (new.target === AbstractCrudModel) {
      throw new Error("Cannot instantiate an abstract class directly.")
    }

    if (!(this.constructor.client instanceof AugurClient)){
      throw new Error("No client available, cannot access database");
    }

    const isMysql2Pool =
      this.constructor.pool &&
      typeof this.constructor.pool === 'object' &&
      typeof this.constructor.pool.getConnection === 'function' &&
      typeof this.constructor.pool.query === 'function' &&
      typeof this.constructor.pool.execute === 'function';

    if (!isMysql2Pool) {
      this.constructor.pool = mysql.createPool({
        host: this.constructor.client.config.mySQL.host,
        user: this.constructor.client.config.mySQL.user,
        password: this.constructor.client.config.mySQL.password,
        database: this.constructor.client.config.mySQL.database,
        port: this.constructor.client.config.mySQL.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        idleTimeout: 60000, // 60 seconds
        enableKeepAlive: true,
        keepAliveInitialDelay: 30000 // 30 seconds
      });
    }

    this.#id = id;
  }

  //create
  static async create() {
    throw new Error(`${this.constructor.name}.create() is not implemented`);
  }

  //read
  static get() {
    throw new Error(`${this.constructor.name}.get() is not implemented`);
  }

  static async fetch() {
    throw new Error(`${this.constructor.name}.fetch() is not implemented`);
  }

  //update
  async save() {
    throw new Error(`${this.constructor.name}.update() is not implemented`);
  }

  //delete
  async delete() {
    throw new Error(`${this.constructor.name}.delete() is not implemented`);
  }



}

module.exports = AbstractCrudModel;