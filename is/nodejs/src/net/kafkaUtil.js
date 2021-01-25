//
const kafkanode = require('kafka-node');
const rdkafka = require('node-rdkafka');

//
const config = require('./../../config/config.js');
const logger = require('./../utils/winlog.js');
const dbUtil = require('./../db/dbUtil.js');
const dbIS = require('./../db/dbIS.js');
const util = require('./../utils/commonUtil.js');

// add kafka list
module.exports.addKafka = async(broker_list) => {
    await dbUtil.queryPre(dbIS.querys.kafka_info.add_broker_list, [define.P2P_DEFINE.P2P_SUBNET_ID_IS, broker_list]);
    let idx = await dbUtil.queryPre(dbIS.querys.kafka_info.idx_from_broker, [broker_list]);
    if (idx.length)
    {
        logger.info('[KAFKA] Add Kafka Successful. idx : '+idx[0].idx);
    }
    else
    {
        logger.error("Error - No data from kafka_info");
    }
}

// init kafka
module.exports.initKafka = async() => {
    logger.info('[KAFKA] Kafka Init Start');
    let broker_list;
    let admin;
    let client;
    let topic_arr;
    let topic_list = await dbUtil.query(dbIS.querys.cluster_info.cluster_p2p_addr_list);
    let kafka_list = await dbUtil.queryPre(dbIS.querys.kafka_info.kafka_list);

    if (!topic_list.length || !kafka_list.length)
    {
        logger.error("Error - No data from kafka_info");
        return;
    }

    for(var i =0 ; i < kafka_list.length ; i++){
        let updateTopicList = new Array();
        broker_list = kafka_list[i].broker_list;
        admin = new kafkanode.KafkaClient(
            {
                kafkaHost: broker_list
            }
        );
        client = rdkafka.AdminClient.create({
            'client.id': 'IS',
            'metadata.broker.list': broker_list
        });

		// get kafka old topic list
        topic_arr = await listTopic(admin);
		
		// delete all kafka old topic list
        await util.asyncForEach(topic_arr, async(element, index) =>{
            await client.deleteTopic(element, 1000,
                function (err) {
                    // logger.error(err);
                });
            logger.debug('[KAFKA] delete topic Success : ' + element);
        })
        await util.sleep(500);
		
		// create new topic
        await util.asyncForEach(topic_list.cluster_p2p_addr, async(element, index) =>{
            if (index % kafka_list.broker_list.length == i)
            {
                await client.createTopic({
                    topic: element.slice(2),
                    num_partitions: 1,
                    replication_factor: 3
                }, function (err) {
                    // logger.error(err);
                });
                logger.debug(element.slice(2) + ' topic created into KafkaIDX : ' + kafka_list.idx[i]);
                updateTopicList.push(element.slice(2));
            }
        })
        let db_topic_arr = updateTopicList.toString();
        await dbUtil.queryPre(dbIS.querys.kafka_info.update_topic_list, [db_topic_arr, kafka_list.idx[i]]);
        await client.disconnect();
        logger.info('[KAFKA] Kafka Init Success');
    }
}

function listTopicCB(admin, topic_arr) {
    return new Promise((resolve, reject) => {
        admin.listTopics((err, res) => {
            let topic = Object.keys(res[1].metadata);
            for (var i = 0; i < topic.length; i++) {
                if (topic[i].length === 12) {
                    topic_arr.push(topic[i]);
                }
            }
            if (err) {
                reject(err);
            } else {
                resolve(topic_arr);
            }
        });
    });
}

async function listTopic(kafka_admin) {
    let admin = new kafkanode.Admin(kafka_admin);
    let topic_arr = new Array();

    topic_arr = await listTopicCB(admin, topic_arr).then((resData) => {
        return resData;
    });

    // topic_arr = topic_arr.split(',');
    return topic_arr;
}
