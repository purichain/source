//
const Nodegeocoder = require('node-geocoder');
const geocoder = Nodegeocoder({provider: 'openstreetmap', language:'en'});
const fs = require('fs');

//
const cryptoSsl = require("./../../../../addon/crypto-ssl");

//
const config = require('./../../config/config.js');
const define = require('./../../config/define.js');
const dbUtil = require('./../db/dbUtil.js');
const dbIS = require('./../db/dbIS.js');
const dbShard = require('./../db/dbShard.js');
const ctx = require('./../net/ctx.js');
const netUtil = require('./../net/netUtil.js');
const netConf = require('./../net/netConf.js');
const netSend = require('./../net/netSend.js');
const contract = require('./../contract/contract.js');
const contractUtil = require('./../contract/contractUtil.js');
const kafkaUtil = require('./../net/kafkaUtil.js');
const util = require('./../utils/commonUtil.js');
const cryptoUtil = require('./../sec/cryptoUtil.js');
const reg = require('./../reg/registration.js');
const repl = require('./../reg/replication.js');
const socket = require('./../net/socket.js');
const cliTest = require('./../cli/cliTest.js');
const logger = require('./../utils/winlog.js');

//
module.exports.handler = async (cmd) => {
    // Command Handler Start
    let map = ctx.getCTXMap();

    let retVal = true;

    logger.info('IS CLI Received Data : ' + cmd);

    let cmdSplit = cmd.split(' ');

    // is --help
    if (cmd === define.CMD.help_req1 || cmd == define.CMD.help_req2)
    {
        console.log(define.CMD.help_res);
    }
    // is --version
    else if (cmd === define.CMD.version_req1 || cmd == define.CMD.version_req2)
    {
        console.log(define.CMD.version_res);
    }
    // is --net reset || is -nrs
    else if ((cmd === define.CMD.net_reset_req1) || (cmd === define.CMD.net_reset_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.net_reset_res, dbIS.querys.node_cons_info.all_ip_info);
    }
    // is --net save || is -ns
    else if ((cmd === define.CMD.net_save_req1) || (cmd === define.CMD.net_save_req2))
    {
        let ret = await netConf.makeNetConf(map.size);

        if (ret === true)
        {
            await netSend.sendNetConf(map);
        }
    }
    // is --net rerun || is -nrr
    else if ((cmd === define.CMD.net_rerun_req1) || (cmd === define.CMD.net_rerun_req2))
    {
        let ret = await netSend.sendNetConf(map);
        
        if (ret === true)
        {
            await netSend.writeSomeNoData(map, define.CMD.net_rerun_res, dbIS.querys.node_cons_info.all_ip_info);
        } 
    }
    // is --net update || is -nu
    else if ((cmd === define.CMD.net_update_req1) || (cmd === define.CMD.net_update_req2))
    {
        await netSend.sendNetUpdate(map);
    }
    // is --net init || is -ni
    else if ((cmd === define.CMD.net_init_req1) || (cmd === define.CMD.net_init_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.net_init_res, dbIS.querys.node_cons_info.get_ip_info, define.NODE_ROLE.NUM.NN);
    }
    // is --node start
    else if ((cmd === define.CMD.node_start_req1) || (cmd === define.CMD.node_start_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.node_start_res, dbIS.querys.node_cons_info.all_ip_info);
    }
    // is --node kill
    else if ((cmd === define.CMD.node_kill_req1) || (cmd === define.CMD.node_kill_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.node_kill_res, dbIS.querys.node_cons_info.all_ip_info);

        // 
        if(config.DB_TEST_MODE) {
            netConf.setLastBlkNum(0);
            await dbIS.truncateIsTestNodeKillDB();
        }
    }
    // is --node next
    else if ((cmd === define.CMD.node_next_req1) || (cmd === define.CMD.node_next_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.node_next_res, dbIS.querys.node_cons_info.get_ip_info, define.NODE_ROLE.NUM.NN);
    }
    // is --block gen start || is -bg start
    else if ((cmd === define.CMD.bg_start_req1) || (cmd === define.CMD.bg_start_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.bg_start_res, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    // is --block gen stop || is -bg stop
    else if ((cmd === define.CMD.bg_stop_req1) || (cmd === define.CMD.bg_stop_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.bg_stop_res, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    // is --get last bn || is -lbn
    else if ((cmd === define.CMD.last_bn_req1) || (cmd === define.CMD.last_bn_req2))
    {
        await netSend.writeSomeNoData(map, define.CMD.get_last_bn_res, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    // is --act query
    else if (cmd.slice(0,14) === define.CMD.db_act_query_req1)
    {
        await dbUtil.actQuery(cmd.slice(15));
    }
    // is --db truncate
    else if (cmd === define.CMD.db_truncate_req1)
    {
        await netSend.writeSomeNoData(map, define.CMD.db_truncate_res, dbIS.querys.node_cons_info.all_ip_info);
    }
    // is --db repl get
    else if (cmd === define.CMD.db_repl_get1)
    {
        await netSend.writeSomeNoData(map, define.CMD.db_repl_get_res, dbIS.querys.node_cons_info.get_ip_info, define.NODE_ROLE.NUM.NN);
    }
    // is --db repl set
    else if (cmd === define.CMD.db_repl_set1)
    {
        await repl.setReplNN(map, netConf.getLastBlkNum());
        await repl.setReplISAg(map, netConf.getLastBlkNum());
    }
    // is --db repl stop
    else if (cmd === define.CMD.db_repl_stop1)
    {
        await netSend.writeSomeNoData(map, define.CMD.db_repl_stop_res, dbIS.querys.node_cons_info.all_ip_info);
    }
    // is --db repl reset
    else if (cmd === define.CMD.db_repl_reset1)
    {
        await netSend.writeSomeNoData(map, define.CMD.db_repl_reset_res, dbIS.querys.node_cons_info.all_ip_info);
    }
    // is --db repl start
    else if (cmd === define.CMD.db_repl_start1)
    {
        await netSend.writeSomeNoData(map, define.CMD.db_repl_start_res, dbIS.querys.node_cons_info.all_ip_info);
    }
    // is --repl data get
    else if (cmd === define.CMD.repl_data_get1)
    {
        let replDataArr = await repl.getReplDataArr(netConf.getLastBlkNum());
        if (replDataArr.length)
        {
            logger.debug("replDataArr : " + JSON.stringify(replDataArr));
        }
    }
    // is --repl data reset
    else if (cmd == define.CMD.repl_data_reset1)
    {
        await repl.resetReplData();
    }
    // is --shard user add
    else if (cmd === define.CMD.shard_user_add1)
    {
        await dbShard.createShardUser();
    }
    // is --shard user del
    else if (cmd === define.CMD.shard_user_del1)
    {
        await dbShard.dropShardUser();
    }
    // is --gc add user is || is -gc aui
    else if (cmd === define.CMD.gc_add_user_is1 || cmd === define.CMD.gc_add_user_is2)
    {
        let gcAddUser = await contract.gcAddUserIS();

        // let contractJson = JSON.stringify(gcAddUser);
        // logger.debug("contractJson : " + contractJson);
        let contractJson = gcAddUser;
        logger.debug("contractJson : " + JSON.stringify(contractJson));

        await netSend.writeSome(map, define.CMD.contract_res, contractJson, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    // is --gc create token || is -gc ct
    else if (cmd === define.CMD.gc_crate_token1 || cmd === define.CMD.gc_crate_token2)
    {
        let gcCreateSt = await contract.gcCreateSecToken();

        // let contractJson = JSON.stringify(gcCreateSt);
        // logger.debug("contractJson : " + contractJson);
        let contractJson = gcCreateSt;
        logger.debug("contractJson : " + JSON.stringify(contractJson));

        await netSend.writeSome(map, define.CMD.contract_res, contractJson, dbIS.querys.node_cons_info.sca0_ip_info);
    }
    // is --kafka add
    else if (cmd.slice(0,14) === define.CMD.kafka_add_req1)
    {
        await kafkaUtil.addKafka(CMD.slice(15));
    }
    // is --hub add
    else if (cmd.slice(0,12) === define.CMD.hub_add_req1)
    {
        retVal = await addHub(cmd);
    }
    // is --cluster add
    else if (cmd.slice(0,16) === define.CMD.cluster_add_req1)
    {
        retVal = await addCluster(cmd);
    }
    // is --cluster del
    else if (cmd.slice(0,16) === define.CMD.cluster_del_req1)
    {
        retVal = await delCluster(cmd);
    }
    // is --test
    else if (cmd.slice(0,9) === define.CMD.test1)
    {
        retVal = await cliTest.cliTestHandler(cmd.slice(10), map);
    }
    // is -t
    else if (cmd.slice(0,5) === define.CMD.test2){
        retVal = await cliTest.cliTestHandler(cmd.slice(3), map);
    }
    // // mysql passwd OOOOO
    // else if (cmd.slice(0,12) === define.CMD.db_passwd_req1)
    // {
    //     let result = cryptoSsl.aesEncPw(config.KEY_PATH.PW_SEED, CMD.slice(13), CMD.slice(13).length, config.KEY_PATH.PW_MARIA);
    
    //     if (result === true)
    //     {
    //         logger.debug("[CLI] "+ define.CMD.db_passwd_res_success);
    //     }
    //     else
    //     {
    //         logger.error("[CLI] " + define.CMD.db_passwd_res_error);
    //     }
    // }
    // key enc/dec/read OOOOO
    else if (cmd.slice(0,3) === define.CMD.key_crypt_req)
    {
        let crypt = cmd.split(' ')[1];

        let orgFilePath = cmd.split(' ')[2];
        let orgFile = fs.readFileSync(orgFilePath);

        if (crypt === 'enc')
        {
            //
            if (orgFilePath.includes('pem'))
            {
                //
                let dstFilePath = util.stringReplace(orgFilePath, 'pem', 'fin');

                //
                let keySeed = config.KEY_PATH.KEY_SEED;

                logger.debug("[CLI] orgFilePath : " + orgFilePath + ", dstFilePath : " + dstFilePath + ", keySeed : " + keySeed);

                //
                let result = cryptoSsl.aesEncFile(orgFilePath, dstFilePath, keySeed, keySeed.length);
            
                if (result = true)
                {
                    logger.debug("[CLI] " + define.CMD.ed_prv_res_success);
                }
                else
                {
                    logger.error("[CLI] " + define.CMD.ed_prv_res_error);
                }
            }
            else
            {
                logger.error("[CLI] " + define.CMD.ed_prv_res_error);
            }
        }
        else if (crypt === 'dec')
        {
            //
            if (orgFilePath.includes('fin'))
            {
                //
                let keySeed = config.KEY_PATH.KEY_SEED;

                logger.debug("[CLI] orgFilePath : " + orgFilePath + ", keySeed : " + keySeed);

                let decFile = cryptoSsl.aesDecFile(orgFilePath, keySeed, keySeed.length);
                logger.debug(decFile);
            }
            else
            {
                logger.error("[CLI] " + define.CMD.ed_prv_res_error);
            }
        }
        // key read OOOOO
        else if (crypt === 'read')
        {
            if (orgFilePath.includes('pubkey'))
            {
                let pemRead = await cryptoUtil.PEMReadPublicKey(orgFilePath);

                if (orgFilePath.includes('ed'))
                {
                    let pubkeyHex = util.bytesToBuffer(pemRead.keyData.bytes).toString('hex');
                    logger.debug("pubkeyHex : " + pubkeyHex);
                }
                else // ec
                {
                    let ec_point_x = util.bytesToBuffer(pemRead.keyData.x).toString('hex');
                    let ec_point_y = util.bytesToBuffer(pemRead.keyData.y).toString('hex');

                    logger.debug("ec_point_x : " + ec_point_x);
                    logger.debug("ec_point_y : " + ec_point_y);
                }
            }
            else
            {
                let pemRead = await cryptoUtil.PEMReadPrivateKey(orgFilePath);

                if (orgFilePath.includes('ed'))
                {
                    let prikeyHex = util.bytesToBuffer(pemRead.keyData.seed).toString('hex');
                    logger.debug("prikeyHex : " + prikeyHex);
                }
                else // ec
                {
                    let prikeyHex = util.bytesToBuffer(pemRead.keyData.d).toString('hex');
                    logger.debug("prikeyHex : " + prikeyHex);
                }
            }
        }
    }
    else
    {
        retVal = false;
        logger.error("[CLI] " + cmd + ' is an incorrect command. See is --help');
    }

    return retVal;
}

// Send Block Gen Stop to SCA0
module.exports.blockGenStop = async () => {
    let map = ctx.getCTXMap();
    await netSend.writeSomeNoData(map, define.CMD.bg_stop_res, dbIS.querys.node_cons_info.sca0_ip_info);
    return true;
}

// Send Last Block Number Get Request to SCA0
module.exports.getLastBlkNum = async () => {
    let map = ctx.getCTXMap();
    await netSend.writeSomeNoData(map, define.CMD.get_last_bn_res, dbIS.querys.node_cons_info.sca0_ip_info);
    return true;
}

// Add Hub on DB
async function addHub(cmd){
    let cmd_split = cmd.split(' ');
    let hub_code_value = cmd_split[cmd_split.indexOf(define.CMD.hub_add_option1) + 1];
    let name_value = cmd_split[cmd_split.indexOf(define.CMD.hub_add_option2) + 1];
    let gps = cmd_split[cmd_split.indexOf(define.CMD.hub_add_option3) + 1].split(define.CMD.hub_add_option4);
    let latitude = gps[0];
    let longitude = gps[1];

    if(longitude)
    {
        if((latitude.split('.')[1].length !== 2) || (longitude.split('.')[1].length !== 2))
        {
            logger.error("[CLI] " + 'Latitude or Longitude can insert only the second decimal place(OO.OO, OO.OO)');
            return false;
        }
        else
        {
            let geo = await geocoderReverse(latitude, longitude);

            if(geo.country)
            {
                //
                let gps_addr = reg.gpsToP2pAddr(latitude, longitude);
                let country_addr = contractUtil.countryCode(geo.country);
                let hub_addr_tmp = (hub_code_value << 2).toString(16);
                let hub_addr = util.leftPadding(hub_addr_tmp, 2);
                logger.debug("gps_addr : " + gps_addr + ", country_addr : " + country_addr + ", hub_addr_tmp : " + hub_addr_tmp + ", hub_addr : " + hub_addr);

                let hub_p2p_addr = gps_addr + country_addr + hub_addr;

                if(geo.city)
                {
                    // console.log([hub_code_value, name_value, latitude, longitude, geo.country, geo.city]);
                    await dbUtil.queryPre(dbIS.querys.hub_info.add_hub, [define.P2P_DEFINE.P2P_SUBNET_ID_IS, hub_code_value, name_value, latitude, longitude, geo.country, geo.city, hub_p2p_addr]);
                    logger.debug("[CLI] " + hub_code_value + ' Hub add success');
                }
                else
                {
                    // console.log([hub_code_value, name_value, latitude, longitude, geo.country, geo.city]);
                    await dbUtil.queryPre(dbIS.querys.hub_info.add_hub_nocity, [define.P2P_DEFINE.P2P_SUBNET_ID_IS, hub_code_value, name_value, latitude, longitude, geo.country, hub_p2p_addr]);
                    logger.debug("[CLI] " + 'Cannot Find City name. so city = NULL');
                }

                return true;
            }
            else
            {
                logger.error("[CLI] " + 'Cannot Find Country Code. Fail to Add Hub');
                return false;
            }
        }
    }
    else
    {
        logger.error("[CLI] " + 'Do not leave a space between latitude and longitude.(OO.OO,OO.OO)');
        return false;
    }
}

// Add Cluster On DB
async function addCluster(cmd){
    let ret_val = false;

    let cmd_split = cmd.split(' ');
    let hub_code_value = cmd_split[cmd_split.indexOf(define.CMD.cluster_add_option1) + 1];
    let group_value = cmd_split[cmd_split.indexOf(define.CMD.cluster_add_option2) + 1];
    let ip_value = cmd_split[cmd_split.indexOf(define.CMD.cluster_add_option3) + 1];
    let role_value = cmd_split[cmd_split.indexOf(define.CMD.cluster_add_option4) + 1];
    let sn_value = cmd_split[cmd_split.indexOf(define.CMD.cluster_add_option5) + 1];

    let hubInfoRes = await dbUtil.queryPre(dbIS.querys.hub_info.hub_for_cluster, [hub_code_value]);
    if (hubInfoRes.length)
    {
        // let hub_gps_country = await JSON.parse(hubInfoRes);
        let hub_p2p_addr = hubInfoRes[0].hub_p2p_addr;

        logger.debug("hub_p2p_addr : " + hub_p2p_addr);

        if(group_value > config.netConfSet.maxGroup)
        {
            logger.error("[CLI] " +'group value too large! You can have up to three groups per hub.');
        }
        else
        {
            //
            let roleInt = reg.getRoleInt(role_value);
            if (roleInt !== define.ERR_CODE.ERROR)
            {
                let cluster_p2p_addr_int = BigInt(hub_p2p_addr) + BigInt(group_value);
                let cluster_p2p_addr = '0x' + BigInt(cluster_p2p_addr_int).toString(16);

                logger.debug("ip_value : " + ip_value + ", sn_value : " + sn_value + ", cluster_p2p_addr : " + cluster_p2p_addr);
                
                await dbUtil.queryPre(dbIS.querys.cluster_info.cluster_add, [define.P2P_DEFINE.P2P_SUBNET_ID_IS, ip_value, roleInt, sn_value, cluster_p2p_addr]);

                ret_val = true;
            }
        }
    }
    else
    {
        logger.error("Error - No data from hub_info table");
    }

    return ret_val;
}

// Delete Cluster on DB
async function delCluster(cmd){
    let cmd_split = cmd.split(' ');
    let p2p = cmd_split.indexOf(define.CMD.cluster_del_option1);
    let ip = cmd_split.indexOf(define.CMD.cluster_add_option3);
    let result = false;

    if(p2p !== define.ERR_CODE.ERROR)
    {
        let p2p_value = cmd_split[cmd_split.indexOf(define.CMD.cluster_del_option1) + 1];
        await dbUtil.queryPre(dbIS.querys.cluster_info.clsuter_del_p2p, [p2p_value]);

        result = true;
    }
    else if(ip !== define.ERR_CODE.ERROR)
    {
        let ip_value = cmd_split[cmd_split.indexOf(define.CMD.cluster_add_option3) + 1];
        await dbUtil.queryPre(dbIS.querys.cluster_info.cluster_del_ip, [ip_value]);

        result = true;
    }

    return result;
}

// // Convert GPS value to P2P_ADDR
// function gpsToP2pAddr(gps) {
//     let lat_split = gps.latitude.split('.');
//     let lon_split = gps.longitude.split('.');
//     let gps_p2p_addr = '0x'
//         + util.leftPadding(parseInt(lat_split[0]).toString(16), 2)
//         + util.leftPadding(parseInt(lat_split[1]).toString(16), 2)
//         + util.leftPadding(parseInt(lon_split[0]).toString(16), 2)
//         + util.leftPadding(parseInt(lon_split[1]).toString(16), 2);

//     return gps_p2p_addr;
// }

// geocoderReverse() => call back
const geocoderReverseCB = (latitude, longitude) => {
    return new Promise((resolve, reject) => {
        geocoder.reverse({ lat: latitude, lon: longitude })
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

// Country and City obtained by GPS value
const geocoderReverse = async (latitude, longitude) => {
    let res = await geocoderReverseCB(latitude, longitude);
    let object = {
        country: res[0].countryCode,
        city: res[0].city
    }
    // console.log(object);
    return object;
}