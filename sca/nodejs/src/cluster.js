//
const { Sema } = require("async-sema");
const cluster = require("cluster");
const os = require("os");

const TxLock = new Sema(1, { capacity : 100} );

//
const define = require("./../config/define.js");
const config = require("./../config/config.js");
const util = require("./utils/commonUtil.js");
const contract = require("./contract/contract.js");
const redis = require("./net/redisUtil.js");
const dbUtil = require("./db/dbUtil.js");
const dbAct = require("./db/dbAct.js");
const dbMain = require("./db/dbMain.js");
const cryptoUtil = require("./sec/cryptoUtil.js");
const kafkaUtil = require("./net/kafkaUtil.js");
const cli = require("./cli/cli.js");
const logger = require("./utils/winlog.js");
const debug = require("./utils/debug.js");

module.exports.getTxLock = aysnc => {
    return TxLock;
}

const SCAInfo = () => {
    logger.info("==================================================");
    logger.info("= PURI Block Chain                               =");
    logger.info("= [ SCA Ver : " + config.VERSION_INFO + " ]                            =");
    logger.info("==================================================");
}

module.exports.ClusterInit = async () => {    
    await kafkaUtil.setTopicName();
    await cryptoUtil.setMyKey(config.MY_KEY_PATH_CONFIG);

    await cryptoUtil.setISPubkey(config.IS_PUBKEY_PATH);
    //logger.debug("config.IS_PUBKEY_PATH : " + config.IS_PUBKEY_PATH);

    contract.setDBKeyIndex();
    contract.setClusterNum();

    if(cluster.isMaster) 
    {
        SCAInfo();

        //
        logger.debug("dbUtil.dbConfig" + JSON.stringify(dbUtil.dbConfig));
        await dbMain.initDatabase();
        await dbAct.setDbKey(contract.myDbKeyIndex, contract.getMySubNetId());

        // await os.cpus().forEach( async(cpu) => {
        //     await cluster.fork();
        //});

        var cpuCount = os.cpus().length;
        logger.debug("cpuCount " + cpuCount);

        for(var i = 0; i < define.CLUSTER_DEFINE.MAX_CLUSTER_WORKER_NUM; i++) {
            cluster.fork();
        }

        cluster.on("online", (worker) => {
            // Each Worker Online then something TODO Here
            // console.log("[M] workerid : " + worker.id + " is online");
        });

        cluster.on("exit", (worker, code, signal) => {
            // When some worker eixt then code here
            logger.debug("[M] " + worker.id + "'s worker is exit"); 

            // exit code error Handle
            // code : process exit code
            // if(code === define.CLUSTER_DEFINE.EXIT_CODE.NORMAL) {
            //     cluster.fork();
            // }
            logger.error("[M] " + worker.id + "'s worker exit code : " + code.toString());
            logger.error("[M] " + worker.id + "'s worker exit signal : " + signal);

            var env = worker.process.env;
            var newWorker = cluster.fork(env);
            newWorker.process.env = env;
        });

        cluster.on("message", async (worker, msg) => {
            // recv from kafka worker's contract data
            // then merge array of contract data
            // and send to NNA Worker

            switch (msg.cmd)
            {
            case define.CMD_DEFINE.RCV_TXS_IND :
                // logger.debug("received CMD " + msg.cmd + " from " + worker);
                if(util.isArray(msg['data']) && msg['data'].length)
                {
                    cluster.workers[define.CLUSTER_DEFINE.NNA_CLUSTER_WORKER_ID_STR].send(msg);
                }
                break;
            case define.CMD_DEFINE.NULL_TXS_IND :
                cluster.workers[define.CLUSTER_DEFINE.NNA_CLUSTER_WORKER_ID_STR].send(msg);
                break;
            case define.CMD_DEFINE.BLK_NOTI_IND :
                // 
                cluster.workers[define.CLUSTER_DEFINE.DB_CLUSTER_WORKER_ID_STR].send(msg);
                //
                cluster.workers[define.CLUSTER_DEFINE.NNA_CLUSTER_WORKER_ID_STR].send(msg);
                cluster.workers[define.CLUSTER_DEFINE.ISA_CLUSTER_WORKER_ID_STR].send(msg);
                cluster.workers[define.CLUSTER_DEFINE.KFK_CLUSTER_WORKER_ID_STR].send(msg);
                break;
            case define.CMD_DEFINE.REDIS_CHK_CFM :
                logger.error("SCA Process Exit : Redis Channel Check Error");
                process.exit(define.CLUSTER_DEFINE.EXIT_CODE.NORMAL);
                break;
            case define.CMD_DEFINE.LOGOUT_REQ :
                cluster.workers[define.CLUSTER_DEFINE.NNA_CLUSTER_WORKER_ID_STR].send(msg);
                break;
            default :
                // Error
                break;
            }
        });
    } 
    else if (cluster.worker.id === define.CLUSTER_DEFINE.NNA_CLUSTER_WORKER_ID) 
    {
        logger.info("worker ID [" + cluster.worker.id +"] to Communicate with NNA");

        // Worker to Communicate with NNA
        await redis.setNNAPubRedis();

        // From other workers to NNA (Local Use only)
        await redis.setNNALocalSubRedis();

        // Worker to Communicate with Rx NNA
        await redis.setNNASubRedis();

        // to NNA (Local Use only)
        await redis.setLocalPubRedis();

        process.on('message', async (msg) => {
            switch (msg.cmd)
            {
            case define.CMD_DEFINE.RCV_TXS_IND :
                if(util.isArray(msg['data']) && msg['data'].length) {
                    await contract.setContractArray(msg['data']);
                }
            case define.CMD_DEFINE.NULL_TXS_IND :
                await contract.sendTxArrToDB();
                break;
            case define.CMD_DEFINE.BLK_NOTI_IND :
                if(msg['data'].length) {
                    await contract.getBNFromRcvdBlkNoti(msg['data']);
                }
                break;
            case define.CMD_DEFINE.LOGOUT_REQ :
                await contract.logoutProcess(msg['data']);
                break;
            default :
                // Error
                break;
            }
        });
    }
    else if (cluster.worker.id === define.CLUSTER_DEFINE.DB_CLUSTER_WORKER_ID) 
    {
        logger.info("worker ID [" + cluster.worker.id +"] to Communicate with DB");

        process.on('message', async (msg) => {
            switch (msg.cmd)
            {
            case define.CMD_DEFINE.BLK_NOTI_IND :
                if(msg['data'].length) {
                    await contract.rcvdBlkNotiFromNNA(msg['data']);
                }
                break;
            default :
                // Error
                break;
            }
        });
    }
    else if (cluster.worker.id === define.CLUSTER_DEFINE.ISA_CLUSTER_WORKER_ID) 
    {
        logger.info("worker ID [" + cluster.worker.id +"] to Communicate with ISA and SCA's cli");
        // Worker to Communicate with ISA and SCA's cli
        await redis.setISARedis();

        // to NNA (Local Use only)
        await redis.setLocalPubRedis();

        //
        cli.cliCallback();

        process.on('message', async (msg) => {
            switch (msg.cmd)
            {
            case define.CMD_DEFINE.BLK_NOTI_IND :
                if(msg['data'].length) {
                    await contract.getBNFromRcvdBlkNoti(msg['data']);
                }
                break;
            default :
                // Error
                break;
            }
        });
    }
    else if (cluster.worker.id === define.CLUSTER_DEFINE.KFK_CLUSTER_WORKER_ID) 
    {
        logger.info("worker ID [" + cluster.worker.id +"] to Consume contract using kafka");
        // Worker to Consume contract using kafka
        await kafkaUtil.setKafkaConsumer(cluster.worker.id);

        // to NNA (Local Use only)
        await redis.setLocalPubRedis();

        process.on('message', async (msg) => {
            switch (msg.cmd)
            {
            case define.CMD_DEFINE.BLK_NOTI_IND :
                if(msg['data'].length) {
                    await contract.getBNFromRcvdBlkNoti(msg['data']);
                }
                break;
            default :
                // Error
                break;
            }
        });
    }

    debug.catchException();

    debug.exceptionHandler();

    process.on('unhandledRejection', debug.unhandledRejection);

    process.on('uncaughtException', debug.uncaughtException);
}

module.exports.sendTxsToMaster = async () => {
    await TxLock.acquire();
    let tempArray = [...contract.getContractArray()];
    process.send({cmd : define.CMD_DEFINE.RCV_TXS_IND, data : tempArray});
    contract.reinitContractArray();
    await TxLock.release();
}

module.exports.sendNullTxsToMaster = async () => {
    await process.send({cmd : define.CMD_DEFINE.NULL_TXS_IND, data : ""});
}

module.exports.sendContractElementToMaster = async (pubkeyArr) => {
    await process.send({cmd : define.CMD_DEFINE.LOGOUT_REQ, data : pubkeyArr});
}

const sendBlkNotiIndToMaster = async () => {
    await TxLock.acquire();
    let tempArray = [...contract.getContractArray()];
    await process.send({cmd : define.CMD_DEFINE.BLK_NOTI_IND, data : tempArray});
    contract.reinitContractArray();
    await TxLock.release();
}
