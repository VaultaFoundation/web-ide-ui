import {createEventDispatcher} from 'svelte';
import {writable} from 'svelte/store';
import type {Writable} from 'svelte/store';
import type Project from "./models/Project.model";
import ProjectFile from "./models/ProjectFile.model";
import ApiService from "./services/Api.service";

// PROJECT
export const project:Writable<Project> = writable(null);
export const saving:Writable<boolean> = writable(false);
export const building:Writable<boolean> = writable(false);
export const deploying:Writable<boolean> = writable(false);
export const senderAccount:Writable<string> = writable("testaccounta");
export const consoleOpen:Writable<boolean> = writable(false);
export const consoleText:Writable<string> = writable("");
export const contextMenu:Writable<{ x:number, y:number, file:ProjectFile } | null> = writable(null);
export const dialogBox:Writable<{ title:string, placeholder:string, callback:(value:string|null) => void, error:string|null } | null> = writable(null);
export const contractDeployedTo:Writable<string> = writable("");
export const availableInteractions:Writable<Array<{name:string, params:Array<{name:string, type:string}>}>> = writable([]);
export const availableTables:Writable<Array<{name:string}>> = writable([]);
export const editor:Writable<any> = writable(null);
export const selectedNetwork:Writable<string> = writable("Jungle");
export const selectedContract:Writable<string> = writable("");

// UI SETTINGS
export const sidebarWidth:Writable<number> = writable(300);

// FUNCTIONS
export const openFile = (id:string) => {
    project.update(_project => {
        if(!_project.openFiles.includes(id)) {
            _project.openFiles = [..._project.openFiles, id];
        }
        _project.selectedFile = id;
        return _project;
    });
}

export const closeFile = (id:string) => {
    project.update(_project => {
        if(_project.openFiles.length === 1) return _project;

        _project.openFiles = _project.openFiles.filter(x => x !== id);
        _project.selectedFile = _project.openFiles[0];

        return _project;
    });
}

export const contextMenuRightClick = (e:MouseEvent, file:ProjectFile) => {
    contextMenu.set({
        x: e.x,
        y: e.y,
        file
    });
    e.preventDefault();
    e.stopPropagation();
    return false;
}

export const closeContextMenu = (e:MouseEvent) => {
    if(e.target instanceof HTMLElement){
        if(e.target.closest('#context-menu')) return;
    }

    contextMenu.set(null);
}

export const createNewFile = () => {
    const file = getFileFromContextMenu();
    contextMenu.set(null);

    openDialog('Create a new file', 'Enter a filename', (value:string|null) => {
        if(!value) {
            dialogBox.set(null);
            return;
        }


        // if(!(/^[\w,\s-]+\.[A-Za-z0-9]{3}$/.test(value))){
        //     dialogBox.update(x => {
        //         x.error = 'Invalid filename';
        //         return x;
        //     });
        //     return;
        // }

        dialogBox.set(null);

        project.update(_project => {
            _project.files.push(new ProjectFile(value, file ? file.path : "", ''));
            ApiService.save(_project);
            return _project;
        });


    });
};

export const createNewFolder = () => {
    const file = getFileFromContextMenu();
    contextMenu.set(null);

    openDialog('Create a new file', 'Enter a filename', (value:string|null) => {
        if(!value) {
            dialogBox.set(null);
            return;
        }

        if(!(/^[a-zA-Z].*/.test(value))){
            dialogBox.update(x => {
                x.error = 'Invalid filename';
                return x;
            });
            return;
        }

        dialogBox.set(null);

        project.update(_project => {
            _project.files.push(new ProjectFile('.gitkeep', (file.path.length ? file.path+value+'/' : value+'/').replace(/([^:]\/)\/+/g, "$1"), ''));
            ApiService.save(_project);
            return _project;
        });
    });
}



export const renameFile = () => {
    const file = getFileFromContextMenu();
    contextMenu.set(null);

    openDialog('Rename file', 'Enter a new filename', (value:string|null) => {
        if(!value) {
            dialogBox.set(null);
            return;
        }

        dialogBox.set(null);

        project.update(_project => {
            _project.files = _project.files.map(x => {
                if(x.id === file.id) x.name = value;
                return x;
            });
            ApiService.save(_project);
            return _project;
        });
    });
}
export const deleteFile = () => {
    const file = getFileFromContextMenu();

    let lastFile = false;
    project.update(_project => {
        if(_project.openFiles.length === 1) lastFile = true;
        return _project;
    });
    if(lastFile) return;

    openDialog('Are you sure?', null, (value:string|null) => {
        dialogBox.set(null);
        if(!value) return;

        project.update(_project => {
            closeFile(file.id);
            _project.files = _project.files.filter(x => x.id !== file.id);

            if(file.path.length){
                // if last file remove folder (each folder has a .gitkeep)
                if(_project.files.filter(x => x.path.includes(file.path)).length === 1){
                    _project.files = _project.files.filter(x => !x.path.includes(file.path));
                }
            }

            ApiService.save(_project);
            return _project;
        });
    });

}


export const openDialog = (title:string, placeholder:string, callback:(value:string|null) => void) => {
    dialogBox.set({title, placeholder, callback, error:null});

    // highlight input if exists
    setTimeout(() => {
        const input = document.getElementById('dialog-input');
        if(input) input.focus();
    }, 10);
}


const getFileFromContextMenu = () => {
    let file;
    contextMenu.update(x => {
        file = x.file;
        return null;
    });

    return file;
};
