//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const dbUtil = require('./../db/dbUtil.js');
const dbIS = require('./../db/dbIS.js');
const netUtil = require('./../net/netUtil.js');
const netConf = require('./../net/netConf.js');
const netSend = require('./../net/netSend.js');
const prr = require('./../reg/prr.js');
const reg = require('./../reg/registration.js');
const repl = require('./../reg/replication.js');
const ctx = require('./../net/ctx.js');
const util = require('./../utils/commonUtil.js');
const logger = require('./../utils/winlog.js');
const handleDefine = require('./../../config/define.js').DATA_HANDLER;

//
let blkGenStatus = false;

const setBlockGenStatus = (blkGenStarted) => {
    blkGenStatus = blkGenStarted;
}

module.exports.getBlockGenStatus = () => {
    return blkGenStatus;
}

module.exports.handler = async (data, socket) => {
    let map = ctx.getCTXMap();
    let splitData = data.split('\r');
    let RealData = [];
    for(var j = 0; j<splitData.length; j++){
        if(splitData[j])
            RealData.push(splitData[j]);
    }
    for (var i = 0; i < RealData.length; i++){
        await tcpHandle(RealData[i], socket, map);
    }
}

async function tcpHandle(data, socket, map){
    logger.debug("func : tcpHandle");

    if (util.isJsonString(data))
    {
        logger.debug("jsonData : " + data);

        let jsonData = JSON.parse(data);

        if (jsonData.myRole !== undefined)
        {
            // 1. push data in myHwInfo Array
            if (jsonData.myHwInfo != undefined)
            {
                let remoteIpStr = ((socket.remoteAddress).slice(7)).toString();

                let clusterInfo = await dbUtil.queryPre(dbIS.querys.cluster_info.cluster_get, [remoteIpStr]);
            
                if (clusterInfo.length && clusterInfo[0].ip !== null)
                {
                    let point = await prr.calculatePrr(jsonData, socket);
                    let regRes = await reg.registConsNode(jsonData, socket, clusterInfo[0].role, point.total_prr_point);
                    if (regRes === true)
                    {
                        netUtil.sendNetCmd(socket, define.CMD.prr_passed);
                    }
                    else
                    {
                        netUtil.sendNetCmd(socket, define.CMD.prr_error);
                        logger.error('Error - registConsNode');
                    }
                }
                else
                {
                    netUtil.sendNetCmd(socket, define.CMD.prr_error);
                    logger.error('Error - cluster_get query');
                }
            }
        }
        // 2. update status when start node
        else if (jsonData.status !== undefined)
        {
            // logger.debug("jsonData.status : " + jsonData.status);
            // update status when start node
            if ((jsonData.status === handleDefine.status_cmd.start) || (jsonData.status === handleDefine.status_cmd.stop))
            {
                if ((jsonData.role !== undefined) && (jsonData.ip !== undefined))
                {
                    // ISAg
                    
                    // Others
                    await dbUtil.queryPre(dbIS.querys.node_cons_info.state_update_start, [jsonData.ip]);
                    logger.info("[TCP] [ISA] [RECV] " + jsonData.role + " " + jsonData.status + " success : " + jsonData.ip);
                }
                else
                {
                    logger.error("[TCP] [ISA] [RECV] Error");
                }
            }
            // status = complete
            else if (jsonData.status === handleDefine.status_cmd.res_success)
            {
                let splitKind = jsonData.kind.split(" ");
                logger.debug("splitKind[0] : " + splitKind[0]);

                // reset ack
                if (jsonData.kind === handleDefine.kind_cmd.status_stop)
                {
                    let ip_p2p_addr = await dbUtil.queryPre(dbIS.querys.node_cons_info.cluster_code, [jsonData.ip]);
                    if (ip_p2p_addr.length)
                    {
                        let p2pAddrForState = ip_p2p_addr[0].p2p_addr.slice(0, 14) + '%';
                        await dbUtil.queryPre(dbIS.querys.node_cons_info.state_update_stop_cluster, [p2pAddrForState]);
                    }
                    else
                    {
                        logger.error("Error - No data from node_cons_info table");
                    }
                }
                // block gen start ack
                else if (jsonData.kind === handleDefine.kind_cmd.blk_start)
                {
                    setBlockGenStatus(true);
                }
                // block gen stop ack
                else if (jsonData.kind === handleDefine.kind_cmd.blk_stop)
                {
                    setBlockGenStatus(false);
                }
                // last BN Ack
                else if (jsonData.kind === handleDefine.kind_cmd.last_bn_get)
                {
                    let lastBN = jsonData.data;
                    logger.debug(jsonData.kind + ' ' + jsonData.data);

                    netConf.setLastBlkNum(lastBN);
                }
                // contract received ack
                else if (jsonData.kind === handleDefine.kind_cmd.contract_recv)
                {
                    logger.info("[TCP] [ISA] [RECV] " + jsonData.kind + " " + jsonData.status + " success : " + jsonData.ip);
                }
                // replication
                else if (splitKind[0] === handleDefine.repl)
                {
                    if (splitKind[1] === handleDefine.repl_cmd.set)
                    {
                        logger.debug(jsonData.kind + ' ' + jsonData.data);
                        // await repl.saveReplData(socket, jsonData);
                    }
                    else if (splitKind[1] === handleDefine.repl_cmd.get)
                    {
                        logger.debug(jsonData.kind + ' ' + jsonData.data);
                        await repl.saveReplData(socket, jsonData);
                    }
                }
                else
                {
                    logger.warn("[TCP] [ISA] [RECV] WARN " + jsonData.kind + " " + jsonData.status + " : " + jsonData.ip);
                }

                logger.info("[TCP] [ISA] [RECV] " + jsonData.kind + " " + jsonData.status + " : " + jsonData.ip);
            }
            // status = request
            else if (jsonData.status == handleDefine.status_cmd.request)
            {
                let splitKind = jsonData.kind.split(" ");
                logger.debug("splitKind[0] : " + splitKind[0]);

                // replication
                if (splitKind[0] === handleDefine.repl)
                {
                    if (splitKind[1] === handleDefine.repl_cmd.dataReq) // Replication Data Request
                    {
                        logger.debug(jsonData.kind + ' ' + jsonData.data);

                        let splitData = jsonData.data.split(' ');

                        let reqblkNum = netConf.getLastBlkNum();
                        let reqRole;
                        let reqClusterP2pAddr;

                        if (splitData.length >= 1)
                        {
                            if (splitData[0] !== '0')
                            {
                                reqblkNum = BigInt(splitData[0]);
                            }
                            
                        }

                        if (splitData.length >= 2)
                        {
                            let reqRoleInt = reg.getRoleInt(splitData[1]);

                            if (reqRoleInt !== define.ERR_CODE.ERROR)
                            {
                                reqRole = reqRoleInt;
                            }
                        }

                        if (splitData.length >= 3)
                        {
                            reqClusterP2pAddr = splitData[2];
                        }

                        logger.debug("reqblkNum : " + reqblkNum + "reqRole : " + reqRole + "reqClusterP2pAddr : " + reqClusterP2pAddr);
            
                        // let replDataRsp;

                        // Send Replication Data
                        let replDataArr = await repl.getReplDataArr(reqblkNum, reqRole, reqClusterP2pAddr);
                        // if (replDataArr.length)
                        // {
                        //     logger.debug("replDataArr : " + JSON.stringify(replDataArr));
            
                        //     replDataRsp += JSON.stringify(replDataArr);
                        // }
                        // else
                        // {
                        //     logger.error("Error - No replDataArr");
            
                        //     replDataRsp += '{}';
                        // }

                        netUtil.sendNetCmd(socket, define.CMD.db_repl_set_res, replDataArr);
                    }
                }
            }
            else
            {
                logger.warn("[TCP] [ISA] [RECV] Invalid res format  : " + jsonData.ip);
                console.log(jsonData);
            }
        }
    }
    else
    {
        logger.warn("[TCP] [RECV] " + data + " is Invalid format");
    }
}