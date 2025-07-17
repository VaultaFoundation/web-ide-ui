<script>
    import ApiService from "../services/Api.service";
    import {consoleOpen, contractDeployedTo, selectedNetwork} from "../stores";
    import WalletService from "../services/Wallet.service";

    export let table;
    let scope = $contractDeployedTo;
    contractDeployedTo.subscribe(value => {
        scope = value;
    });

    $: isOnMainnet = $selectedNetwork === "Use Wallet";

    const get = async () => {
        consoleOpen.set(true);
        if(isOnMainnet){
            return WalletService.getTableRows(table.name, scope);
        }

        ApiService.getTableData($selectedNetwork.toLowerCase(), $contractDeployedTo, table.name, scope);
    }
</script>

<section class="flex items-center w-full justify-between">
    <figure class="text-sm text-fontColor underline">{table.name}</figure>
    <figure on:click={get} class="select-none cursor-pointer rounded text-xs border border-fontColor flex px-3 py-1 items-center
              hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
              active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-play mr-3"></i> GET</figure>
</section>

<input class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1 mb-5" bind:value={scope} placeholder="scope" />

<!--{#each action.params as param}-->
<!--    <input class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1 mb-5" bind:value={param.value} placeholder="{param.type} {param.name}" />-->
<!--{/each}-->
<!--<input class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1" placeholder="_name" />-->
