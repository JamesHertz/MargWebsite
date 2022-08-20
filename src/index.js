const files = {
    banana: 'I am a fruit',
    car: 'I am an engineer marvel',
    james: 'I wanna cry',
    crazyFile: 'Say something',
    anotherFile: 'turururu'
}


function fakeHandleAction(state, action) {

    if (!action.type) return Object.assign(state, action)
    switch (action.type) {
        case 'delete': {
            delete files[state.selectedFile]
       }
        case 'save': {
            let { selectedFile, fileContent } = state
            files[selectedFile] = fileContent
        }
        break;
   }


    return state
}

function handleAction(state, action) {
    if (!action.type) return Object.assign(state, action)
    switch (action.type) {
        case 'delete': {
            let { selectedFile, files } = state
            files = files.filter(file => file != selectedFile)
            fetchOK(`/${selectedFile}`, { method: 'DELETE' }).catch(console.log)
            return Object.assign(state, { selectedFile: files[0], files })
        }
        case 'save': {
            let { selectedFile, fileContent } = state
            fetchOK(`/${selectedFile}`, {
                body: fileContent, method: 'PUT'
            }).catch(console.log)
        }
            break;
        /*
        case 'update':{
            let {selectedFile} = state
            if(!action.files.some(f => f== selectedFile))
                selectedFile = action.files[0]
            return Object.assign(state, {files: action.files, selectedFile}) 
        }*/
    }
    return state
}

function fetchOK(url, options) {
    return fetch(url, options).then(response => {
        if (response.status < 400) return response;
        else throw new Error(response.statusText);
    });
}

function elt(type, props, ...children) {
    let dom = document.createElement(type);
    if (props) Object.assign(dom, props);
    for (let child of children) {
        if (typeof child != "string") dom.appendChild(child);
        else dom.appendChild(document.createTextNode(child));
    }
    return dom;
}

// by now
// some problems. change this later
function renderFile(file, dispatch, { selectedFile }) {
    return elt('div',
        {
            className: `file${(selectedFile == file ? ' selected' : '')}`,
            onclick: () =>{
                dispatch({ selectedFile: file, fileContent: files[file]})
            }
        }, file
    )
}

class FilePane {

    // by now
    constructor(dispatch) {
        this.dispatch = dispatch
        this.dom = elt('div', { id: 'file-pane' })
        this.fileComps = Object.create(null)
    }

    syncState(state) {
        let { selectedFile, files } = state
        if (this.files != files) {
            this.dom.textContent = ''
            this.dom.append(...files.map(
                file => {
                    let comp = renderFile(file, this.dispatch, state)
                    this.fileComps[file] = comp
                    return comp
                }
            ))
            this.files = files
        } else if (this.selectedFile != selectedFile) {
            if (this.selectedFile)
                this.fileComps[this.selectedFile].classList.remove('selected')
            this.fileComps[selectedFile].classList.add('selected')
            this.selectedFile = selectedFile
        }
    }

}

class Editor {

    constructor(dispatch) {
        let dom = elt('textarea', { id: 'editor' })
        dom.addEventListener('change', () => {
            dispatch({ fileContent: dom.value })
        })
        this.dom = dom
        this.dispatch = dispatch
        this.selectedFile = ''
    }

    syncState({ selectedFile, fileContent}) {
        if (!selectedFile || this.selectedFile === selectedFile) return

        if(selectedFile){
            this.dom.value = fileContent
            this.dom.scrollTop = 0 // detail
            this.selectedFile = selectedFile
        }
        /*
        fetchOK(`/${selectedFile}`).then(
            async res => {
                let fileContent = await res.text()
                this.dom.value = fileContent
                this.dom.scrollTop = 0 // detail
                this.selectedFile = selectedFile
                this.dispatch({ fileContent })
            }
        ).catch(console.log)
        */
    }
}


class InfoPane {
    constructor() {
        this.dom = elt('em')
        //this.dom = elt('div', { id: 'editor-info' }, this.file)
    }

    syncState(state) {
        this.dom.textContent = state.selectedFile
    }
}
class Delete {
    constructor(dispatch) {
        this.dom = elt(
            'button',
            {
                className: 'edit-button',
                onclick: () => dispatch({ type: 'delete' })
            },
            'delete'

        )
    }
    syncState() { }

}

class Save {
    constructor(dispatch) {
        this.dom = elt(
            'button',
            {
                className: 'edit-button',
                onclick: () => dispatch({ type: 'save' })
            },
            'save'
        )
    }
    syncState() { }

}

class MargApp {
    constructor(dispatch) {
        let filePane = new FilePane(dispatch)
        let editor = new Editor(dispatch)
        let editTools = [InfoPane, Save, Delete]

        this.components = [filePane, editor]

        this.dom = elt(
            'div', { id: 'main-pane' },
            filePane.dom,
            elt('div', { id: 'editor-pane' },
                editor.dom,
                elt('div',
                    { id: 'edit-tools' },
                    ...editTools.map(
                        builder => {
                            let tool = new builder(dispatch)
                            this.components.push(tool)
                            return tool.dom
                        }
                    )

                )
            )
        )
    }

    syncState(state) {
        for (let c of this.components)
            c.syncState(state)
    }
}

async function getFiles() {
    return Object.keys(files)
}


// change this later
async function pollDir(get_state, update_state) {
    setInterval(async () => {
        let localFiles = get_state().files
        let serverFiles = await getFiles()
        if (!localFiles) {
            update_state({ files: serverFiles, selectedFile: serverFiles[0] })
        } else {
            if (JSON.stringify(localFiles) != JSON.stringify(serverFiles))
                update_state({ /*type:'update',*/ files: serverFiles })
        }
    }, 500)
}

function runApp() {
    let state = {}, app;
    function update(action) {
        state = handleAction(state, action)
        app.syncState(state)
    }
    app = new MargApp(update)
    // pollDir(() => state, update)
    setInterval(async () => {
        let localFiles = state.files
        let serverFiles = await getFiles()
        if (!localFiles) {
            update({ files: serverFiles, selectedFile: serverFiles[0] })
        } else {
            if (JSON.stringify(localFiles) != JSON.stringify(serverFiles))
                update({ /*type:'update',*/ files: serverFiles })
        }
    }, 500)
    document.body.appendChild(app.dom)

}

runApp()