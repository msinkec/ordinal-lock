import { Address, Bn, KeyPair, OpCode, PrivKey, Script, Sig, Tx, TxOut } from "@ts-bitcoin/core"
import { UTXO } from "./lib/models"
import { createOrderLockTx } from "./lib/create-ordinal-lock";
import { cancelOrderLockTx } from "./lib/cancel-ordinal-lock";
import { purchaseOrderLockTx } from "./lib/purchase-ordinal-lock";

const { PAY_WIF, OWNER_WIF } = process.env;

let paymentUtxo: UTXO = {
    txid: "",
    vout: 0,
    satoshis: 50000000,
    script: ""
}

let ordinalUtxo: UTXO = {
    txid: "",
    vout: 0,
    satoshis: 1,
    script: ""
}

const payKp = KeyPair.fromPrivKey(PrivKey.fromWif(PAY_WIF));
const payAdd = Address.fromPrivKey(payKp.privKey);
const ownerKp = KeyPair.fromPrivKey(PrivKey.fromWif(OWNER_WIF));
const ownerAdd = Address.fromPrivKey(ownerKp.privKey);

const paymentOutput = TxOut.fromProperties(
    new Bn(1000000), 
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
console.log(lockTx.toHex());

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
console.log(cancelTx.toHex());

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

lockTx = createOrderLockTx(
    paymentOutput,
    ordinalUtxo,
    paymentUtxo,
    ownerKp,
    payKp
);

txid = lockTx.id();
console.log("Lock #2 txid: ", txid);
console.log(lockTx.toHex());

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
console.log("Lock #2 txid: ", txid);
console.log(lockTx.toHex());

