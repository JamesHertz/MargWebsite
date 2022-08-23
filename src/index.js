function assign(state, action) {
    return Object.assign({}, { ...state, ...action })
}

function handleAction(state, action) {
    if (!action.type) return assign(state, action)
    switch (action.type) {
        case 'delete':
            // where this thing should have been
            fetchOK(`/${state.selectedFile}`, { method: 'DELETE' })
            break;
        case 'save': {
            let { selectedFile, fileContent } = state
            fetchOK(`/${selectedFile}`, {
                body: fileContent, method: 'PUT'
            }).catch(console.log)
        }
            break;
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
                getFile(file).then(
                    fileContent =>
                        dispatch({ selectedFile: file, fileContent: fileContent })
                )
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
                let filename = prompt('fileName: ', '')
                if (filename) {
                    // decide what to do later
                    fetchOK(`/${filename}`, { method: 'PUT' }).catch(console.log)
                    getFiles().then(files =>
                        dispatch({ files, selectedFile: filename, fileContent: 'your text here' })
                    )
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
        if (this.state === state) return;
        for (let c of this.components)
            c.syncState(state)
        this.state = state
    }
}

// a generic one later
async function getFiles(filename = '') {
    let req = await fetchOK('/')
    return (await req.text()).split('\n')
}

async function getFile(filename) {
    let req = await fetchOK(`/${filename}`)
    return await req.text()
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
            let selectedFile = serverFiles[0] || ''
            update({
                files: serverFiles,
                fileContent: await getFile(selectedFile),
                selectedFile
            }) // What if no file found?
        } else {
            // change this later
            if (JSON.stringify(localFiles) != JSON.stringify(serverFiles)) {
                let { selectedFile } = state
                let action = { files: serverFiles }
                // if selected file disappeared do what is necessary
                if (!serverFiles.some(f => f === selectedFile)) {
                    action.selectedFile = serverFiles[0]
                    action.fileContent = await getFile(serverFiles[0])
                }
                update(action)
            }
        }
    }, 500)
    document.body.appendChild(app.dom)

}

runApp()