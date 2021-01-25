const cryptoSsl = require("./build/Release/crypto-ssl");

////////////////////////////////////////////////////
// ECDSA - R1
// Test 1
const ecrprikey1 = "a69e75d5727c07942eb359fe62afd97c447130ca5b8496048c5c7b94e513da78";
const ecrpubkey1 = "04354d54bdc0b9d94a841cfdd0bd25b9c61b603fbe47d95ecbf8b445614aac559d494b0ab32310c2ac3546fecdec4717d9d3f5c46d1042560f5aeaff95acec7496";
const ecrdata1 = "559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd";
// const ecrr1 = "640CFDF9C7E2AB303834DDE4B3E24C9950D846299BB3165648674E600A36F704";
// const ecrs1 = "879C4F4A89E815BF54203537D10D654CFD3DAA6D0E49F73278410F863BFFFE6B";

// Test 2
const ecrpubkey2 = "037A7ED2B23B16B3DFA5351DE64FDB96E339807278A032D700E3D88734BF6E67EC";
const ecrdata2 = "559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd";
const ecrr2 = "A7C97CEF667F2D687BFF9457407244E199FCBB9E7C8895BF7C1FC53C79F1AD78";
const ecrs2 = "864AF578EFE3A5866457B57E98ADDDBEF3791C0EF74122F7AB7A849FF03CC960";

////////////////////////////////////////////////////
// EDDSA
// Test 2
const edpubkey2 = "3D32A0648C360D7CB4CFC7BA8579AACD2B5298A5BB324DB6C32134F7AC11AE1E";
const edprvkey2 = "ac8b1e03cb8ef427b896f6e3db96d1db078c67c3f0b8a6f144789fff29546067";
const eddata2 = "fab3362e57027ad6d4d2447b479756254cb7781762c906a4cb69ea20c7939b8c";
// const edsignature2 = "607b8a43fc7bbbff898083bd0bdfe57dbf34212f34adfefe2bfe807a7076337888e04c86bbae4f56d9834d503e5c76b065efad98942bfe04b906796ac3333e09";


let test = async () => {
    cryptoSsl.eddsaTest();

    // const retEcK1V = await cryptoSsl.ecdsaK1Verify(eckdata, eckr, ecks, eckpubkey);
    // console.log("retEcK1V : " + retEcK1V);


    // ECDSA R1 Test 1
    console.log("======================= ECDSA R1 Test 1 Start ==========================");
    console.log("========= ECDSA R1 Test 1-1) Pem =========");
    // Sig From Pem
    let retEcR1V1SigPem = cryptoSsl.ecdsaR1SignPem(ecrdata1, "./test/privkey.pem");
    console.log("retEcR1V1SigPem : " + retEcR1V1SigPem);
    console.log(" ");
    console.log(" ");

    // Verify From Pem
    let retEcR1V1PemSigR = retEcR1V1SigPem.slice(0,64);
    let retEcR1V1PemSigS = retEcR1V1SigPem.slice(64);

    console.log("retEcR1V1PemSigR : " + retEcR1V1PemSigR);
    console.log("retEcR1V1PemSigS : " + retEcR1V1PemSigS);
    console.log(" ");

    const retEcR1V1Pem = await cryptoSsl.ecdsaR1VerifyHex(ecrdata1, retEcR1V1PemSigR, retEcR1V1PemSigS, ecrpubkey1);
    console.log("retEcR1V1Pem : " + retEcR1V1Pem);
    console.log(" ");
    console.log(" ");

    console.log("========= ECDSA R1 Test 1-2) Hex =========");
    // Sig From Hex
    let retEcR1V1SigHex = cryptoSsl.ecdsaR1SignHex(ecrdata1, ecrprikey1);
    console.log("retEcR1V1SigHex : " + retEcR1V1SigHex);
    console.log(" ");
    console.log(" ");

    // Verify From Hex
    let retEcR1V1HexSigR = retEcR1V1SigHex.slice(0,64);
    let retEcR1V1HexSigS = retEcR1V1SigHex.slice(64);

    console.log("retEcR1V1HexSigR : " + retEcR1V1HexSigR);
    console.log("retEcR1V1HexSigS : " + retEcR1V1HexSigS);
    console.log(" ");

    const retEcR1V1Hex = await cryptoSsl.ecdsaR1VerifyHex(ecrdata1, retEcR1V1HexSigR, retEcR1V1HexSigS, ecrpubkey1);
    console.log("retEcR1V1Hex : " + retEcR1V1Hex);
    console.log(" ");
    console.log(" ");
    console.log("======================= ECDSA R1 Test 1 End ============================");

    // ECDSA R1 Test 2
    console.log("======================= ECDSA R1 Test 2 Start ==========================");
    const retEcR1V2 = await cryptoSsl.ecdsaR1VerifyHex(ecrdata2, ecrr2, ecrs2, ecrpubkey2);
    console.log("retEcR1V2 : " + retEcR1V2);
    console.log("======================= ECDSA R1 Test 2 End ============================");

    // EDDSA Test 2
    console.log("======================= EDDSA Test 2 Start ============================");
    console.log("========= EDDSA Test 1-1) Pem =========");
    let retEdV2SigPem = cryptoSsl.eddsaSignPem(eddata2, "./test/ed_privkey.pem");
    console.log("retEdV2SigPem : " + retEdV2SigPem);

    const retEdV2Pem = await cryptoSsl.eddsaVerifyHex(eddata2, retEdV2SigPem, edpubkey2);
    console.log("retEdV2Hex : " + retEdV2Pem);

    console.log("========= EDDSA Test 1-2) Hex =========");
    let retEdV2SigHex = cryptoSsl.eddsaSignHex(eddata2, edprvkey2);
    console.log("retEdV2SigHex : " + retEdV2SigHex);

    const retEdV2Hex = await cryptoSsl.eddsaVerifyHex(eddata2, retEdV2SigHex, edpubkey2);
    console.log("retEdV2Hex : " + retEdV2Hex);
    console.log("======================= EDDSA Test 2 End ==============================");

    
    let retEdPrikey = cryptoSsl.eddsaGetPrikey("./test/ed_privkey.pem");
    console.log("retEdPrikey : " + retEdPrikey);

    
    let retEdPubkey = cryptoSsl.eddsaGetPubkey("./test/ed_pubkey.pem");
    console.log("retEdPubkey : " + retEdPubkey);
}

test();
