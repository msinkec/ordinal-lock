import { OrdinalLock } from './src/contracts/ordinalLock'
import { bindInscription } from './src/util'
import {
    bsv,
    TestWallet,
    DefaultProvider,
    Utils,
    hash160,
    PubKeyHash,
} from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY)

// Prepare signer.
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(privateKey, new DefaultProvider())

async function main() {
    // TODO: Adjust inscription:
    const inscriptionScript = bsv.Script.fromASM(
        'OP_FALSE OP_IF 6f7264 OP_TRUE 746578742f706c61696e OP_FALSE 546573742046696c6520310a OP_ENDIF'
    )

    // TODO: Adjust listing price:
    const price = 10000n

    // Output that will pay the seller (you).
    const payOutput = Utils.buildPublicKeyHashOutput(
        hash160(privateKey.publicKey.toHex()),
        price
    )

    await OrdinalLock.compile()
    const instance = new OrdinalLock(
        PubKeyHash(hash160(privateKey.publicKey.toHex())),
        payOutput
    )

    // Connect to a signer
    await instance.connect(signer)

    // Bind inscription to ordinal-lock contract
    bindInscription(instance, inscriptionScript)

    // Contract deployment
    const tx = await instance.deploy(1)
    console.log('OrdinalLock contract deployed: ', tx.id)

    return tx.id
}

main()
