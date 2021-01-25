//
const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;
const os = require('os');
const fork = require('child_process').fork;
const fs = require('fs');

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const netUtil = require('./../net/netUtil.js');
const redisUtil = require('./../net/redisUtil.js');
const sock = require('./../net/socket.js');
const util = require('./../utils/commonUtil.js');
const dbUtil = require('./../db/dbUtil.js');
const dbNN = require('./../db/dbNN.js');
const logger = require('./../utils/winlog.js');
const applog = require('./../utils/applog.js');
//
const cmd = define.CMD_CTRL_NOTI;

let loginfo;
// Net Conf
module.exports.saveNetConf = async (data) => {
    let rrNet = data.data1;
    let node = data.data3;
    let role = data.data4;

    // Delete old files
    try {
        await fs.unlinkSync(config.NET_CONF_PATH.NN_RR_NET, (err) => { });
        logger.debug(config.NET_CONF_PATH.NN_RR_NET + ' delete success');
    }
    catch (err) {
        logger.debug(config.NET_CONF_PATH.NN_RR_NET + ' no exists');
    }
    
    try {
        await fs.unlinkSync(config.NET_CONF_PATH.NN_NODE, (err) => { });
        logger.debug(config.NET_CONF_PATH.NN_NODE + ' delete success');
    }
    catch (err) {
        logger.debug(config.NET_CONF_PATH.NN_NODE + ' no exists');
    }

    //NN Save
    if (role === define.NODE_ROLE.STR.NN)
    {
        //
        fs.writeFileSync(config.NET_CONF_PATH.NN_RR_NET, rrNet, config.CMD_ENCODING.encoding);
        logger.debug(role + ' : RR_NET Save Successful');

        //
        fs.writeFileSync(config.NET_CONF_PATH.NN_NODE, node, config.CMD_ENCODING.encoding);
        logger.debug(role + ' : NODE Save Successful');
    }
    //Other Save
    else
    {
        loginfo = logger.dbn_Info;
        logger.debug(role + ' : It does NOT need NETCONF');
    }

    return role;
}

//
module.exports.cmdChildProcess = async (socket, msg, myRole) => {
    if (util.isJsonString(msg) === false)
    {
        return;
    }

    let msgJson = JSON.parse(msg);

    logger.info("Command from IS, myRole : " + myRole + ", msgJson.cmd : " + msgJson.cmd);
    logger.debug("msgJson.data : " + JSON.stringify(msgJson.data));

    // 0. net reset
    if (msgJson.cmd === cmd.req_reset)
    {
        if (myRole == define.NODE_ROLE.STR.NN)
        {
            await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_reset);
        }

        await redisUtil.write(cmd.redis_cmd_noti, cmd.res_reset);
    }
    // 1. net rerun
    else if (msgJson.cmd === cmd.req_rerun)
    {
        let appStatus1 = await util.getResultArr(define.APP_INFO.APP_STATUS_1);
        let appStatus2 = await util.getResultArr(define.APP_INFO.APP_STATUS_2);

        if (appStatus1.indexOf(define.APP_NAME.CPP) !== -1 || appStatus2.indexOf(define.APP_NAME.NODE) !== -1)
        {
            await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_rerun);
            await redisUtil.write(cmd.redis_cmd_noti, cmd.res_rerun);
        }
        else
        {
            await this.startNodeProcess(myRole);
        }
    }
    // 2. net update
    else if (msgJson.cmd === cmd.req_rrUpdate)
    {
        //
        let netDataJson = msgJson.data;
        logger.debug("netDataJson.data1 : " + netDataJson.data1);
        
        //
        await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_rrUpdate);
    }
    // 3. node start
    else if (msgJson.cmd === cmd.req_nodeStart)
    {
        await this.startNodeProcess(myRole);
    }
    // 4. block gen start
    else if (msgJson.cmd === cmd.req_blkgenStart)
    {
        await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_blkgenStart);
    }
    // 5. block gen stop
    else if (msgJson.cmd === cmd.req_blkgenStop)
    {
        await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_blkgenStop);
    }
    // 6. Last Block Number
    else if (msgJson.cmd === cmd.req_getLastBN)
    {
        let lastBN = await dbNN.selectMaxBlkNumFromBlkContents();
        
        let lastBN_res = {
            ip: util.getMyCtrlIP().toString(),
            kind: "lastBN get",
            status: 'complete',

            data: lastBN
        }

        netUtil.writeData(socket, JSON.stringify(lastBN_res));
        // await redisUtil.write(cmd.redis_cmd_noti, cmd.res_getLastBN);
    }
    // 7. rr next
    else if (msgJson.cmd === cmd.req_rrNext)
    {
        await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_rrNext);
    }
    // 8. node kill
    else if (msgJson.cmd === cmd.req_nodeKill)
    {
        this.killNode();
    }
    // 9. net init
    else if (msgJson.cmd === cmd.req_netInit)
    {
        await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_netInit);
    }
    // 10. net save
    else if (msgJson.cmd === cmd.req_netSave)
    {
        //
        let netDataJson = msgJson.data;

        //
        let myRole = await this.saveNetConf(netDataJson);
        sock.setMyRole(myRole);
    }
    // 11. contract
    else if (msgJson.cmd === cmd.req_contract)
    {
        let myContract = cmd.res_contract + ' ' + JSON.stringify(msgJson.data);

        await redisUtil.write(cmd.redis_cmd_noti, myContract);
    }
    // 20. db truncate
    else if (msgJson.cmd === cmd.req_db_truncate)
    {
        await redisUtil.write(cmd.redis_ctrl_noti, cmd.res_db_truncate);
        await redisUtil.write(cmd.redis_cmd_noti, cmd.res_db_truncate);
    }
    // 21. replication set
    else if (msgJson.cmd === cmd.req_db_repl_set)
    {
        let replSet = cmd.res_db_repl_set + ' ' + JSON.stringify(msgJson.data);

        await redisUtil.write(cmd.redis_cmd_noti, replSet);
    }
    // 22. replication get
    else if (msgJson.cmd === cmd.req_db_repl_get)
    {
        await redisUtil.write(cmd.redis_cmd_noti, cmd.res_db_repl_get);
    }
    // 23. replication stop
    else if (msgJson.cmd === cmd.req_db_repl_stop)
    {
        await redisUtil.write(cmd.redis_cmd_noti, cmd.res_db_repl_stop);
    }
    // 24. replication reset
    else if (msgJson.cmd === cmd.req_db_repl_reset)
    {
        await redisUtil.write(cmd.redis_cmd_noti, cmd.res_db_repl_reset);
    }
    // 25. replication start
    else if (msgJson.cmd === cmd.req_db_repl_start)
    {
        await redisUtil.write(cmd.redis_cmd_noti, cmd.res_db_repl_start);
    }
    else
    {
        //
    }
}

// Node Kill
module.exports.killNode = () => {
    let killResult;

    logger.debug("func : killNode");
    
    let nodePS = execSync(define.APP_INFO.PS_NODE,  config.CMD_ENCODING)
    // logger.debug("nodePS : " + nodePS);

    if (nodePS !== '')
    {
        killResult = execSync(define.APP_INFO.KILL_NODE, config.CMD_ENCODING);
        if (killResult)
        {
            // logger
        }
    }

    logger.debug("killResult : " + killResult);
}

// Node Start
module.exports.startNode = async (role) => {
    logger.debug("func : startNode");
    logger.debug("role : " + role);

    // NN
    if (role === define.NODE_ROLE.STR.NN)
    {
        // NNA
        let result_cpp = spawn(config.NODE_PATH.shell, [config.NODE_PATH.scriptNodeStart, role], { cwd: config.NODE_PATH.scriptWhere, detached: true, stdio: config.NODE_PATH.stdio });
        if (config.APP_LOG & config.APP_LOG_KIND.CPP_LOG)
        {
            logger.debug("NNA Log Started");
            result_cpp.stdout.on('data', (data) => {
                applog.info(`[NNA] ${data}`);
            })
        }

        // SCA
        let result_node = spawn(config.NODE_PATH.shell, [config.NODE_PATH.scriptNodeStart, define.NODE_ROLE.STR.SCA], { cwd: config.NODE_PATH.scriptWhere, detached: true, stdio: config.NODE_PATH.stdio });
        if (config.APP_LOG & config.APP_LOG_KIND.SCA_LOG)
        {
            logger.debug("SCA Log Started");
            result_node.stdout.on('data', (data) => {
                applog.info(`[SCA] ${data}`);
            })
        }
    }
    // DBN
    else if (role === define.NODE_ROLE.STR.DBN)
    {
        // DBN
        let result_node = spawn(config.NODE_PATH.shell, [config.NODE_PATH.scriptNodeStart, define.NODE_ROLE.STR.DBN], { cwd: config.NODE_PATH.scriptWhere, detached: true, stdio: config.NODE_PATH.stdio });
        if (config.APP_LOG & config.APP_LOG_KIND.DBN_LOG)
        {
            result_node.stdout.on('data', (data) => {
                applog.info(`[DBN] ${data}`);
            })
        }
    }
}

module.exports.startNodeProcess = async (role) => {
    this.killNode();
    await this.startNode(role);
}
