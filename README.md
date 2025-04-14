# Vaulta Web IDE

This is a web IDE for Vaulta smart contracts. 
If you want to run this locally you need to run the [Web IDE API](https://github.com/vaultafoundation/web-ide-api)

## Run me

Steps to run this project locally:
- Clone this repo
- Copy the `.env.example` file to `.env`
- Edit the `.env` file to point to your API

```bash
yarn
yarn dev
```

## Setting up firebase

This project uses firebase for authentication.

Create a project and copy the config to `src/utils/firebase`.
Then copy the firestore rules in that file to your firestore rules in the firebase console (if you don't anyone can read/write to your database). 
