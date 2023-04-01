import { Address, Bn, KeyPair, OpCode, Script, Sig, Tx, TxOut } from "@ts-bitcoin/core"
import { Buffer } from "buffer"
import { UTXO } from "./models"

const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;
const SATS_PER_KB = 50;

export function purchaseOrderLockTx(lockUtxo: UTXO, paymentOutput: TxOut, paymentUtxo: UTXO, buyerAdd: Address, payKp: KeyPair) {
    const payAdd = Address.fromPrivKey(payKp.privKey);

    const tx = new Tx();
    // Add locked ordinal as first input
    tx.addTxIn(
        Buffer.from(lockUtxo.txid, 'hex').reverse(), 
        lockUtxo.vout, 
        new Script(), 
        0xffffffff
    );

    // Add owner as first output
    tx.addTxOut(new Bn(1), buyerAdd.toTxOutScript())
    tx.addTxOut(paymentOutput)

    // Placeholder for change script
    tx.addTxOut(new Bn(0), payAdd.toTxOutScript())

    // Call first time calcualte the length of the preimage
    let preimage = tx.sighashPreimage(
        Sig.SIGHASH_FORKID | Sig.SIGHASH_ALL | Sig.SIGHASH_ANYONECANPAY,
        0,
        Script.fromHex(lockUtxo.script),
        new Bn(lockUtxo.satoshis),
        Tx.SCRIPT_ENABLE_SIGHASH_FORKID
    );
    const selfOutput = tx.txOuts[0].toBuffer()
    tx.txIns[0].setScript(new Script()
        .writeBuffer(selfOutput)
        .writeBuffer(tx.txOuts[2].toBuffer())
        .writeBuffer(preimage)
        .writeOpCode(OpCode.OP_0)
    )
    
    // Calculate fees
    const size = tx.toBuffer().length + // tx
        INPUT_SIZE + // fees
        OUTPUT_SIZE // change
    const fee = Math.ceil(size / 1000 * SATS_PER_KB)

    // Update placeholder change output to correct value
    tx.txOuts[2].valueBn = new Bn(paymentUtxo.satoshis - fee - paymentOutput.valueBn.toNumber())

    // Call second time with the correct change output
    preimage = tx.sighashPreimage(
        Sig.SIGHASH_FORKID | Sig.SIGHASH_ALL | Sig.SIGHASH_ANYONECANPAY,
        0,
        Script.fromHex(lockUtxo.script),
        new Bn(lockUtxo.satoshis),
        Tx.SCRIPT_ENABLE_SIGHASH_FORKID
    );
    // Set input script
    tx.txIns[0].setScript(new Script()
        .writeBuffer(selfOutput)
        .writeBuffer(tx.txOuts[2].toBuffer())
        .writeBuffer(preimage)
        .writeOpCode(OpCode.OP_0)
    )

    // Add payment as second input
    tx.addTxIn(
        Buffer.from(paymentUtxo.txid, "hex").reverse(),
        paymentUtxo.vout,
        new Script(),
        0xffffffff
    )

    const sig = tx.sign(
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