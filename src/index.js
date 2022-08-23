const files = {} /* {
    banana: 'I am a fruit.\nAnd I have to live with it :(',
    car: 'I am an engineer marvel.\nEveryone likes me and that leaves happy',
    james: 'I wanna cry!\nI have been working on this project for weeks now',
    crazyFile: 'Say something. I am a crazy file akkakakkakakakk',
    anotherFile: 'turururururururrururr'
}*/


function fakeHandleAction(state, action) {

    if (!action.type) return Object.assign(state, action)
    switch (action.type) {
        case 'update': {
            let { selectedFile, fileContent } = state
            if (!action.files.some(f => f === selectedFile)) {
                selectedFile = action.files[0]
                fileContent = selectedFile ? files[selectedFile] : '' 
            }


            return Object.assign(state, { selectedFile, files: action.files })
        }
        case 'delete':
            delete files[state.selectedFile]
            break;
        case 'save': {
            console.log('saving.')
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
            onclick: () => {
                dispatch({ selectedFile: file, fileContent: files[file] })
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

    handleSwitchFile(newFile) {
        if (this.selFile)
            this.fileComps[this.selFile].classList.remove('selected')
        this.fileComps[newFile].classList.add('selected')
        //this.selFile = newFile
    }

    renderFiles(files, state) {
        this.dom.textContent = ''

        let fileList = files.map(
            file => {
                let comp = renderFile(file, this.dispatch, state)
                this.fileComps[file] = comp
                return comp
            }
        )
        if (!fileList.length)
            fileList.push(elt('strong',
                { style: `color: white` },
                'no files'
            ))

        this.dom.append(...fileList)
        this.files = files
    }

    syncState(state) {
        let { selectedFile, files } = state

        //console.log({selectedFile, old: this.selFile, files: this.files})
        if (this.files != files)
            this.renderFiles(files, state)
        else if (this.selFile != selectedFile)
            this.handleSwitchFile(selectedFile)

        this.selFile = selectedFile
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

    syncState({ selectedFile, fileContent }) {
        if (this.selectedFile === selectedFile) return

        // think about this later
        if (selectedFile) {
            if (!this.selectedFile) this.dom.disabled = false;
            this.dom.value = fileContent
            this.dom.scrollTop = 0 // detail
            this.selectedFile = selectedFile
        } else {
            this.dom.value = 'no file selected'
            this.dom.disabled = true
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
        this.selectedFile = selectedFile
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


class Button {

    syncState({ selectedFile }) {
        let active = selectedFile != undefined
        if (this.active === active) return

        if (!active) this.dom.disabled = true
        else if (!this.active) this.dom.disabled = false

        this.active = active
    }

}

// think about this later
class Delete extends Button {
    constructor(dispatch) {
        super()
        this.dom = elt(
            'button',
            {
                className: 'edit-button',
                onclick: () => dispatch({ type: 'delete' })
            },
            'delete'

        )
    }
}

class Save extends Button {
    constructor(dispatch) {
        super()
        this.dom = elt(
            'button',
            {
                className: 'edit-button',
                onclick: () => dispatch({ type: 'save' })
            },
            'save'
        )
    }
}

// problems
function renderNewFileButton(dispatch) {
    let dom = elt(
        'button',
        {
            id: 'new-btn',// no need by now :)
            onclick: () => {
                let file_name = prompt('fileName: ', '')
                if (file_name) {
                    // decide what to do later
                    files[file_name] = ''
                    dispatch({ /*type: 'newfile',*/ selectedFile: file_name, fileContent: 'your text here' })
                } else
                    alert('invalid name')

            }
        },
        'new file'
    )

    return dom
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
            editor.dom,
            renderNewFileButton(dispatch),
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
                update_state({ /*type: 'update',*/ files: serverFiles })
        }
    }, 500)
}

function runApp() {
    let state = {}, app;
    function update(action) {
        state = fakeHandleAction(state, action)
        app.syncState(state)
    }
    app = new MargApp(update)
    // pollDir(() => state, update)
    setInterval(async () => {
        let localFiles = state.files
        let serverFiles = await getFiles()
        if (!localFiles) {
            let selectedFile = serverFiles[0]
            update({
                files: serverFiles,
                fileContent: files[selectedFile],
                selectedFile
            }) // What if no file found?
        } else {
            if (JSON.stringify(localFiles) != JSON.stringify(serverFiles))
                update({ type: 'update', files: serverFiles })
        }
    }, 500)
    document.body.appendChild(app.dom)

}

runApp()