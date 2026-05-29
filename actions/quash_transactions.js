const mysql = require("mysql2/promise");
const config = require("../config/config.json");

const pool = await mysql.createPool({
  host: config.mySQL.host,
  user: config.mySQL.user,
  password: config.mySQL.password,
  database: config.mySQL.database,
  port: config.mySQL.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  idleTimeout: 60000, // 60 seconds
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000 // 30 seconds
});

const con = await pool.getConnection();
await con.beginTransaction();

/**
 * "id","currencyid","userid","amount","timestamp","initatedbyuserid","reason"
    18,2,"355511166086414366",1.0,"2026-02-12 17:16:53","487085787326840843",
    20,2,"355511166086414366",-1.0,"2026-02-12 18:56:52","487085787326840843",
    21,2,"355511166086414366",1.0,"2026-02-12 18:57:17","487085787326840843",
    22,2,"487085787326840843",100.0,"2026-02-12 19:01:13","487085787326840843",
    23,2,"487085787326840843",-1.0,"2026-02-12 19:03:24","487085787326840843",   
 */

//insert into the transaction table a grouped transaction for old transactions that are more than a month old, grouping by currencyid, userid, and reason, and summing the amount, and setting the initatedbyuserid to null, and the timestamp to the current time
try {
  let [rows, fields] = await con.query(`INSERT INTO transaction (currencyid, userid, amount, \`timestamp\`, initatedbyuserid, reason) select currencyid, userid, sum(amount), NOW() as \`timestamp\`, null initatedbyuserid, reason from transaction group by currencyid, userid, reason WHERE \`timestamp\` < NOW() - INTERVAL 1 YEAR`);
  //delete the old transactions that are more than a month old
  await con.query(`DELETE FROM transaction WHERE \`timestamp\` < NOW() - INTERVAL 1 YEAR`);
} catch (error) {
  console.error("Error quashing transactions:", error);
  await con.rollback();
  con.release();
  return;
}
await con.commit();
con.release();

