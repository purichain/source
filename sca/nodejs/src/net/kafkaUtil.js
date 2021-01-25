//
const Kafka = require('node-rdkafka');

//
const config = require("./../../config/config.js");
const define = require("./../../config/define.js");
const contract = require('./../contract/contract.js');
const logger = require('./../utils/winlog.js');

//
let topicName;

//
module.exports.getTopicName = () => {
    return topicName;
} 

module.exports.setTopicName = () => {
    let nnaConf = config.NN_NODE_JSON;
    let P2Proot = nnaConf.NODE.P2P.CLUSTER.ROOT;
    let TopicName = P2Proot.slice(
        define.P2P_DEFINE.P2P_TOPIC_NAME_SPLIT_INDEX.START, 
        define.P2P_DEFINE.P2P_TOPIC_NAME_SPLIT_INDEX.END);

    topicName = TopicName;
    logger.info("TopicName" + TopicName);
};

module.exports.setKafkaConsumer = async (cluster_id) => {
    let consumer = new Kafka.KafkaConsumer(config.KAFKA_CONFIG);

    consumer.on('ready', (arg) => {
        consumer.subscribe([topicName]);
        consumer.consume();
        logger.info("Cluster ID : " + cluster_id + "'s Kafka Consumer ready to consume " + JSON.stringify(arg));
        logger.info(`Consumption topic name [${topicName}] `);
    });

    consumer.on('data', async (data) => {
        logger.debug("Recieved Contract From Wallet");
        logger.debug(data.value);

//        let len = data.value.toString().length; // - 1
        let contract_res = await contract.createTx(JSON.parse(JSON.stringify(Buffer.from(data.value).toString())));
        // let contract_res = await contract.createTx(data.value.toString());
        logger.debug(JSON.stringify(contract_res));
    });

    consumer.on('disconnected', (arg) => {
        logger.error("Kafka Consumer Disconnected" + JSON.stringify(arg));
    });

    consumer.on('event.error', (err) => {
        logger.error("Kafka Consumer Error : ", err);
    });

    consumer.connect();

}