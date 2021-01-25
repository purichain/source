//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const util = require('./../utils/commonUtil.js');
const dbUtil = require('./../db/dbUtil.js');
const logger = require('./../utils/winlog.js');
const debug = require("./../utils/debug.js");

//
const procedureQuerys = {
    scQuerys: [
        "DROP PROCEDURE IF EXISTS SET_DB_KEY_INDEX",
        "CREATE PROCEDURE SET_DB_KEY_INDEX (IN _DBKeyString VARCHAR(20)) "
        + "BEGIN " 
        + "DECLARE _bigintDBkey BIGINT UNSIGNED; "
        + "DECLARE _stmt VARCHAR(1024); "
        + "SET _bigintDBkey = (SELECT CAST(_DBKeyString AS UNSIGNED INT)); "
        + "SET @SQL := CONCAT('ALTER TABLE sc_contents AUTO_INCREMENT = ', _bigintDBkey); " 
        + "PREPARE _stmt FROM @SQL; "
        + "EXECUTE _stmt; "
        + "DEALLOCATE PREPARE _stmt; "
        + "END"
    ]
}

const createDbNames = {
    "sc" : "sc",
    "block" : "block",
    "account" : "account",
}

module.exports.createTableNames = {
    scQuerys : [
        "sc_contents",
        "sc_delayed_txs",
    ],
    blockQuerys : [
        "blk_txs",
    ],
    blockShardQuerys : [
        "blk_contents",
    ],
    accountQuerys : [
        "account_tokens",
        "account_users",
        "account_ledgers",
        "account_balance",
    ]
}

const createTableFields = {
    scQuerys : [
        // sc_contents
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL,"
        + "`create_tm` bigint(20) unsigned zerofill NOT NULL COMMENT 'Contract Create Time', "
        // + "`prv_db_key` bigint(20) unsigned zerofill NOT NULL,"
        // + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number', "
        + "`db_key` bigint(20) unsigned zerofill NOT NULL AUTO_INCREMENT,"
        + "`confirmed` tinyint(3) NOT NULL DEFAULT 0,"
        + "`from_account` bigint(20) unsigned zerofill NOT NULL,"
        + "`to_account` bigint(20) unsigned zerofill NOT NULL,"
        + "`type` int(11) unsigned NOT NULL DEFAULT 0,"
        + "`dst_account` bigint(20) unsigned zerofill NOT NULL,"
        + "`amount` text NOT NULL,"
        + "`signed_pubkey` text NOT NULL COMMENT 'Signed Public Key', "
        + "`err_code` smallint(5) NOT NULL DEFAULT 0,"
        + "`contract` json DEFAULT NULL,"
        + "PRIMARY KEY (`db_key`, `subnet_id`) USING BTREE",

        // sc_delayed_txs
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL,"
        + "`idx` bigint(20) unsigned NOT NULL AUTO_INCREMENT,"
        + "`create_tm` bigint(20) unsigned zerofill NOT NULL COMMENT 'Contract Create Time', "
        + "`executed` tinyint(1) NOT NULL DEFAULT 0,"
        + "`from_account` bigint(20) unsigned zerofill NOT NULL,"
        + "`to_account` bigint(20) unsigned zerofill NOT NULL,"
        + "`type` int(11) unsigned NOT NULL DEFAULT 0,"
        + "`amount` text NOT NULL,"
        + "`signed_pubkey` text NOT NULL COMMENT 'Signed Public Key', "
        // + "`err_code` smallint(5) NOT NULL DEFAULT 0,"
        + "`contract` json DEFAULT NULL,"
        + "PRIMARY KEY (`idx`, `executed`, `to_account`, `from_account`, `type`, `subnet_id`) USING BTREE",
    ],
    blockQuerys : [
        // blk_txs
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number', "
        + "`db_key` bigint(20) unsigned zerofill NOT NULL COMMENT 'DB Key', "
        + "`sc_hash` text NOT NULL COMMENT 'Transaction Hash', "
        // + "KEY `sc_hash` (`sc_hash`(64)) USING BTREE, "
        + "PRIMARY KEY (`db_key`, `blk_num`, `sc_hash`(64), `subnet_id`) USING BTREE",
    ],
    blockShardQuerys : [
        // blk_contents
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number',"
        + "`p2p_addr` bigint(20) unsigned zerofill NOT NULL COMMENT 'BP P2PAddrss', "
        + "`bgt` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Genration Time', "
        + "`pbh` text NOT NULL COMMENT 'Previous Block Hash', "
        + "`tx_cnt` int(11) unsigned zerofill NOT NULL COMMENT 'Number of transaction the block has', "
        + "`blk_hash` text NOT NULL COMMENT 'Block Hash', "
        + "`sig` text NOT NULL COMMENT 'Signature of BP',"
        + "`pubkey` text NOT NULL COMMENT 'Signed Public Key',"
        + "`bct`  bigint(20) unsigned, "
        // + "KEY `blk_hash` (`blk_hash`(64)) USING BTREE, "
        + "PRIMARY KEY (`blk_num`, `blk_hash`(64), `subnet_id`) USING BTREE",
    ],
    accountQuerys : [
        // account_tokens
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`create_tm` bigint(20) unsigned zerofill NOT NULL COMMENT 'Contract Create Time', "
        + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number', "
        + "`db_key` bigint(20) unsigned zerofill NOT NULL COMMENT 'DB Key', "
        //+ "`confirmed` tinyint(3) DEFAULT 0,"
        + "`owner_pk` text NOT NULL COMMENT 'Owner Public Key', "
        + "`super_pk` text NOT NULL COMMENT 'Super Owner Public Key', "
        //+ "`signed_pubkey` text NOT NULL COMMENT 'Signed Public Key', "
        + "`account_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Account Number', "
        + "`type` int(11) unsigned NOT NULL DEFAULT 0, "
        + "`name` text DEFAULT NULL, "
        + "`symbol` text DEFAULT NULL, "
        + "`total_supply` text DEFAULT 0 NOT NULL, "
        + "`market_supply` text DEFAULT 0 NOT NULL, "
        + "`decimal_point` smallint(5) unsigned DEFAULT 0 NOT NULL, "
        + "`lock_time_from` bigint(20) unsigned zerofill NOT NULL COMMENT 'Lock Time From', "
        + "`lock_time_to` bigint(20) unsigned zerofill NOT NULL COMMENT 'Lock Time To', "
        + "`lock_transfer` tinyint(3) DEFAULT 0 NOT NULL,"
        + "`black_list` json DEFAULT NULL, "
        + "`functions` longtext DEFAULT NULL, "
        + "PRIMARY KEY (`account_num`, `owner_pk`(64), `super_pk`(64), `blk_num`, `db_key`, `subnet_id`) USING BTREE",
        
        // account_users
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`create_tm` bigint(20) unsigned zerofill NOT NULL COMMENT 'Contract Create Time', "
        + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number', "
        + "`db_key` bigint(20) unsigned zerofill NOT NULL COMMENT 'DB Key', "
        //+ "`confirmed` tinyint(3) DEFAULT 0,"
        + "`owner_pk` text NOT NULL COMMENT 'Owner Public Key', "
        + "`super_pk` text NOT NULL COMMENT 'Super Owner Public Key', "
        //+ "`signed_pubkey` text NOT NULL COMMENT 'Signed Public Key', "
        + "`account_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Account Number', "
        + "`account_id` text DEFAULT NULL,"
        + "PRIMARY KEY (`account_num`, `owner_pk`(64), `super_pk`(64), `blk_num`, `db_key`, `subnet_id`) USING BTREE",

        // account_ledgers
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`idx` bigint(20) unsigned NOT NULL AUTO_INCREMENT,"
        + "`create_tm` bigint(20) unsigned zerofill NOT NULL COMMENT 'Contract Create Time', "
        + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number', "
        + "`db_key` bigint(20) unsigned zerofill NOT NULL COMMENT 'DB Key', "
        //+ "`confirmed` tinyint(3) DEFAULT 0,"
        //+ "`signed_pubkey` text NOT NULL COMMENT 'Signed Public Key', "
        + "`my_account_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Sending Account Number', "
        //+ "`from_to` tinyint(3) DEFAULT NULL,"
        + "`account_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Receved Account Number', "
        + "`type` int(11) unsigned NOT NULL DEFAULT 0,"
        + "`amount` text DEFAULT NULL, "
        + "`balance` text DEFAULT NULL, "
        + "KEY `balance` (`my_account_num`, `create_tm`) USING BTREE, "
        + "PRIMARY KEY (`idx`, `my_account_num`, `blk_num`, `create_tm`, `db_key`, `type`, `subnet_id`) USING BTREE",

        // account_balance
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`idx` bigint(20) unsigned NOT NULL AUTO_INCREMENT,"
        + "`cfmd_tm` bigint(20) unsigned zerofill NOT NULL COMMENT 'Confirmed Time', "
        + "`cfmd_blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Confirmed Block Number', "
        + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number', "
        + "`db_key` bigint(20) unsigned zerofill NOT NULL COMMENT 'DB Key', " 
        + "`my_account_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Sending Account Number', "
        + "`type` int(11) unsigned NOT NULL DEFAULT 0,"
        + "`balance` text DEFAULT NULL, "
        + "PRIMARY KEY (`idx`, `my_account_num`, `blk_num`, `cfmd_tm`, `db_key`, `type`, `subnet_id`) USING BTREE",
    ]
}

const tableAppendix = {
    "tableName" : `myTableName`,
    "appendix" : `myAppendix`,
    "shard_exp" : `_shard`,
    "innoDB" : `ENGINE=InnoDB`,
    "spider" : `ENGINE=spider COMMENT='wrapper "mysql", table`,
    "partition" : `PARTITION BY KEY (subnet_id)`,
}

module.exports.createTables = {
    scQuerys : [
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.scQuerys[0]
        + `) ${tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.scQuerys[1]
        + `) ${tableAppendix.appendix}`,
    ],
    blockQuerys : [
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.blockQuerys[0]
        + `) ${tableAppendix.appendix}`,
    ],
    blockShardQuerys : [
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.blockShardQuerys[0]
        + `) ${tableAppendix.appendix}`,
    ],
    accountQuerys : [
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.accountQuerys[0]
        + `) ${tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.accountQuerys[1]
        + `) ${tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.accountQuerys[2]
        + `) ${tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${tableAppendix.tableName} (`
        + createTableFields.accountQuerys[3]
        + `) ${tableAppendix.appendix}`,
    ]
}

module.exports.querys = {
    // sc database
    sc : {
        "createSC" : "CREATE DATABASE IF NOT EXISTS `sc`",
        "useSC" : "USE `sc`",
        //
        "truncateScContents" : `TRUNCATE sc.${this.createTableNames.scQuerys[0]}`,
        "truncateScDelayedTxs" : `TRUNCATE sc.${this.createTableNames.scQuerys[1]}`,
        "DBKeySet" : `CALL SET_DB_KEY_INDEX(?)`,
        //
        "insertScContents" : `INSERT INTO sc.sc_contents(subnet_id, create_tm, confirmed, from_account, to_account, type, amount, signed_pubkey, err_code, contract) VALUES `,
        "insertScDelayedTxs" : `INSERT INTO sc.sc_delayed_txs(subnet_id, create_tm, executed, from_account, to_account, type, dst_account, amount, signed_pubkey, contract) VALUES `,
        // "selectScContents" : `SELECT c.db_key, c.contract FROM sc.sc_contents AS c, block.blk_txs AS i WHERE blk_num = ? AND c.db_key = i.db_key`,
        "selectAccountTypeScDelayedTxs" : `SELECT * FROM sc.sc_delayed_txs WHERE executed = 0 AND from_account = ? AND to_account = ? AND type = ?`,
        "selectTmScDelayedTxs" : `SELECT * FROM sc.sc_delayed_txs WHERE executed = 0 AND create_tm >= ?`,
    }, 
    // block database
    block : {
        "createBlock" : "CREATE DATABASE IF NOT EXISTS `block`",
        "useBlock" : "USE `block`",
        "truncateBlkTxs" : `TRUNCATE block.${this.createTableNames.blockQuerys[0]}`,
        //
        "insertBlkTxs" : `INSERT INTO block.blk_txs(subnet_id, blk_num, db_key, sc_hash) VALUES `,
        "selectDbKeyBlkTxs" : `SELECT MIN(db_key), MAX(db_key) FROM block.blk_txs WHERE blk_num = ?`,
        "selectLastBlkNumBlkContents" : `SELECT MAX(blk_num) as max_blk_num FROM block.blk_contents`,
    }, 
    // account database
    account : {
        "createAccount" : "CREATE DATABASE IF NOT EXISTS `account`",
        "useAccount" : "USE `account`",
        "truncateAccountTokens" : `TRUNCATE account.${this.createTableNames.accountQuerys[0]}`,
        "truncateAccountUsers" : `TRUNCATE account.${this.createTableNames.accountQuerys[1]}`,
        "truncateAccountLedgers" : `TRUNCATE account.${this.createTableNames.accountQuerys[2]}`,
        "truncateAccountBalance" : `TRUNCATE account.${this.createTableNames.accountQuerys[3]}`,
        //
        "insertAccountTokens" : `INSERT INTO account.account_tokens(subnet_id, create_tm, blk_num, db_key, owner_pk, super_pk, account_num, type, name, symbol, total_supply, market_supply, decimal_point, lock_time_from, lock_time_to, lock_transfer, black_list, functions) VALUES `,
        "insertAccountUsers" : `INSERT INTO account.account_users(subnet_id, create_tm, blk_num, db_key, owner_pk, super_pk, account_num, account_id) VALUES `,
        "insertAccountLedgers" : `INSERT INTO account.account_ledgers(subnet_id, create_tm, blk_num, db_key, my_account_num, account_num, type, amount, balance) VALUES `,
        "insertAccountBalance" : `INSERT INTO account.account_balance(subnet_id, cfmd_tm, cfmd_blk_num, blk_num, db_key, my_account_num, type, balance) VALUES `,
        //
        "updateAccountTokenMrktSply" : "UPDATE account.account_tokens SET market_supply = ? WHERE type = ?",
        "updateAccountBalance" : "UPDATE account.account_balance SET cfmd_tm = ?, cfmd_blk_num = ?, blk_num = ?, db_key = ?, balance = ? WHERE my_account_num = ? and type = ?",
        //
        "selectAccountTokenT" : `SELECT * FROM account.account_tokens WHERE type = ? ORDER BY blk_num DESC LIMIT 1`,
        "selectAccountTokenTNS" : `SELECT * FROM account.account_tokens WHERE type = ? OR name = ? OR symbol = ? ORDER BY blk_num DESC LIMIT 1`,
        "selectAccountTokenKey" : `SELECT * FROM account.account_tokens WHERE owner_pk = ? OR super_pk = ? OR owner_pk = ? OR super_pk = ? ORDER BY blk_num DESC LIMIT 1`,
        "selectAccountTokenAccount" : `SELECT * FROM account.account_tokens WHERE account_num = ? ORDER BY blk_num DESC LIMIT 1`,
        "selectAccountUserAccount" : `SELECT * FROM account.account_users WHERE account_num = ? ORDER BY blk_num DESC LIMIT 1`, 
        "selectAccountUser" : `SELECT * FROM account.account_users WHERE owner_pk = ? OR super_pk = ? OR owner_pk = ? OR super_pk = ? OR account_id = ? ORDER BY blk_num DESC LIMIT 1`,
        "selectAccountUserKey" : `SELECT * FROM account.account_users WHERE owner_pk = ? OR super_pk = ? OR owner_pk = ? OR super_pk = ? ORDER BY blk_num DESC LIMIT 1`, 
        "selectAccountLeger" : `SELECT * FROM account.account_ledgers WHERE blk_num > 0 AND my_account_num = ? AND type = ?`,
        "selectAccountBalanceType" : `SELECT * FROM account.account_balance WHERE my_account_num = ? and type = ?`, 
        "selectAccountBalanceSubNetId" : `SELECT * FROM account.account_balance WHERE subnet_id = ?`, 
    }, 
};

const dropScDB = async () => {
    let sql = "DROP DATABASE IF EXISTS `sc`";
    await dbUtil.query(sql);
}

const truncateScDB = async () => {
    let sql;

    sql = this.querys.sc.truncateScContents;
    await dbUtil.query(sql);

    sql = this.querys.sc.truncateScDelayedTxs;
    await dbUtil.query(sql);
}

const truncateBlockDB = async () => {
    let sql;

    sql = this.querys.block.truncateBlkTxs;
    await dbUtil.query(sql);
}

const truncateAccountDB = async () => {
    let sql;

    // sql = this.querys.account.useAccount;
    // await dbUtil.query(sql);

    sql = this.querys.account.truncateAccountTokens;
    await dbUtil.query(sql);

    sql = this.querys.account.truncateAccountUsers;
    await dbUtil.query(sql);

    sql = this.querys.account.truncateAccountLedgers;
    await dbUtil.query(sql);

    sql = this.querys.account.truncateAccountBalance;
    await dbUtil.query(sql);
}

const truncate = async () => {
    if(config.DB_TEST_MODE) {
        await truncateScDB();
        await truncateBlockDB();
        await truncateAccountDB();
    }
}
// module.exports.truncate = truncate;

const initDatabaseSC = async () => {
    let ret;
    const conn = await dbUtil.getConn();

    try {
        let sql = this.querys.sc.createSC;
        logger.debug("createSC : " + sql);
        await conn.query(sql);

        sql = this.querys.sc.useSC;
        await conn.query(sql);

        await util.asyncForEach(this.createTables.scQuerys, async(element, index) => {
            //logger.debug("element : " + element);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.tableName}`, this.createTableNames.scQuerys[index]);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.appendix}`, dbUtil.tableAppendix.innoDB);
            // logger.debug("scQuerys : " + element);
            await conn.query(element);
        });

        // ????????????????
        await util.asyncForEach(procedureQuerys.scQuerys, async(element, index) => {
            await conn.query(element);
        })

        if(config.DB_TEST_MODE) {
            await truncateScDB();
        }
        
        ret = { res : true };
        logger.info("Database Init - sc");
    } catch (err) {
        debug.error(err);
        ret = { res : false, reason : JSON.stringify(err)};
    }

    await dbUtil.releaseConn(conn);

    return ret;
}

const initDatabaseBlock = async () => {
    let ret;
    const conn = await dbUtil.getConn();

    try {
        let sql = this.querys.block.createBlock;
        await conn.query(sql);

        sql = this.querys.block.useBlock;
        await conn.query(sql);

        await util.asyncForEach(this.createTables.blockQuerys, async(element, index) => {
            //logger.debug("element : " + element);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.tableName}`, this.createTableNames.blockQuerys[index]);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.appendix}`, dbUtil.tableAppendix.innoDB);
            // logger.debug("blockQuerys : " + element);
            await conn.query(element);
        });

        if(config.DB_TEST_MODE) {
            await truncateBlockDB();
        }

        ret = { res : true };
        logger.info("Database Init - block");
    } catch (err) {
        debug.error(err);
        ret = { res : false, reason : JSON.stringify(err)};
    }

    await dbUtil.releaseConn(conn);

    return ret;
}

const initDatabaseAccount = async () => {
    let ret;
    const conn = await dbUtil.getConn();

    try {
        let sql = this.querys.account.createAccount;
        await conn.query(sql);

        sql = this.querys.account.useAccount;
        await conn.query(sql);

        await util.asyncForEach(this.createTables.accountQuerys, async(element, index) => {
            //logger.debug("element : " + element);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.tableName}`, this.createTableNames.accountQuerys[index]);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.appendix}`, dbUtil.tableAppendix.innoDB);
            // logger.debug("accountQuerys : " + element);
            await conn.query(element);
        });

        if(config.DB_TEST_MODE) {
            await truncateAccountDB();
        }

        ret = { res : true };
        logger.info("Database Init - account");
    } catch (err) {
        debug.error(err);
        ret = { res : false, reason : JSON.stringify(err)};
    }

    await dbUtil.releaseConn(conn);

    return ret;
}

module.exports.initDatabaseNN = async () => {
    await initDatabaseSC();
    await initDatabaseBlock();
    await initDatabaseAccount();
}