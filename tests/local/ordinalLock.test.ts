import { expect, use } from 'chai'
import {
    MethodCallOptions,
    bsv,
    PubKeyHash,
    Utils,
    Ripemd160,
    findSig,
    PubKey,
    hash160,
} from 'scrypt-ts'
import { OrdinalLock } from '../../src/contracts/ordinalLock'
import { getDummySigner, getDummyUTXO } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
import { bindInscription, purchaseTxBuilder } from '../../src/util'
use(chaiAsPromised)

// Listing price.
const price = 10000n

// Seller key.
const seller = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)

// Output that will pay the seller.
const payOutput = Utils.buildPublicKeyHashOutput(
    Ripemd160(seller.toAddress().toHex()),
    price
)

describe('Test SmartContract `OrdinalLock`', () => {
    let instance: OrdinalLock

    before(async () => {
        await OrdinalLock.compile()
        instance = new OrdinalLock(
            PubKeyHash(hash160(seller.publicKey.toHex())),
            payOutput
        )
        await instance.connect(getDummySigner(seller))

        // Bind tx builder for public method "purchase"
        instance.bindTxBuilder('purchase', purchaseTxBuilder)
    })

    it('should pass purchase method call successfully.', async () => {
        const buyerSigner = getDummySigner()
        const { tx: callTx, atInputIndex } = await instance.methods.purchase({
            fromUTXO: getDummyUTXO(),
            changeAddress: await buyerSigner.getDefaultAddress(),
        } as MethodCallOptions<OrdinalLock>)
        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })

    it('should pass cancel method call successfully.', async () => {
        const { tx: callTx, atInputIndex } = await instance.methods.cancel(
            (sigResp) => findSig(sigResp, seller.publicKey),
            PubKey(seller.publicKey.toHex()),
            {
                fromUTXO: getDummyUTXO(),
                pubKeyOrAddrToSign: seller.publicKey,
                changeAddress: seller.toAddress(),
            } as MethodCallOptions<OrdinalLock>
        )
        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })

    it('should fail purchase method w wrong payment out.', async () => {
        const wrongPayOutput = Utils.buildPublicKeyHashOutput(
            Ripemd160(bsv.PrivateKey.fromRandom().toAddress().toHex()),
            price
        )
        instance.bindTxBuilder(
            'purchase',
            (
                current: OrdinalLock,
                options: MethodCallOptions<OrdinalLock>
            ): Promise<any> => {
                const payOutputBR = new bsv.encoding.BufferReader(
                    Buffer.from(wrongPayOutput, 'hex')
                )

                const unsignedTx: bsv.Transaction = new bsv.Transaction()
                    .addInput(current.buildContractInput(options.fromUTXO))
                    .addOutput(
                        bsv.Transaction.Output.fromBufferReader(payOutputBR)
                    )

                if (options.changeAddress) {
                    unsignedTx.change(options.changeAddress)
                }

                const result = {
                    tx: unsignedTx,
                    atInputIndex: 0, // the contract input's index
                }

                return Promise.resolve(result)
            }
        )
        const buyerSigner = getDummySigner()

        return expect(
            instance.methods.purchase({
                fromUTXO: getDummyUTXO(),
                changeAddress: await buyerSigner.getDefaultAddress(),
            } as MethodCallOptions<OrdinalLock>)
        ).to.be.rejectedWith(/Execution failed/)
    })

    it('should fail cancel method w bad sig.', async () => {
        const wrongKey = bsv.PrivateKey.fromRandom()
        const wrongSigner = getDummySigner(wrongKey)
        instance.connect(wrongSigner)

        return expect(
            instance.methods.cancel(
                (sigResp) => findSig(sigResp, wrongKey.publicKey),
                PubKey(wrongKey.publicKey.toHex()),
                {
                    fromUTXO: getDummyUTXO(),
                    pubKeyOrAddrToSign: wrongKey.publicKey,
                    changeAddress: wrongKey.toAddress(),
                } as MethodCallOptions<OrdinalLock>
            )
        ).to.be.rejectedWith(/bad seller/)
    })
})
