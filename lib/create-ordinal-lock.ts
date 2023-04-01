import { Address, Bn, KeyPair, OpCode, PrivKey, Script, Sig, Tx, TxOut } from "@ts-bitcoin/core"
import { Buffer } from "buffer"
import { UTXO } from "./models"

const oLockPrefix = Buffer.from("2097dfd76851bf465e8f715593b217714858bbe9570ff3bd5e33840a34e20ff0262102ba79df5f8ae7604a9830f03c7933028186aede0675a16f025dc4f8be8eec0382201008ce7480da41702918d1ec8e6849ba32b4d65b1e40dc669c31a1e6306b266c0000", "hex")
const oLockSuffix = Buffer.from("615179547a75537a537a537a0079537a75527a527a7575615579008763567901c161517957795779210ac407f0e4bd44bfc207355a778b046225a7068fc59ee7eda43ad905aadbffc800206c266b30e6a1319c66dc401e5bd6b432ba49688eecd118297041da8074ce081059795679615679aa0079610079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a75615779567956795679567961537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff00517951796151795179970079009f63007952799367007968517a75517a75517a7561527a75517a517951795296a0630079527994527a75517a6853798277527982775379012080517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01205279947f7754537993527993013051797e527e54797e58797e527e53797e52797e57797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a7561517a75517a756169587951797e58797eaa577961007982775179517958947f7551790128947f77517a75517a75618777777777777777777767557951876351795779a9876957795779ac777777777777777767006868", "hex")
const MAP = Buffer.from("1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5")
const INPUT_SIZE = 148;
const OUTPUT_SIZE = 34;
const SATS_PER_KB = 50;

export function createOrderLockTx(paymentOutput: TxOut, ordinalUtxo: UTXO, paymentUtxo: UTXO, ownerKp: KeyPair, payKp: KeyPair) {
    const payAdd = Address.fromPrivKey(payKp.privKey);
    const ownerAdd = Address.fromPrivKey(ownerKp.privKey);
    const tx = new Tx();
    tx.addTxIn(
        Buffer.from(ordinalUtxo.txid, 'hex').reverse(), 
        ordinalUtxo.vout, 
        new Script(), 
        0xffffffff
    );

    const lockScript = Script.fromBuffer(oLockPrefix)
        .writeBuffer(ownerAdd.hashBuf)
        .writeBuffer(paymentOutput.toBuffer())
        .writeScript(Script.fromBuffer(oLockSuffix))
        .writeOpCode(OpCode.OP_RETURN)
        .writeBuffer(MAP)
        .writeBuffer(Buffer.from(("SET")))
        .writeBuffer(Buffer.from("type"))
        .writeBuffer(Buffer.from("listing"))
        .writeBuffer(Buffer.from("listingType"))
        .writeBuffer(Buffer.from("OrdinalLock"))
    
    tx.addTxOut(new Bn(1), lockScript)

    let sig = tx.sign(
        ownerKp,
        Sig.SIGHASH_SINGLE | Sig.SIGHASH_ANYONECANPAY | Sig.SIGHASH_FORKID,
        0,
        Script.fromHex(ordinalUtxo.script),
        new Bn(ordinalUtxo.satoshis)
    )
    tx.txIns[0].setScript(
        new Script()
            .writeBuffer(sig.toTxFormat())
            .writeBuffer(ownerKp.pubKey.toBuffer())
    )

    tx.addTxIn(
        Buffer.from(paymentUtxo.txid, "hex").reverse(),
        paymentUtxo.vout,
        new Script(),
        0xffffffff
    )

    const size = tx.toBuffer().length + INPUT_SIZE + OUTPUT_SIZE
    const fee = Math.ceil(size / 1000 * SATS_PER_KB)
    tx.addTxOut(new Bn(paymentUtxo.satoshis - fee), payAdd.toTxOutScript())

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