//
const config = require('../../config/config.js');
const define = require('./../../config/define.js');
const util = require('./../utils/commonUtil.js');
const dbUtil = require("./../db/dbUtil.js");
const logger = require('./../utils/winlog.js');

//
const createDbNames = {
    "is" : "is",
}

const createTableNames = {
    isQuerys : [
        "cluster_info",
        "hub_info",
        "node_hw_info",
        "node_cons_info",
        "revision",
        "repl_info",
        "kafka_info",
    ]
}

const createTableFields = {
    isQuerys : [
        // cluster_info
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`ip` int(11) unsigned NOT NULL, "
        + "`role` tinyint(3) unsigned NOT NULL, "
        + "`sn_hash` text NOT NULL, "
        + "`cluster_p2p_addr` text NOT NULL, "
        + "PRIMARY KEY (`ip`, `subnet_id`) USING BTREE",

        // hub_info
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`hub_code` smallint(5) unsigned NOT NULL AUTO_INCREMENT, "
        + "`name` text NOT NULL, "
        + "`latitude` text NOT NULL, "
        + "`longitude` text NOT NULL, "
        + "`country` text , "
        + "`city` text , "
        + "`hub_p2p_addr` text NOT NULL, "
        + "PRIMARY KEY (`hub_code`, `subnet_id`) USING BTREE",

        // node_hw_info
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`ip` int(11) unsigned NOT NULL, "
        + "`join_time` bigint(20) unsigned NOT NULL, "
        + "`sn_hash` text NOT NULL, "
        + "`ip_list` text NOT NULL, "
        + "`lan_speed_list` text NOT NULL, "
        + "`cpu` text NOT NULL, "
        + "`hdd_size` text, "
        + "`hdd_raid` text, "
        + "`ssd_size` text, "
        + "`ssd_raid` text, "
        + "`nvme_size` text, "
        + "`nvme_raid` text, "
        + "`mem_size` text NOT NULL, "
        + "`mem_speed` int(11) unsigned NOT NULL, "
        + "`lan_check` tinyint(1) unsigned NOT NULL, "
        + "`raid_check` tinyint(1) unsigned NOT NULL, "
        + "`virtual_check1` tinyint(1) unsigned NOT NULL, "
        + "`virtual_check2` tinyint(1) unsigned NOT NULL, "
        + "`total_prr` smallint(5) unsigned zerofill NOT NULL, "
        + "PRIMARY KEY (`ip`, `subnet_id`) USING BTREE",

        // node_cons_info
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`idx` smallint(5) unsigned NOT NULL AUTO_INCREMENT, "
        + "`ip` int(11) unsigned NOT NULL, "
        + "`p2p_addr` text, "
        + "`role` tinyint(3) unsigned NOT NULL, "
        + "`state` tinyint(1) NOT NULL, "
        + "`kafka_idx` smallint(5), "
        + "`hub_code` smallint(5), "
        + "`public_key` text NOT NULL, "
        + "`w_public_key` text NOT NULL, "
        + "PRIMARY KEY (`idx`, `role`, `subnet_id`) USING BTREE",

        // revision
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`idx` smallint(5) unsigned NOT NULL AUTO_INCREMENT, "
        + "`update_time` bigint(20) unsigned NOT NULL , "
        + "`rr_net` json DEFAULT NULL, "
        + "`nn_node` json DEFAULT NULL, "
        + "PRIMARY KEY (`idx`, `subnet_id`) USING BTREE",

        // repl_info
          "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`idx` smallint(5) unsigned NOT NULL AUTO_INCREMENT, "
        + "`blk_num` bigint(20) unsigned zerofill NOT NULL COMMENT 'Block Number', "
        + "`ip` text NOT NULL, "
        + "`role` tinyint(3) unsigned NOT NULL, "
        + "`log_file` text NOT NULL, "
        + "`log_pos` text NOT NULL, "
        + "`cluster_p2p_addr` text NOT NULL, "
        // + "`repl_data` json DEFAULT NULL,"
        + "PRIMARY KEY (`idx`, `blk_num`, `role`, `subnet_id`) USING BTREE",

        // kafka_info
        "`subnet_id` smallint(5) unsigned zerofill NOT NULL, "
        + "`idx` smallint(5) unsigned NOT NULL AUTO_INCREMENT, "
        + "`broker_list` text NOT NULL , "
        + "`topic_list` text, "
        + "PRIMARY KEY (`idx`, `subnet_id`) USING BTREE",
    ]
}

const createTables = {
    isQuerys : [
        `CREATE TABLE IF NOT EXISTS ${dbUtil.tableAppendix.tableName} (`
        + createTableFields.isQuerys[0]
        + `) ${dbUtil.tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${dbUtil.tableAppendix.tableName} (`
        + createTableFields.isQuerys[1]
        + `) ${dbUtil.tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${dbUtil.tableAppendix.tableName} (`
        + createTableFields.isQuerys[2]
        + `) ${dbUtil.tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${dbUtil.tableAppendix.tableName} (`
        + createTableFields.isQuerys[3]
        + `) ${dbUtil.tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${dbUtil.tableAppendix.tableName} (`
        + createTableFields.isQuerys[4]
        + `) ${dbUtil.tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${dbUtil.tableAppendix.tableName} (`
        + createTableFields.isQuerys[5]
        + `) ${dbUtil.tableAppendix.appendix}`,
        `CREATE TABLE IF NOT EXISTS ${dbUtil.tableAppendix.tableName} (`
        + createTableFields.isQuerys[6]
        + `) ${dbUtil.tableAppendix.appendix}`,
    ]
}

module.exports.querys = {
    // is database
    "createIS" : "CREATE DATABASE IF NOT EXISTS `is`",
    "dropIS" : "DROP DATABASE IF EXISTS `is`",
    "useIS" : "USE `is`",

    //
    "truncateIsClusterInfo" : "TRUNCATE `is`." + `${createTableNames.isQuerys[0]}`,
    "truncateIsHubInfo" : "TRUNCATE `is`." + `${createTableNames.isQuerys[1]}`,
    "truncateIsNodeHwInfo" : "TRUNCATE `is`." + `${createTableNames.isQuerys[2]}`,
    "truncateIsNodeInfo" : "TRUNCATE `is`." + `${createTableNames.isQuerys[3]}`,
    "truncateIsRevision" : "TRUNCATE `is`." + `${createTableNames.isQuerys[4]}`,
    "truncateIsReplInfo" : "TRUNCATE `is`." + `${createTableNames.isQuerys[5]}`,
    "truncateIsKafkaInfo" : "TRUNCATE `is`." + `${createTableNames.isQuerys[6]}`,

    node_cons_info : {
        //
        insert_node_cons_info: "INSERT INTO is.node_cons_info(subnet_id, ip, p2p_addr, role, state, kafka_idx, hub_code, public_key, w_public_key) VALUES(?, INET_ATON(?), ?, ?, ?, ?, ?, ?, ?)",
        //
        // set_nn: "UPDATE is.node_cons_info SET role=0 WHERE IDX = ?",
        // set_dbn: "UPDATE is.node_cons_info SET role=3 WHERE IDX = ?",
        state_update_start: "UPDATE is.node_cons_info SET state=1 WHERE ip = INET_ATON(?)",
        state_update_stop: "UPDATE is.node_cons_info SET state=0 WHERE ip = INET_ATON(?)",
        state_update_stop_cluster: "UPDATE is.node_cons_info SET state=0 WHERE p2p_addr like ?",
        //
        node_list: "SELECT idx, role, ip, p2p_addr FROM is.node_cons_info",
        get_node_list_role: "SELECT idx, role, ip, p2p_addr FROM is.node_cons_info WHERE Role = ?",
        cluster_code: "SELECT p2p_addr FROM is.node_cons_info WHERE ip = INET_ATON(?)",
        get_ip_p2p_info: "SELECT ip, p2p_addr FROM is.node_cons_info WHERE role = ?",
        get_ip_info: "SELECT ip FROM is.node_cons_info WHERE role = ?",
        // nn_ip_info: "SELECT ip FROM is.node_cons_info WHERE role = 0",
        // isag_ip_info: "SELECT ip FROM is.node_cons_info WHERE role = 5",
        // dn_ip_info: "SELECT ip FROM is.node_cons_info WHERE role = 1 and p2p_addr like ?",
        // dbn_ip_info: "SELECT ip FROM is.node_cons_info WHERE role = 3 and p2p_addr like ?",
        sca0_ip_info: "SELECT ip FROM is.node_cons_info WHERE role = 0 ORDER BY idx ASC LIMIT 1",
        all_ip_info: "SELECT ip FROM is.node_cons_info",
        //
        delete_node_cons_info: "DELETE FROM is.node_cons_info WHERE ip = INET_ATON(?)",
    }, 
    node_hw_info : {
        insert_node_hw_info: "INSERT INTO is.node_hw_info(subnet_id, ip, join_time, sn_hash, ip_list, lan_speed_list, cpu, hdd_size, hdd_raid, ssd_size, ssd_raid, nvme_size, nvme_raid, mem_size, mem_speed, lan_check, raid_check, virtual_check1, virtual_check2, total_prr) VALUES(?, INET_ATON(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        delete_node_hw_info: "DELETE FROM is.node_hw_info WHERE ip = INET_ATON(?)"
    }, 
    hub_info : {
        add_hub: "INSERT INTO is.hub_info(subnet_id, hub_code, name, latitude, longitude, country, city, hub_p2p_addr) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
        add_hub_nocity: "INSERT INTO is.hub_info(subnet_id, hub_code, name, latitude, longitude, country, hub_p2p_addr) VALUES(?, ?, ?, ?, ?, ?, ?)",
        total_hub_list: "SELECT * FROM is.hub_info",
        hub_list_from_code: "SELECT hub_code, name FROM is.hub_info WHERE hub_code = ?",
        gps_code_hub: "SELECT hub_code, latitude, longitude FROM is.hub_info",
        designated_idc: "SELECT latitude, longitude, hub_code FROM is.hub_info WHERE name = ?",
        designated_idc2: "SELECT latitude, longitude, hub_code FROM is.hub_info",
        hub_for_cluster: "SELECT hub_p2p_addr FROM is.hub_info WHERE hub_code = ?",
    }, 
    revision : {
        // idx: "SELECT idx FROM is.revision",
        net_reset: "INSERT INTO is.revision(subnet_id, update_time, rr_net) VALUES(?, ?, ?)",
        reset_count: "SELECT COUNT(idx) AS count FROM is.revision"
    }, 
    cluster_info : {
        cluster_add: "INSERT INTO is.cluster_info(subnet_id, ip, role, sn_hash, cluster_p2p_addr) VALUES(?, INET_ATON(?), ?, ?, ?)",
        // cluster_p2p_addr_by_role : "SELECT cluster_p2p_addr FROM is.cluster_info WHERE role = ?",
        cluster_p2p_addr: "SELECT cluster_p2p_addr FROM is.cluster_info WHERE sn_hash = ?",
        cluster_p2p_addr_list: "SELECT DISTINCT cluster_p2p_addr FROM is.cluster_info",
        // cluster_group_count: "SELECT count(*) as count from is.cluster_info WHERE cluster_p2p_addr = ?",
        cluster_get: "SELECT * FROM is.cluster_info WHERE ip=INET_ATON(?)",
        clsuter_del_p2p: "DELETE FROM is.cluster_info WHERE cluster_p2p_addr=?",
        cluster_del_ip: "DELETE FROM is.cluster_info WHERE ip=INET_ATON(?)"
    }, 
    kafka_info : {
        add_broker_list: "INSERT INTO is.kafka_info(subnet_id, broker_list) values(?, ?)",
        idx_from_broker: "SELECT idx FROM is.kafka_info WHERE broker_list = ?",
        kafka_list: "SELECT idx, broker_list FROM is.kafka_info",
        update_topic_list: "UPDATE is.kafka_info SET topic_list=? WHERE idx=?",
        // kafka_info: "SELECT idx, broker_list, topic_list FROM is.kafka_info",
        kafka_info_w: "SELECT idx, broker_list FROM is.kafka_info WHERE topic_list = ?"
    }, 
    repl_info : {
        insert_repl_info: "INSERT INTO is.repl_info(subnet_id, blk_num, ip, role, log_file, log_pos, cluster_p2p_addr) values(?, ?, ?, ?, ?, ?, ?)",
        select_repl_info: "SELECT * FROM is.repl_info ORDER BY blk_num DESC",
        select_repl_info_bn: "SELECT * FROM is.repl_info WHERE blk_num <= ? ORDER BY blk_num DESC",
        select_repl_info_role: "SELECT * FROM is.repl_info WHERE blk_num <= ? and role = ? ORDER BY blk_num DESC",
        select_repl_info_role_p2p: "SELECT * FROM is.repl_info WHERE blk_num <= ? and role = ? and cluster_p2p_addr = ? ORDER BY blk_num DESC",
    }
};

//
const createIsDB = async () => {
    const conn = await dbUtil.getConn();

    await conn.query(this.querys.createIS);

    await dbUtil.releaseConn(conn);
}

const dropIsDB = async () => {
    const conn = await dbUtil.getConn();

    await conn.query(this.querys.dropIS);

    await dbUtil.releaseConn(conn);
}

const truncateIsAllDB = async () => {
    const conn = await dbUtil.getConn();

    let sql;
    
    sql = this.querys.truncateIsClusterInfo;
    await conn.query(sql);

    sql = this.querys.truncateIsHubInfo;
    await conn.query(sql);

    sql = this.querys.truncateIsNodeHwInfo;
    await conn.query(sql);

    sql = this.querys.truncateIsKafkaInfo;
    await conn.query(sql);

    sql = this.querys.truncateIsNodeInfo;
    await conn.query(sql);

    sql = this.querys.truncateIsRevision;
    await conn.query(sql);

    sql = this.querys.truncateIsReplInfo;
    await conn.query(sql);

    await dbUtil.releaseConn(conn);
}

module.exports.truncateIsTestDB = async () => {
    const conn = await dbUtil.getConn();

    let sql;

    // sql = this.querys.truncateIsClusterInfo;
    // await conn.query(sql);

    // sql = this.querys.truncateIsHubInfo;
    // await conn.query(sql);

    sql = this.querys.truncateIsNodeHwInfo;
    await conn.query(sql);

    // sql = this.querys.truncateIsKafkaInfo;
    // await conn.query(sql);

    sql = this.querys.truncateIsNodeInfo;
    await conn.query(sql);

    sql = this.querys.truncateIsRevision;
    await conn.query(sql);

    sql = this.querys.truncateIsReplInfo;
    await conn.query(sql);

    await dbUtil.releaseConn(conn);
}

module.exports.truncateIsTestNodeKillDB = async () => {
    const conn = await dbUtil.getConn();

    let sql;

    // sql = this.querys.truncateIsClusterInfo;
    // await conn.query(sql);

    // sql = this.querys.truncateIsHubInfo;
    // await conn.query(sql);

    // sql = this.querys.truncateIsNodeHwInfo;
    // await conn.query(sql);

    // sql = this.querys.truncateIsKafkaInfo;
    // await conn.query(sql);

    // sql = this.querys.truncateIsNodeInfo;
    // await conn.query(sql);

    // sql = this.querys.truncateIsRevision;
    // await conn.query(sql);

    sql = this.querys.truncateIsReplInfo;
    await conn.query(sql);

    await dbUtil.releaseConn(conn);
}

module.exports.initDatabaseIS = async () => {
    let ret;
    const conn = await dbUtil.getConn();

    try {
        //
        if(config.DB_TEST_MODE_DROP) {
            logger.debug(`querys.dropIS : ${this.querys.dropIS}`);
            await conn.query(qthis.uerys.dropIS);
        }

        //
        logger.debug(`querys.createIS : ${this.querys.createIS}`);
        await conn.query(this.querys.createIS);

        //
        let sql = this.querys.useIS;
        await conn.query(sql);

        //
        await util.asyncForEach(createTables.isQuerys, async(element, index) => {
            // logger.debug("element : " + element);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.tableName}`, createTableNames.isQuerys[index]);
            element = util.stringReplace(element, `${dbUtil.tableAppendix.appendix}`, dbUtil.tableAppendix.innoDB);
            logger.debug("isQuerys : " + element);
            await conn.query(element);
        });

        if(config.DB_TEST_MODE) {
            await this.truncateIsTestDB();
        }

        ret = { res : true };
        logger.info(`Database Init - ${createDbNames.is}`);
    } catch (err) {
        // debug.error(err);
        logger.error(`Database Error - ${JSON.stringify(err)}`);
        ret = { res : false, reason : JSON.stringify(err)};
    }

    await dbUtil.releaseConn(conn);

    return ret;
}
