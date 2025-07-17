<script>
    import ApiService from "../services/Api.service";
    import WalletService from "../services/Wallet.service";
    import {consoleOpen, contractDeployedTo, selectedNetwork} from "../stores";

    export let action;

    $: isOnMainnet = $selectedNetwork === "Use Wallet";

    const interact = async () => {
        consoleOpen.set(true);

        const actionData = {
            action: action.name,
            params: action.params.reduce((acc, param) => {
                try {
                    acc[param.name] = JSON.parse(param.value);
                } catch(e){
                    acc[param.name] = param.value;
                }
                return acc;
            }, {})
        };

        if(isOnMainnet){
            return WalletService.transact(actionData.action, actionData.params);
        }

        ApiService.interact($selectedNetwork.toLowerCase(), $contractDeployedTo, actionData);
    }
</script>

<section class="flex items-center w-full justify-between">
    <figure class="text-sm text-fontColor underline">{action.name}</figure>
    <figure on:click={() => interact()} class="select-none cursor-pointer rounded text-xs border border-fontColor flex px-3 py-1 items-center
              hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
              active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-play mr-3"></i> RUN</figure>
</section>

{#each action.params as param}
    <input class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1" bind:value={param.value} placeholder="{param.type} {param.name}" />
{/each}
<!--<input class="text-xs rounded bg-inputBg border-inputBorder border py-1 px-2 w-full mt-1" placeholder="_name" />-->
