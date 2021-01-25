#!bin/bash

if [ "$#" -lt 1 ]; then
    echo "Enter 'ROLE' as an option.[ NN / SCA / DN / DBN ]"
    exit 1
fi
role=${1}
if [ "${role}" == "NN" ]; then
echo "My Role : ${role}"
cd ./../../../nna/c && ./bin/debug/node
fi
if [ "${role}" == "SCA" ]; then
echo "My Role : ${role}"
cd ./../../../sca/nodejs && node main.js
fi
if [ "${role}" == "DN" ]; then
echo "My Role : ${role}"
cd ./../../../dn/nodejs && node main.js
fi
if [ "${role}" == "DBN" ]; then
echo "My Role : ${role}"
cd ./../../../dbn/nodejs && node main.js
fi
