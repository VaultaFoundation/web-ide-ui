import {
    deploying,
    building,
    consoleText,
    project,
    saving,
    availableInteractions,
    availableTables,
    contractDeployedTo, senderAccount
} from "../stores";
import Project from "../models/Project.model";
import debounce from 'debounce';
import ConsoleService from "./Console.service";
import {starterProject} from "../data/starterProject";
import {saveNewProject} from "../utils/firebase";

const WS_URL:string = import.meta.env.VITE_API_WS_URL.replace(/\/$/, "");
const API_URL:string = import.meta.env.VITE_API_HTTP_URL.replace(/\/$/, "");

let socket:WebSocket;

const saveDebounce = debounce(() => {
    saving.set(false);
}, 1000);

const buildDebounce = debounce(() => {
    building.set(false);
}, 1000);

const deployDebounce = debounce(() => {
    deploying.set(false);
}, 1000);

let lastZip = null;
let lastWasm = null;
let lastAbi = null;

let buildResolver = null;

export default class ApiService {

    static setup(){
        return new Promise((resolve, reject) => {
            socket = new WebSocket(WS_URL);

            socket.addEventListener('open', () => {
                resolve(true);
            });

            socket.addEventListener('message', (event) => {

                let json;
                try {
                    json = JSON.parse(event.data);
                } catch (error) {
                    return console.error('Error parsing message:', error);
                }

                if(json.type === "build-status"){
                    lastZip = null;
                    lastWasm = null;
                    lastAbi = null;

                    if(json.data.success){
                        ConsoleService.prepend(`Build completed successfully!`);
                        lastZip = `${API_URL}/v1/download/zip/${json.data.data}`;
                        lastWasm = `${API_URL}/v1/download/wasm/${json.data.data}`;
                        lastAbi = `${API_URL}/v1/download/abi/${json.data.data}`;
                        ConsoleService.prepend(`<a class="text-fontHighlight" style="text-decoration: underline;" href="${lastZip}">DOWNLOAD ZIP</a>`);

                        project.update((project) => {

                            const hasMultipleCppFiles = project.files.filter(file => file.name.endsWith('.cpp')).length > 1;
                            const deployableContracts = project.files.filter(file => {
                                if(!hasMultipleCppFiles) return file.name.endsWith('.cpp');
                                return file.name.endsWith('entry.cpp');
                            });

                            for(let contract of deployableContracts){
                                const contractName = contract.name.replace('.entry.cpp', '').replace('.cpp', '')
                                ConsoleService.prepend(`Contract: ${contract.name} | <a class="text-fontHighlight" style="text-decoration: underline;" href="${lastWasm}/${contractName}">DOWNLOAD WASM</a> | <a class="text-fontHighlight" style="text-decoration: underline;" href="${lastAbi}/${contractName}">DOWNLOAD ABI</a>`);
                            }


                            return project;
                        });

                        ConsoleService.prepend('');

                        if(buildResolver){
                            buildResolver({wasm:lastWasm, abi:lastAbi});
                            buildResolver = null;
                        }

                    } else {
                        ConsoleService.prepend(`Build failed!`);
                        ConsoleService.prepend(`Error: ${json.data.data}`);
                        ConsoleService.prepend('');
                    }

                    deployDebounce();
                    buildDebounce();
                    return;
                }

                if(json.type === "download-result"){
                    if(json.data.success){
                        ConsoleService.prepend(`Your project is ready to be downloaded. You have 60 seconds to grab it before it is deleted.`);
                        ConsoleService.prepend(`<a class="text-fontHighlight" style="text-decoration: underline;" href="${API_URL}/v1/download/project/${json.data.data}">DOWNLOAD PROJECT</a>`);
                        ConsoleService.prepend('');
                    } else {
                        ConsoleService.prepend(`Project download failed!`);
                        ConsoleService.prepend(`Error: ${json.data.data}`);
                        ConsoleService.prepend('');
                    }

                    buildDebounce();
                    return;
                }

                if(json.type === "deploy-status"){
                    if(json.data.success){
                        contractDeployedTo.set(json.data.data.account);
                        ConsoleService.prepend(`Deployed successfully!`);
                        availableInteractions.set(json.data.data.actions);
                        availableTables.set(json.data.data.tables);
                        ConsoleService.prepend('');
                    } else {
                        ConsoleService.prepend(`Deploy failed!`);
                        ConsoleService.prepend(`Error: ${JSON.stringify(json.data.data)}`);
                        ConsoleService.prepend('');
                    }

                    deployDebounce();
                    buildDebounce();
                    return;
                }

                if(json.type === "table-result"){
                    if(json.data.success){
                        ConsoleService.prepend(JSON.stringify(json.data.data, null, 4));
                        ConsoleService.prepend('');
                    } else {
                        ConsoleService.prepend(`Table result failed!`);
                        ConsoleService.prepend(`Error: ${JSON.stringify(json.data.data)}`);
                        ConsoleService.prepend('');
                    }
                    return;
                }

                if(json.type === "interaction-status"){
                    if(json.data.success){
                        ConsoleService.prepend(`Interaction success!`);
                        ConsoleService.prepend(`<details><summary>Transaction: <a class="text-fontHighlight" style="color:text-decoration: underline;" href="https://jungle4.unicove.com/transaction/${json.data.data.response.transaction_id}" target="_blank">See transaction on explorer</a></summary><pre>${JSON.stringify(json.data.data, null, 4)}</pre></details>`);
                        ConsoleService.prepend('');
                    } else {
                        ConsoleService.prepend(`Interaction failed!`);
                        ConsoleService.prepend(`Error: ${JSON.stringify(json.data.data)}`);
                        ConsoleService.prepend('');
                    }

                    deployDebounce();
                    return;
                }

                if(json.type === "saved"){
                    project.update((project) => {

                        if(project.id != json.data) {
                            project.id = json.data;
                        }

                        setTimeout(async () => {
                            await saveNewProject(project.id, project.name);
                        }, 1);

                        return project;
                    });
                    const queryUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?id=${json.data}`;
                    window.history.pushState({path:queryUrl},'',queryUrl);



                    saveDebounce();
                    return;
                }

                if(json.type === "loaded"){
                    try {
                        const loadedProject = JSON.parse(json.data);
                        project.set(new Project(loadedProject.id, loadedProject.name, loadedProject.files, loadedProject.selectedFile, loadedProject.openFiles, loadedProject.createdAt));
                    } catch (error) {
                        console.error('Error parsing loaded project:', error);
                    }

                    return;
                }

                if(json.type === "no-project"){
                    try {
                        const queryUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
                        window.history.pushState({path:queryUrl},'',queryUrl);
                        project.set(new Project("","Untitled Project", starterProject, starterProject[0].id, [starterProject[0].id, starterProject[1].id]));
                    } catch (error) {
                        console.error('Error parsing loaded project:', error);
                    }

                    return;
                }
            });

            socket.addEventListener('close', () => {
                console.log('WebSocket connection closed');
                setTimeout(() => {
                    ApiService.setup();
                }, 1000);
                reject(false);
            });

            socket.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });
        });
    }

    static getFiles(){
        return new Promise((resolve, reject) => {
            const id = new URLSearchParams(window.location.search).get('id');
            if(id) ApiService.sendMessage("load", id);
        });
    }

    static build(project:Project, useResolver = false){
        let promise = null;
        if(useResolver){
            promise = new Promise(r => {
                buildResolver = r;
            })
        }

        ConsoleService.prepend(`Building project "${project.name}"...`);
        building.set(true);
        ApiService.sendMessage('build', {id: project.id});
        setTimeout(() => buildDebounce(), 20000)

        if(promise) return promise;
    }

    static save(project:Project){
        ApiService.sendMessage('save', project);
        setTimeout(() => saveDebounce(), 5000);
    }

    static deploy(project:Project, contract:string, build:boolean = true){
        if(!build) ConsoleService.prepend(`Deploying contract to Jungle Testnet...`);
        else ConsoleService.prepend(`Building and deploying contract to Jungle Testnet...`);

        if(build) building.set(true);

        ApiService.sendMessage('deploy', {network:'jungle', id:project.id, contract, build});
        setTimeout(() => deployDebounce(), 20000);
        if(build) setTimeout(() => buildDebounce(), 20000);
    }

    static interact(network:string, contract:string, actionData:any){
        ConsoleService.prepend(`Interacting with your contract...`);
        let sender;
        senderAccount.update((account) => {
            sender = account;
            return account;
        });
        ApiService.sendMessage('interact', {network, contract, actionData, senderAccount:sender});
    }

    static getTableData(network:string, contract:string, table:string, scope:string){
        ApiService.sendMessage('table-data', {network, contract, table, scope});
    }

    static downloadProject(project:Project){
        ApiService.sendMessage('download-project', {id: project.id});
    }

    static sendMessage(type:string, data:any){
        socket.send(JSON.stringify({type, data}));
    }

}
