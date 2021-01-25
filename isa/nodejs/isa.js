//
const sock = require('./src/net/socket.js');
const redisUtil = require('./src/net/redisUtil.js');
const cryptoUtil = require('./src/sec/cryptoUtil.js');
const config = require('./config/config.js');
const cli = require('./src/cli/cli.js');

//
const main = async() => {
    //
    await cryptoUtil.setMyKey(config.myKeyPathConfig);

    let isa = await sock.isClient();
    redisUtil.setRedis(isa);

    await cli.cliCallback();
}

main();

