//
const cluster = require("./src/cluster.js");

//
const main = async () => {
    await cluster.ClusterInit();
}

main();