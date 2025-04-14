<script lang="ts">
    import {
        sidebarWidth,
        project,
        openFile,
        editor,
        consoleOpen
    } from "../stores";
    import {tick} from "svelte";
    import ApiService from "../services/Api.service";
    import {theme, THEMES} from "../theme";

    const downloadProject = async () => {
        consoleOpen.set(true);
        ApiService.downloadProject($project);
    }

    const changeTheme = () => {
        theme.set($theme === THEMES.VSCODE_LIGHT ? THEMES.VSCODE_DARK : THEMES.VSCODE_LIGHT);
        localStorage.setItem('theme', $theme);
    }
</script>

<aside class="flex flex-col bg-sidebarBg text-fontColor cursor-default" style="min-width:{$sidebarWidth}px">
    <section class="flex flex-col flex-1">
        <figure class="text-xs font-medium opacity-30 p-5 pb-1">SETTINGS</figure>
        <section class="flex-none p-5 pt-0">

            <figure on:click={downloadProject} class="cursor-pointer mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center
                  hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
                  active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-download mr-3"></i> DOWNLOAD FILES</figure>


            <figure on:click={changeTheme}>
                {#if $theme === THEMES.VSCODE_LIGHT}
                    <figure class="cursor-pointer mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center
                          hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
                          active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-moon mr-3"></i> CHANGE TO DARK</figure>
                {:else}
                    <figure class="cursor-pointer mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center
                          hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor
                          active:border-fontColor active:text-fontColorInverted"><i class="fa-solid fa-sun mr-3"></i> CHANGE TO LIGHT</figure>
                {/if}
            </figure>


<!--            <figure on:click={() => {}} class="cursor-pointer mt-2 select-none rounded text-xs border-2 border-fontColor flex justify-start px-3 py-2 items-center-->
<!--                  hover:border-fontHighlight hover:text-fontHighlight active:bg-fontColor-->
<!--                  active:border-fontColor active:text-fontColorInverted"><i class="fa-brands fa-github mr-3"></i> CREATE PROJECT FROM REPO</figure>-->

            <!-- removal of this will break license -->
            <a href="https://vaulta.com" target="_blank" rel="noopener">
                <figure class="mt-5 text-xs opacity-50">Made with <i class="fa-solid fa-heart text-red-500"></i> by <b class="text-blue-500">Vaulta Foundation</b></figure>
            </a>
        </section>


    </section>
</aside>
