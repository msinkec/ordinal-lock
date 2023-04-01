import { Address, Bn, KeyPair, Script, Sig, Tx } from "@ts-bitcoin/core"
import { Buffer } from "buffer"
import { UTXO } from "./models"

const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;
const SATS_PER_KB = 50;

export function cancelOrderLockTx(lockUtxo: UTXO, paymentUtxo: UTXO, ownerKp: KeyPair, payKp: KeyPair) {
    const payAdd = Address.fromPrivKey(payKp.privKey);
    const ownerAdd = Address.fromPrivKey(ownerKp.privKey);

    const tx = new Tx();
    // Add locked ordinal as first input
    tx.addTxIn(
        Buffer.from(lockUtxo.txid, 'hex').reverse(), 
        lockUtxo.vout, 
        new Script(), 
        0xffffffff
    );

    // Add owner as first output
    tx.addTxOut(new Bn(1), ownerAdd.toTxOutScript())
    
    // Sign the ordinal input 
    let sig = tx.sign(
        ownerKp,
        Sig.SIGHASH_SINGLE | Sig.SIGHASH_ANYONECANPAY | Sig.SIGHASH_FORKID,
        0,
        Script.fromHex(lockUtxo.script),
        new Bn(lockUtxo.satoshis)
    )
    tx.txIns[0].setScript(
        new Script()
            .writeBuffer(sig.toTxFormat())
            .writeBuffer(ownerKp.pubKey.toBuffer())
    )

    // Add payment as second input
    tx.addTxIn(
        Buffer.from(paymentUtxo.txid, "hex").reverse(),
        paymentUtxo.vout,
        new Script(),
        0xffffffff
    )

    // Calculate fees
    const size = tx.toBuffer().length + INPUT_SIZE + OUTPUT_SIZE
    const fee = Math.ceil(size / 1000 * SATS_PER_KB)
    
    // Add change output
    tx.addTxOut(new Bn(paymentUtxo.satoshis - fee), payAdd.toTxOutScript())

    // Sign the payment input
    sig = tx.sign(
        payKp,
        Sig.SIGHASH_ALL | Sig.SIGHASH_ANYONECANPAY | Sig.SIGHASH_FORKID,
        1,
        payAdd.toTxOutScript(),
        new Bn(paymentUtxo.satoshis)
    )
    tx.txIns[1].setScript(
        new Script()
            .writeBuffer(sig.toTxFormat())
            .writeBuffer(payKp.pubKey.toBuffer())
    )
    return tx
}