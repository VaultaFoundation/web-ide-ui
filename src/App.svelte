<script lang="ts">
  import { onMount } from 'svelte';
  import TailwindCss from './TailwindCSS.svelte';
  import Logo from './components/Logo.svelte';
  import Editor from './components/Editor.svelte';
  import Navbar from './components/Navbar.svelte';
  import {
    openFile,
    closeFile,
    project,
    closeContextMenu,
    consoleOpen
  } from './stores';
  import {sidebarState, SIDEBAR_STATES} from "./sidebar";
  import ApiService from "./services/Api.service";
  import Project from "./models/Project.model";
  import {starterProject} from "./data/starterProject";
  import ContextMenu from "./components/ContextMenu.svelte";
  import Console from "./components/Console.svelte";
  import DialogBox from "./components/DialogBox.svelte";
  import SidebarDeployAndInteract from "./components/SidebarDeployAndInteract.svelte";
  import SideMenuBar from "./components/SideMenuBar.svelte";
  import SidebarExplorer from "./components/SidebarExplorer.svelte";
  import SidebarSearch from "./components/SidebarSearch.svelte";
  import SidebarSettings from "./components/SidebarSettings.svelte";
  import {getIcon} from "./utils/icons";
  import {theme} from "./theme";
  import UserPopup from "./components/UserPopup.svelte";
  import {showUserPopup} from "./stores/stores";

  onMount(async () => {
    await ApiService.setup();
    if(window.location.search.includes('id=')){
      await ApiService.getFiles();
    } else {
      project.set(new Project("","Untitled Project", starterProject, starterProject[0].id, [starterProject[0].id, starterProject[1].id]));
    }
  });

  $: selectedFile = $project ? $project.files.find(x => x.id === $project.selectedFile) : null;

  const idToProjectFileName = (id:string) => {
    const projectFile = $project.files.find(x => x.id === id);
    if(!projectFile) return id;
    return projectFile.name;
  }

  const closeFileOnMiddleClick = (e:MouseEvent, id:string) => {
    if(e.button === 1) closeFile(id);
  }



</script>

<TailwindCss />

{#if $project}
<main on:click={closeContextMenu} data-theme="{$theme}" class="flex flex-col h-screen overflow-x-hidden overflow-y-hidden">
  <Navbar />
  <DialogBox />
  <ContextMenu />
  {#if $showUserPopup}
    <UserPopup />
  {/if}

  <!-- PAGE -->
  <section id="page" class="flex" style="height:calc(100% - 48px)">

    <SideMenuBar />

    <!-- SIDEBAR: EXPLORER -->
    {#if $sidebarState === SIDEBAR_STATES.EXPLORER}
      <SidebarExplorer />
    {/if}
    {#if $sidebarState === SIDEBAR_STATES.SEARCH}
      <SidebarSearch />
    {/if}
    {#if $sidebarState === SIDEBAR_STATES.DEPLOY}
      <SidebarDeployAndInteract />
    {/if}
    {#if $sidebarState === SIDEBAR_STATES.SETTINGS}
      <SidebarSettings />
    {/if}

    <!-- MAIN EDITOR -->
    <aside class="relative flex flex-col bg-codeBg h-full w-full">

      <!-- FILE BAR -->
      <section class="flex bg-fileBarBg w-full h-10">
        {#each $project.openFiles as id}
          {#if id === $project.selectedFile}
            <figure on:auxclick={e => closeFileOnMiddleClick(e, id)} class="cursor-default flex items-center justify-center h-full px-4 space-x-1 file text-xs text-fontColor bg-fileBarSelected">
              <i class="mr-1.5 fa-solid {getIcon(idToProjectFileName(id))}"></i> {idToProjectFileName(id)}
              {#if $project.openFiles.length > 1}<div on:click={closeFile(id)} class="cursor-pointer p-1 pr-0 pl-1 relative hover:text-fontHighlight"><i class="fa-solid fa-xmark"></i></div>{/if}
            </figure>
          {:else}
            <figure on:auxclick={e => closeFileOnMiddleClick(e, id)} on:click={openFile(id)} class="file-bar-item cursor-pointer flex items-center justify-center
            h-full px-4 space-x-1 file text-xs text-fontColor bg-fileBarUnselected opacity-50 hover:bg-codeBg hover:opacity-100">
              <i class="mr-1.5 fa-solid {getIcon(idToProjectFileName(id))}"></i> {idToProjectFileName(id)}
            </figure>
          {/if}
        {/each}

      </section>

      <!-- EDITOR CONTAINER -->
      <section class="relative bg-codeBg h-full w-full overflow-hidden">
        <!-- FLOATING LOGO -->
        <figure id="code-logo" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-100">
          <Logo />
        </figure>

        <!-- EDITOR -->
        <section id="code" class="relative w-full h-full">
          {#if $project}
            {#key $project.selectedFile || 0}
              <Editor />
            {/key}
          {/if}
        </section>
      </section>

      <!-- CONSOLE -->
      <Console />
    </aside>
  </section>
</main>
{/if}

<style lang="scss">
  #code-logo {
    width:600px;
    opacity:0.04;
    z-index:2;
    pointer-events: none;
  }

  pre {
    line-height: 1.3rem;
  }
</style>
