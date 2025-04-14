<script lang="ts">
    import {sidebarState, SIDEBAR_STATES} from "../sidebar";

    const updateSidebarState = (state: number) => {
        if($sidebarState === state) {
            sidebarState.set(SIDEBAR_STATES.NONE);
            return;
        }

        sidebarState.set(state);
    }
</script>

<aside class="w-12 bg-sidebarBg border-r-2 border-sideMenuBarBorder">
    <!-- square button with icon inside -->
    <div on:click={() => updateSidebarState(SIDEBAR_STATES.EXPLORER)} class="flex flex-col cursor-pointer items-center justify-center h-12 w-12 active:bg-codeBg hover:bg-fileBarUnselected">
        <i class="fa-solid fa-file text-fontColor"></i>
    </div>

    <div on:click={() => updateSidebarState(SIDEBAR_STATES.SEARCH)} class="flex flex-col cursor-pointer items-center justify-center h-12 w-12 active:bg-codeBg hover:bg-fileBarUnselected">
        <i class="fa-solid fa-search text-fontColor"></i>
    </div>

    <div on:click={() => updateSidebarState(SIDEBAR_STATES.DEPLOY)} class="flex flex-col cursor-pointer items-center justify-center h-12 w-12 active:bg-codeBg hover:bg-fileBarUnselected">
        <i class="fa-solid fa-globe text-fontColor"></i>
    </div>

    <div on:click={() => updateSidebarState(SIDEBAR_STATES.SETTINGS)} class="flex flex-col cursor-pointer items-center justify-center h-12 w-12 active:bg-codeBg hover:bg-fileBarUnselected">
        <i class="fa-solid fa-cog text-fontColor"></i>
    </div>

</aside>
