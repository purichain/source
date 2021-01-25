//
const redis = require('redis');

//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const util = require("./../utils/commonUtil.js");
const dbUtil = require("./../db/dbUtil.js");
const dbRepl = require("./../db/dbRepl.js");
const dbAct = require("./../db/dbAct.js");
const contract_module = require("./../contract/contract.js");
const debug = require("./../utils/debug.js");
const myCluster = require("./../cluster.js");
const cliTest = require("./../cli/cliTest.js");
const logger = require("./../utils/winlog.js");

// From NNA
module.exports.subNnaTxAcks = async (message) => {
//    let TxLock = await myCluster.getTxLock();
//    await TxLock.acquire();
    logger.debug("[REDIS - SUB] [" + define.REDIS_DEFINE.CHANNEL.TX_ACKS + "]");// -> (" + message.toString() + ")");

//    const conn = await dbUtil.getConn();

    let txCnt = message.length / define.REDIS_DEFINE.TX_ACK_LEN.HEX_STR_DB_KEY_LEN - 1;
    let pos = 0;
    let BN;
//    let updateBlkNumQuery = dbNN.querys.updateBlkNum;

    let resString = message.toString();
    BN = resString.substr(pos, define.REDIS_DEFINE.TX_ACK_LEN.HEX_STR_BN_LEN);
    BN = BigInt("0x" + BN).toString();
    pos += define.REDIS_DEFINE.TX_ACK_LEN.HEX_STR_BN_LEN;

    let KeyID = resString.substr(pos, define.REDIS_DEFINE.TX_ACK_LEN.HEX_STR_DB_KEY_LEN);
    KeyID = BigInt("0x" + KeyID).toString();
    pos += define.REDIS_DEFINE.TX_ACK_LEN.HEX_STR_DB_KEY_LEN * (txCnt - 1);
//    updateBlkNumQuery += "db_key >= " + KeyID + " AND ";

    KeyID = resString.substr(pos, define.REDIS_DEFINE.TX_ACK_LEN.HEX_STR_DB_KEY_LEN);
    KeyID = BigInt("0x" + KeyID).toString();
//    updateBlkNumQuery += "db_key <= " + KeyID;

    // for(let i = 0; i < txCnt; i++) {
    //     let KeyID = resString.substr(pos, config.TxAckLen.DBKeyLen);
    //     KeyID = BigInt("0x" + KeyID).toString();
    //     pos += config.TxAckLen.DBKeyLen;

    //     if(i === txCnt - 1) {
    //         updateBlkNumQuery += KeyID + ")";
    //     } else {
    //         updateBlkNumQuery += KeyID + ", ";
    //     }        
    // }
    //console.log(updateBlkNumQuery);
    //console.log(BN);

//    await dbUtil.exeQueryParam(conn, updateBlkNumQuery, [BN]);
//    await dbUtil.releaseConn(conn);

    // await cliTest.testContract();

//    await TxLock.release();
}

// From NNA
module.exports.nnaBlockNotiCB = async (message) => {
    let TxLock = await myCluster.getTxLock();
    await TxLock.acquire();

    // logger.debug("[REDIS - SUB] [" + define.REDIS_DEFINE.CHANNEL.BLK_NOTI + "] -> (" + message.toString() + ")");
    process.send({cmd : define.CMD_DEFINE.BLK_NOTI_IND, data : message});

    await TxLock.release();
}

// From ISA
module.exports.isaCmdNotiCB = async (cmd, cmdNotiAcksPublisher) => {
    try {
        logger.info("[REDIS - SUB] [" + define.REDIS_DEFINE.CHANNEL.CMD_NOTI + "]");// (" + cmd.toString() + ")");
        const regexResult = define.REGEX.NEW_LINE_REGEX.test(cmd);
        let ack_msg;

        if(regexResult)
        {
            cmd = cmd.substring(0, cmd.length - 1);
        }
        logger.debug("SCA Subscribe Cmd : " + cmd);

        let splitCmd = cmd.split(" ");

        if(cmd.toString() === define.ISA_DEFINE.CMD.DB_TRUNCATE) 
        {
            await dbUtil.truncate();
            ack_msg = define.ISA_DEFINE.CMD_ACKS.DB_TRUNCATE_ACK;
        }
        else if(cmd.toString() === define.ISA_DEFINE.CMD.NET_RESET) 
        {
            ack_msg = define.ISA_DEFINE.CMD_ACKS.NET_RESET_ACK;
        }
        else if(cmd.toString() === define.ISA_DEFINE.CMD.NET_UPDATE)
        {
            //
            let res = await dbRepl.getReplInfo();
            let replica_info = makeReplGetAck(res.fileName, res.filePosition);

            cmdNotiAcksPublisher.publish(define.REDIS_DEFINE.CHANNEL.CMD_NOTI_ACKS, replica_info);

            //
            ack_msg = define.ISA_DEFINE.CMD_ACKS.NET_UPDATE_ACK;
        }
        // Genesis Contract from IS
        else if(cmd.slice(0, define.ISA_DEFINE.CONTRACT_CMD_LEN) === define.ISA_DEFINE.CMD.CONTRACT) 
        {
            let contractJson = cmd.slice(define.ISA_DEFINE.CONTRACT_CMD_LEN);
            // logger.debug("received contract : " + contractJson);

            let len = contractJson.length;
            let client_res = await contract_module.createTx(contractJson);
            logger.debug(JSON.stringify(client_res));

            await myCluster.sendTxsToMaster();

            if(client_res.ERROR_CODE !== 0)
            {
                ack_msg = JSON.stringify(client_res);
            }
            else
            {
                ack_msg = define.ISA_DEFINE.CMD_ACKS.CONTRACT_ACK;
            }
        }
        else if(cmd.toString() === define.ISA_DEFINE.CMD.LAST_BN_REQ)
        {
            let lastBN = await dbAct.selectMaxBlkNumFromBlkContents();

            ack_msg = define.ISA_DEFINE.CMD_ACKS.LAST_BN_ACK + ' ' + lastBN;
        }
        else if(splitCmd[0] === define.ISA_DEFINE.CMD.REPL) 
        {
            if (splitCmd[1] === define.ISA_DEFINE.CMD.REPL_CMD.SET)
            {
                await dbRepl.resetReplSlaves();
                // logger.debug("cmd : " + cmd.slice(9)); // "repl set []" -> delete "repl set"

                let replSetArr = JSON.parse(cmd.slice(9));

                await util.asyncForEach(replSetArr, async(element, index) => {
                    // blk_num, ip, role, log_file, log_pos, cluster_p2p_addr
                    let targetRule = element.role;

                    if (targetRule === define.NODE_ROLE.NUM.NN)
                    {
                        let clusterP2pAddr = element.cluster_p2p_addr;
                        let subNetId = clusterP2pAddr.slice(define.P2P_DEFINE.P2P_ROOT_SPLIT_INDEX.START, define.P2P_DEFINE.P2P_ROOT_SPLIT_INDEX.END);

                        let ip = element.ip;
                        let logFile = element.log_file;
                        let logPos = element.log_pos;
    
                        logger.info("targetRule : " + targetRule + ", subNetId : " + subNetId + ", ip : " + ip + ", logFile : " + logFile + ", logPos : " + logPos);
                        await dbRepl.setReplSlaveNN(subNetId, ip, logFile, logPos);
                    }
                    else
                    {
                        logger.warn("invalid targetRule : " + targetRule + ", ip : " + ip + ", logFile : " + logFile + ", logPos : " + logPos);
                    }
                });

                ack_msg = define.ISA_DEFINE.CMD_ACKS.REPL.SET_ACK;
            }
            else if (splitCmd[1] === define.ISA_DEFINE.CMD.REPL_CMD.GET)
            {
                let res = await dbRepl.getReplInfo();

                ack_msg = makeReplGetAck(res.fileName, res.filePosition);
            }
            else if (splitCmd[1] === define.ISA_DEFINE.CMD.REPL_CMD.START)
            {
                await dbRepl.startReplSlaves();

                ack_msg = define.ISA_DEFINE.CMD_ACKS.REPL.START_ACK;
            }
            else if (splitCmd[1] === define.ISA_DEFINE.CMD.REPL_CMD.RESET)
            {
                await dbRepl.resetReplSlaves();

                ack_msg = define.ISA_DEFINE.CMD_ACKS.REPL.RESET_ACK;
            }
            else // STOP
            {
                await dbRepl.stopReplSlaves();

                ack_msg = define.ISA_DEFINE.CMD_ACKS.REPL.STOP_ACK;
            }
        }
        else if(cmd.toString() === define.ISA_DEFINE.CMD.REWARD)
        {
            //
            ack_msg = define.ISA_DEFINE.CMD_ACKS.REWARD_SPREAD_ACK;
        }
        else {
            logger.error("else");
            ack_msg = define.ISA_DEFINE.CMD_ACKS.UNKNOWN_CMD;
        }

        if(define.REDIS_DEFINE.REDIS_PUBSUB_CHECK)
        {
            redisChannelCheck(cmdNotiAcksPublisher, define.REDIS_DEFINE.CHANNEL.CMD_NOTI_ACKS);
        }    
        logger.debug("[REDIS - PUB] [" + define.REDIS_DEFINE.CHANNEL.CMD_NOTI_ACKS + "] (" + ack_msg.toString() + ")");
        cmdNotiAcksPublisher.publish(define.REDIS_DEFINE.CHANNEL.CMD_NOTI_ACKS, ack_msg);
    } catch (err) {
        debug.error(err);
    }
}

// Local
module.exports.localTxContractCB = async (message) => {
    let TxLock = await myCluster.getTxLock();
    await TxLock.acquire();

    logger.debug("[REDIS - SUB] [" + define.REDIS_DEFINE.LOCAL_CHANNEL.TX_CONTRACT + "]");// -> (" + message.toString() + ")");

    contract_module.pushContractArray(message);
    //await contract_module.sendTxArrToNNA();
    await contract_module.sendTxArrToDB();
    await TxLock.release();
}
