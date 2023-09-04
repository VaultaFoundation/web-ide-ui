import { Chains, Session, SessionKit, ABI, Serializer } from "@wharfkit/session"
import { WebRenderer } from "@wharfkit/web-renderer"
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor"
import {TransactPluginResourceProvider} from '@wharfkit/transact-plugin-resource-provider'
import {availableInteractions, availableTables, contractDeployedTo} from "../stores";
import ConsoleService from "./Console.service";

const webRenderer = new WebRenderer()

const sessionKit = new SessionKit({
    appName: "EOS WEB IDE",
    chains: [Chains.EOS],
    ui: webRenderer,
    walletPlugins: [new WalletPluginAnchor()],
},
    {
        // ... your other options
        transactPlugins: [new TransactPluginResourceProvider()],
    })

let session:Session|null = null;



const applyContract = (abi) => {
    const processed = {
        actions: abi.actions.map((action:any) => {
            return {
                name: action.name,
                params: abi.structs.find((struct:any) => struct.name === action.type).fields.map((field:any) => {
                    return {
                        name: field.name,
                        type: field.type
                    }
                })
            }
        }),
        tables: abi.tables.map((table:any) => ({
            name:table.name
        }))
    }
    contractDeployedTo.set(session.actor.toString());
    ConsoleService.prepend(`Deployed successfully!`);
    availableInteractions.set(processed.actions);
    availableTables.set(processed.tables);
    return true;
}

export default class WalletService {

    static async login() {
        session = await sessionKit.restore();
        if(session) return true;

        const { session:_session } = await sessionKit.login()
        session = _session;
        return !!session;
    }

    static async logout() {
        await sessionKit.logout()
        session = null;
        return true;
    }

    static getConnectedAccount(){
        if(!session) return null;
        return session.actor.toString();
    }

    static async restoreSession(){
        session = await sessionKit.restore();
        return !!session;
    }

    static async deployContract(wasm, abi) {
        const estimatedRam = wasm.byteLength * 10;

        const accountInfo = await session.client.v1.chain.get_account(session.actor).catch(err => {
            console.error(err);
            return {
                ram_quota: 0,
            };
        });


        const ramOwned = parseInt(accountInfo.ram_quota.toString());
        const ramRequired = ramOwned - estimatedRam;
        // const ramRequired = 0;

        let actions = [{
            account: 'eosio',
            name: 'setcode',
            authorization: [session.permissionLevel],
            data: {
                account: session.actor,
                vmtype: 0,
                vmversion: 0,
                code: wasm,
            },
        },{
            account: 'eosio',
            name: 'setabi',
            authorization: [session.permissionLevel],
            data: {
                account: session.actor,
                abi: Serializer.encode({
                    object: abi,
                    type: ABI
                }),
            },
        }];

        if(ramRequired > 0){
            actions.unshift({
                account: 'eosio',
                name: 'buyrambytes',
                authorization: [session.permissionLevel],
                data: {
                    // @ts-ignore
                    payer: session.actor,
                    receiver: session.actor,
                    bytes: ramRequired,
                },
            });
        }

        return await session.transact({ actions }).then(x => {
            return applyContract(abi);
        }).catch(err => {
            if(err.toString().indexOf("contract is already running this version of code") > -1){
                return applyContract(abi);
            }

            console.error(err);
            return false;
        })
    }

    static async transact(action, params) {
        const actions = [{
            account: session.actor,
            name: action,
            authorization: [session.permissionLevel],
            data: params,
        }];

        return await session.transact({ actions }).then(x => {
            ConsoleService.prepend(`Interaction success!`);
            ConsoleService.prepend(`<details><summary>Transaction: <a class="text-fontHighlight" style="color:text-decoration: underline;" href="https://bloks.io/tx/${x.response.transaction_id}" target="_blank">See transaction on explorer</a></summary><pre>${JSON.stringify(x.response, null, 4)}</pre></details>`);
            ConsoleService.prepend('');

            return true;
        }).catch(err => {
            console.error(err);
            ConsoleService.prepend(`Interaction failed!`);
            ConsoleService.prepend(`Error: ${err.toString()}`);
            ConsoleService.prepend('');
            return false;
        })
    }

    static async getTableRows(table, scope, lowerBound, upperBound, limit) {
        await session.client.v1.chain.get_table_rows({
            json: true,
            code: session.actor,
            scope,
            table,
            lower_bound: lowerBound,
            upper_bound: upperBound,
            limit,
        }).then(x => {
            ConsoleService.prepend(JSON.stringify(x.rows, null, 4));
            ConsoleService.prepend('');
        }).catch(err => {
            ConsoleService.prepend(`Table result failed!`);
            ConsoleService.prepend(`Error: ${err.toString()}`);
            ConsoleService.prepend('');
        })

    }

    static async checkIfContractDeployed(){
        const accountInfo = await session.client.v1.chain.get_account(session.actor).catch(err => {
            console.error(err);
            return null;
        });

        if(!accountInfo) return;

        if(accountInfo.last_code_update.toMilliseconds() > 0){
            const abi = await session.client.v1.chain.get_abi(session.actor).catch(err => {
                console.error(err);
                return null;
            });

            if(abi){
                return applyContract(abi.abi);
            }
        }

    }

}
