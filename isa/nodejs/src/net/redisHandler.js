//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js')
const netUtil = require('./../net/netUtil.js');
const util = require('./../utils/commonUtil.js');
const logger = require('./../utils/winlog.js');

//
const cmdRedis = define.CMD_REDIS;

//
module.exports.subNnaCtrlNotiCB = async (socket, ch, respMsg) => {
    logger.debug(" [SUB] [" + ch + "] " + respMsg);
    let splitMsg = respMsg.split(' ');

    // NN Start
    if (splitMsg[1].toLowerCase() === cmdRedis.req_start)
    {
        let start_res = {
            ip: util.getMyCtrlIP().toString(),
            role: splitMsg[cmdRedis.kind], // NN
            status: cmdRedis.req_start
        }
        netUtil.writeData(socket, JSON.stringify(start_res));
    }
    // rr update, next, start, stop, leave all .. complete
    else if (splitMsg[2] === cmdRedis.req_complete)
    {
        let suc_res = {
            ip: util.getMyCtrlIP().toString(),
            kind: splitMsg[cmdRedis.kind] + ' ' + splitMsg[1],
            status: cmdRedis.req_complete
        }
        netUtil.writeData(socket, JSON.stringify(suc_res));
    }
    else
    {
        logger.error("invalid redis form");
    }
}

//
module.exports.subScaCmdNotiCB = async (socket, ch, respMsg) => {
    logger.debug(" [SUB] [" + ch + "] " + respMsg);
    let splitMsg = respMsg.split(' ');

    let msgKind = splitMsg[cmdRedis.kind];

    if (msgKind === cmdRedis.req_sca || msgKind === cmdRedis.req_dn || msgKind === cmdRedis.req_dbn)
    {
        let start_res = {
            ip: util.getMyCtrlIP().toString(),
            role: msgKind,
            status: cmdRedis.req_start
        }
        netUtil.writeData(socket, JSON.stringify(start_res));
    }
    else if (msgKind === cmdRedis.req_contract)
    {
        if (splitMsg[cmdRedis.detail_kind] === cmdRedis.req_contract_cmd.recv)
        {
            let contract_res = {
                ip: util.getMyDataIP().toString(),
                kind: msgKind + ' ' + splitMsg[cmdRedis.detail_kind],
                status: splitMsg[cmdRedis.detail_kind_status]
            }
            netUtil.writeData(socket, JSON.stringify(contract_res));
        }
    }
    else if (msgKind === cmdRedis.req_repl)
    {
        let repl_res = {
            ip: util.getMyReplIP().toString(),
            kind: msgKind + ' ' + splitMsg[cmdRedis.detail_kind],
            status: splitMsg[cmdRedis.detail_kind_status]
        }

        if (splitMsg[cmdRedis.detail_kind] === cmdRedis.req_repl_cmd.get)
        {
            logger.debug(cmdRedis.req_repl_cmd.get);
            repl_res.data = splitMsg[3] + ' ' + splitMsg[4];
        }
        else if (splitMsg[cmdRedis.detail_kind] === cmdRedis.req_repl_cmd.set)
        {
            logger.debug(cmdRedis.req_repl_cmd.set);
        }
        else if (splitMsg[cmdRedis.detail_kind] === cmdRedis.req_repl_cmd.reset)
        {
            logger.debug(cmdRedis.req_repl_cmd.reset);
        }
        else if (splitMsg[cmdRedis.detail_kind] === cmdRedis.req_repl_cmd.start)
        {
            logger.debug(cmdRedis.req_repl_cmd.start);
        }
        else if (splitMsg[cmdRedis.detail_kind] === cmdRedis.req_repl_cmd.stop)
        {
            logger.debug(cmdRedis.req_repl_cmd.stop);
        }
        else
        {
            logger.error("Error - Unknown Replication Command");
        }

        netUtil.writeData(socket, JSON.stringify(repl_res));
    }
    else if (msgKind === cmdRedis.req_lastBN)
    {
        let lastBN_res = {
            ip: util.getMyCtrlIP().toString(),
            kind: msgKind + ' ' + splitMsg[cmdRedis.detail_kind],
            status: splitMsg[cmdRedis.detail_kind_status]
        }

        if (splitMsg[cmdRedis.detail_kind] === cmdRedis.req_lastBN_cmd.get)
        {
            lastBN_res.data = splitMsg[3];
        }

        netUtil.writeData(socket, JSON.stringify(lastBN_res));
    }
}