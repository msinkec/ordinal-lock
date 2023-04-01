import { Address, Bn, KeyPair, PrivKey, TxOut } from "@ts-bitcoin/core"
import { UTXO } from "./lib/models"
import { createOrderLockTx } from "./lib/create-ordinal-lock";
import { cancelOrderLockTx } from "./lib/cancel-ordinal-lock";
import { purchaseOrderLockTx } from "./lib/purchase-ordinal-lock";

const { PAY_WIF, OWNER_WIF } = process.env;

// POPULATE THESE WITH YOUR OWN UTXOS
let paymentUtxo: UTXO = {
    txid: "66d1be784410c9020adfa0e04595942b9b44e744e1a9dde81fc5435e302df48b",
    vout: 1,
    satoshis: 98515,
    script: "76a914862edde3cbaf3487c169eb253737c89059dda0b388ac"
}

let ordinalUtxo: UTXO = {
    txid: "efa1b675f6b3384023c430e0aa633cad403a971fac8bdca8dbc6dbd79484f18c",
    vout: 0,
    satoshis: 1,
    script: "76a914e0a630d5395b510c5ce3647b12cafe2c9dc8b1a988ac0063036f7264510a746578742f706c61696e000c546573742046696c6520310a68"
}

const payKp = KeyPair.fromPrivKey(PrivKey.fromWif(PAY_WIF));
const payAdd = Address.fromPrivKey(payKp.privKey);
const ownerKp = KeyPair.fromPrivKey(PrivKey.fromWif(OWNER_WIF));
const ownerAdd = Address.fromPrivKey(ownerKp.privKey);

const paymentOutput = TxOut.fromProperties(
    new Bn(10000), 
    payAdd.toTxOutScript()
);

let lockTx = createOrderLockTx(
    paymentOutput,
    ordinalUtxo,
    paymentUtxo,
    ownerKp,
    payKp
);

let txid = lockTx.id();
console.log("Lock #1 txid: ", txid);
console.log(lockTx.toHex(), "\n\n");

ordinalUtxo = {
    txid: txid,
    vout: 0,
    satoshis: 1,
    script: lockTx.txOuts[0].script.toHex()
};

paymentUtxo = {
    txid: txid,
    vout: 1,
    satoshis: lockTx.txOuts[1].valueBn.toNumber(),
    script: lockTx.txOuts[1].script.toHex()
};

const cancelTx = cancelOrderLockTx(
    ordinalUtxo,
    paymentUtxo,
    ownerKp,
    payKp
);

txid = cancelTx.id();
console.log("Cancel txid: ", txid);
console.log(cancelTx.toHex(), "\n\n");

ordinalUtxo = {
    txid: txid,
    vout: 0,
    satoshis: 1,
    script: cancelTx.txOuts[0].script.toHex()
};

paymentUtxo = {
    txid: txid,
    vout: 1,
    satoshis: cancelTx.txOuts[1].valueBn.toNumber(),
    script: cancelTx.txOuts[1].script.toHex()
};

lockTx = createOrderLockTx(
    paymentOutput,
    ordinalUtxo,
    paymentUtxo,
    ownerKp,
    payKp
);

txid = lockTx.id();
console.log("Lock #2 txid: ", txid);
console.log(lockTx.toHex(), "\n\n");

ordinalUtxo = {
    txid: txid,
    vout: 0,
    satoshis: 1,
    script: lockTx.txOuts[0].script.toHex()
};

paymentUtxo = {
    txid: txid,
    vout: 1,
    satoshis: lockTx.txOuts[1].valueBn.toNumber(),
    script: lockTx.txOuts[1].script.toHex()
};

lockTx = purchaseOrderLockTx(
    ordinalUtxo,
    paymentOutput,
    paymentUtxo,
    ownerAdd, // Sending back to owner
    payKp
);

txid = lockTx.id();
console.log("Purchase txid: ", txid);
console.log(lockTx.toHex(), "\n\n");

