<script lang="ts">
  import { Tooltip } from 'flowbite-svelte';
  import Logo from './Logo.svelte';
  import {project, saving, building} from "../stores";
  import ApiService from "../services/Api.service";
  import {showUserPopup} from "../stores/stores";

  let editingName:boolean = false;
  let tempProjectName:string;

  project.subscribe(p => tempProjectName = p.name);

  const selectNameChanger = () => {
    editingName = true;
    setTimeout(() => {
      document.getElementById('projectName').focus();
    }, 0)
  }
  const changeName = () => {
    project.update(p => {
      p.name = tempProjectName;
      return p;
    })
    editingName = false;

    saving.set(true);
    ApiService.save($project);
  }

  const resetName = () => {
    editingName = false;
    tempProjectName = $project.name;
  }


</script>

<nav id="nav" class="flex-none bg-navBarBg h-12 w-full z-20">
  <!-- Three side by side flex columns -->
  <div class="flex flex-row h-full w-full">
    <!-- Left side -->
    <div class="flex flex-row h-full w-1/3 pl-5 items-center justify-start">
      <figure id="logo" class="fill-fontColorNavbar max-w-[36px] pl-2">
        <Logo />
      </figure>
    </div>
    <div class="cursor-default text-fontColorNavbar flex flex-row h-full w-full items-center justify-center">

      {#if editingName}
        <input id="projectName" class="bg-transparent outline-0 border-0 font-bold text-center max-w-[600px] w-full"
               bind:value="{tempProjectName}" on:blur={changeName} on:keyup={x => x.key === "Enter" ? changeName() : x.key === "Escape" ? resetName() : null} />
      {:else}
        <div>Vaulta IDE&nbsp;&nbsp;/&nbsp;&nbsp;</div>
        <b class="cursor-pointer truncate max-w-[250px]" on:click={selectNameChanger}>{$project.name}</b>
      {/if}
    </div>
    <div class="flex space-x-4 h-full w-1/3 pr-5 items-center justify-end">
      {#if $building}
        <figure class="cursor-pointer text-fontColorNavbar text-lg hover:scale-125"><i class="fa fa-solid text-blue-500 fa-hammer animate-pulse"></i></figure>
      {/if}
      {#if $saving}
        <figure class="cursor-pointer text-fontColorNavbar text-lg hover:scale-125"><i class="fa fa-solid text-blue-500 fa-save animate-pulse"></i></figure>
      {/if}
      <a id="info" href="https://docs.eosnetwork.com" target="_blank" class="cursor-pointer text-fontColorNavbar text-lg hover:scale-125"><i class="fa-solid fa-graduation-cap"></i></a>
<!--      <figure class="cursor-pointer text-fontColorNavbar text-lg hover:scale-125"><i class="fa-solid fa-arrow-down-to-line"></i></figure>-->
<!--      <figure class="cursor-pointer text-fontColorNavbar text-lg hover:scale-125"><i class="fa-sharp fa-solid fa-share"></i></figure>-->
      <!-- login -->
      <figure on:click={() => {showUserPopup.set(true)}} class="cursor-pointer text-fontColorNavbar text-lg hover:scale-125"><i class="fa-solid fa-user"></i></figure>
    </div>
  </div>
</nav>

<style lang="scss">
  #logo {
    width:70px;
    margin-left:-20px;
  }
</style>
