<script lang="ts">
    import {
        sidebarWidth,
        deploying,
        project,
        consoleOpen,
        availableInteractions,
        availableTables,
        senderAccount,
        contractDeployedTo,
        building, selectedNetwork,
        selectedContract,
    } from "../stores";
    import InteractableAction from "./InteractableAction.svelte";
    import InteractableTable from "./InteractableTable.svelte";
    import ApiService from "../services/Api.service";
    import WalletService from "../services/Wallet.service";
    import {onMount} from "svelte";


    const jungleTestAccounts = [
        "testaccounta",
        "testaccountb",
        "testaccountc",
        "testaccountd",
        "testaccounte",
    ];
    let testAccounts = jungleTestAccounts;
    let tempSenderAccount = testAccounts[0];
    senderAccount.set(tempSenderAccount);


    let _selectedNetwork = $selectedNetwork;
    let connectedWallet = null;
    $: isOnMainnet = _selectedNetwork === 'Use Wallet';
    const onChangeNetwork = (e) => {
        selectedNetwork.set(_selectedNetwork);
        contractDeployedTo.set(null);
        availableInteractions.set([]);
        availableTables.set([]);

        if(isOnMainnet){
            WalletService.restoreSession().then(restored => {
                if(restored){
                    connectWallet();
                }
            })
            testAccounts = [];
        } else {
            testAccounts = jungleTestAccounts;
        }
    }
    const deployContract = (build:boolean) => {
        if(isOnMainnet) return deployToMainnet();
        if($deploying) return;
        if($building) return;
        deploying.set(true);
        consoleOpen.set(true);
        ApiService.deploy($project, $selectedContract, build);
    }

    const deployToMainnet = async () => {
        if($deploying) return;
        if($building) return;
        deploying.set(true);
        consoleOpen.set(true);
        const fileLocations = await ApiService.build($project, true);

        deploying.set(false);

        const abi = await fetch(fileLocations.abi).then(res => res.json());
        const wasm = await fetch(fileLocations.wasm).then(res => res.arrayBuffer());

        const deployed = await WalletService.deployContract(wasm, abi);

    }

    let addingCodePermission = false;
    const addCodePermission = async () => {
        try {
            if(addingCodePermission) return;
            addingCodePermission = true;
            consoleOpen.set(true);

            const added = await WalletService.addCodePermissions();

        } catch (e) {
            console.error(e);
        } finally {
            addingCodePermission = false;
        }
    }

    let copiedSender = false;
    const copySenderAccount = () => {
        copiedSender = true;
        setTimeout(() => copiedSender = false, 1000);
        navigator.clipboard.writeText($senderAccount);
    }

    let copiedContract = false;
    const copyContractAccount = () => {
        copiedContract = true;
        setTimeout(() => copiedContract = false, 1000);
        navigator.clipboard.writeText($contractDeployedTo);
    }

    const goToContractInExplorer = () => {
        window.open(`https://jungle4.unicove.com/account/${$contractDeployedTo}`, '_blank');
    }

    const connectWallet = async () => {

        if(await WalletService.login()) {
            connectedWallet = WalletService.getConnectedAccount();
            testAccounts = [connectedWallet];
            await WalletService.checkIfContractDeployed();
        }
    }

    const logout = async () => {
        await WalletService.logout();
        connectedWallet = null;
        contractDeployedTo.set(null);
        availableInteractions.set([]);
        availableTables.set([]);
    }

    $: hasMultipleCppFiles = $project.files.filter(file => file.name.endsWith('.cpp')).length > 1;
    $: deployableContracts = $project.files.filter(file => {
        if(!hasMultipleCppFiles) return file.name.endsWith('.cpp');
        return file.name.endsWith('entry.cpp');
    })
    const onChangeContract = (e) => {
        selectedContract.set(e.target.value);
    }

    onMount(() => {
        if(deployableContracts.length) selectedContract.set(deployableContracts[0].name);
    });
</script>

<aside class="flex flex-col bg-sidebarBg text-fontColor cursor-default" style="min-width:{$sidebarWidth}px">
    <section class="flex flex-col flex-1 overflow-y-auto">
        <figure class="text-xs font-medium opacity-30 p-5 pb-1">DEPLOY</figure>
        <section class="flex-none p-5 pt-0">
            <section class="pt-4">
                <figure class="tiny-label text-fontColor">ENVIRONMENT</figure>
                <select bind:value={_selectedNetwork} on:change={onChangeNetwork} class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1">
                    <option>Jungle</option>
                    <option>Devnet</option>
                    <option>Use Wallet</option>
                </select>

                <!--            <figure class="tiny-label text-fontColor mt-4">CONTRACT ACCOUNT</figure>-->
                <!--            <input class="text-xs cursor-not-allowed opacity-40 rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1" disabled value={"acc"} />-->

                {#if isOnMainnet && !connectedWallet}
                    <figure on:click={connectWallet} class="mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center
                    cursor-pointer
                      hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
                      active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-wallet mr-3"></i> CONNECT WALLET</figure>
                {/if}
                {#if isOnMainnet && connectedWallet}
                    <figure on:click={logout} class="mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center
                    cursor-pointer
                      hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
                      active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-wallet mr-3"></i> LOG OUT OF {connectedWallet}</figure>
                {/if}



                {#if deployableContracts.length > 1}
                    <figure class="tiny-label text-fontColor mt-4">SELECT CONTRACT TO DEPLOY</figure>
                    <select bind:value={$selectedContract} on:change={onChangeContract} class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1">
                        {#each deployableContracts as contract}
                            <option value={contract.name}>{contract.name}</option>
                        {/each}
                    </select>
                {/if}

                {#if !isOnMainnet || (isOnMainnet && connectedWallet)}
                    <figure on:click={() => deployContract(true)} class="mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center
                    {!$deploying && !$building ? 'cursor-pointer' : ''}
                    {$deploying || $building ? 'opacity-30' : ''} {$deploying || $building ? 'opacity-30 cursor-not-allowed animate-pulse text-fontHighlight border-fontHighlight' : ''}
                      hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
                      active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-tools mr-1"></i> <i class="fa-solid fa-rocket-launch mr-3"></i> BUILD & DEPLOY</figure>
                {/if}

                {#if isOnMainnet && connectedWallet}
                    <figure on:click={addCodePermission} class="mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center
                    {!addingCodePermission ? 'cursor-pointer' : ''}
                    {addingCodePermission ? 'opacity-30' : ''} {addingCodePermission ? 'opacity-30 cursor-not-allowed animate-pulse text-fontHighlight border-fontHighlight' : ''}
                      hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
                      active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-code mr-3"></i> ADD CODE PERMISSION</figure>
                {/if}

<!--                <figure on:click={() => deployContract(false)} class="mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center-->
<!--                {!$deploying && !$building ? 'cursor-pointer' : ''}-->
<!--                {$deploying || $building ? 'opacity-30' : ''} {$deploying || $building ? 'opacity-30 cursor-not-allowed animate-pulse text-fontHighlight border-fontHighlight' : ''}-->
<!--                  hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor-->
<!--                  active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-rocket-launch mr-3"></i> DEPLOY</figure>-->

                {#if $contractDeployedTo}
                    <figure class="tiny-label text-fontHighlight mt-5">The account the contract is deployed to</figure>
                    <section class="flex">
                        <figure class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1">{$contractDeployedTo}</figure>
                        <figure on:click={goToContractInExplorer} class="text-xs rounded bg-inputBg border-fontColor border py-1 px-2 mt-1 hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor active:border-fontColor active:text-fontColorInverted cursor-pointer ml-1">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </figure>
                        <figure on:click={copyContractAccount} class="text-xs rounded bg-inputBg border-fontColor border py-1 px-2 mt-1 hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor active:border-fontColor active:text-fontColorInverted cursor-pointer ml-1">
                            <i class="fa-solid {copiedContract ? 'fa-check' : 'fa-copy'}"></i>
                        </figure>
                    </section>
                {/if}

            </section>
        </section>

        {#if !isOnMainnet}
            <section class="flex-none">
                <figure class="h-px bg-fileBarUnselected my-2"></figure>

                <section class="p-5 pb-2 pt-0 mt-3">
                    {#if $availableInteractions.length > 0}
                        <figure class="tiny-label text-fontHighlight">Select account to send transactions with</figure>
                        <section class="flex">
                            <select bind:value={tempSenderAccount} on:change={() => senderAccount.set(tempSenderAccount)} class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1">
                                {#each testAccounts.concat([$contractDeployedTo]) as account}
                                    <option value={account}>{account}</option>
                                {/each}
                            </select>
                            <figure on:click={copySenderAccount} class="text-xs rounded bg-inputBg border-fontColor border py-1 px-2 mt-1 hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor active:border-fontColor active:text-fontColorInverted cursor-pointer ml-1">
                                <i class="fa-solid {copiedSender ? 'fa-check' : 'fa-copy'}"></i>
                            </figure>
                        </section>
                    {/if}
                </section>
            </section>
        {/if}

        <section class="flex-auto">
            <figure class="h-px bg-fileBarUnselected my-2"></figure>

            <figure class="text-xs font-medium opacity-30 p-5 pt-3 pb-1">INTERACT WITH CONTRACT</figure>

            <section class="p-5 pt-0 mt-3">
                {#if $availableInteractions.length === 0}
                    <figure class="text-xs text-center opacity-40">No actions available</figure>
                {:else}
                    {#each $availableInteractions as action}
                        <InteractableAction action={action} />
                        <!-- IF NOT LAST ELEMENT -->
                        {#if $availableInteractions.length !== $availableInteractions.indexOf(action) + 1}
                            <figure class="h-px bg-fileBarUnselected mb-5"></figure>
                        {/if}
                    {/each}
                {/if}
            </section>

            <figure class="h-px bg-fileBarUnselected my-2"></figure>
            <figure class="text-xs font-medium opacity-30 p-5 pt-3 pb-1">TABLES</figure>
            <section class="p-5 pt-0 mt-3">
                {#if $availableTables.length === 0}
                    <figure class="text-xs text-center opacity-40">No tables available</figure>
                {:else}
                    {#each $availableTables as table}
                        {#key table}
                            <InteractableTable {table} />
                        {/key}
                    {/each}
                {/if}
            </section>
        </section>
    </section>
</aside>
