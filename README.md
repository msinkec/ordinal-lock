# ordinal-lock

OrdinalLock is a Bitcoin Contract which allows an Ordinal to be offered up for sale on a decentralized marketplace. These listings can be purchased by anyone who is able to pay the requested price. Listings can also be cancelled by the person who listed them, or another pre-determined public key hash.

OrdinalLock is based on the RelayX OrderLock which was designed to work with Run tokens. OrderLock has some requirements on how the spending transaction must be formatted which is incompatible with ordinals.

See Typescript and sCrypt code of contracts in `/contracts` directory.

See example.ts for examples of creating, cancelling, and purchasing OrderLocks.

## Build

```sh
npm run build
```

## Testing Locally

```sh
npm t
```

## Run Bitcoin Testnet Tests

```sh
npm run testnet
```

## Deploy listing

Adjust `deploy.ts` (see TODO's) and run:

```sh
npm run deploy
```
