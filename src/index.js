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

function renderFile(file, dispatch) {
    return elt('div',
        {
            className: 'file',
            onclick: () =>
                dispatch({ selectedFile: file })
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

    syncState({ files, selectedFile }) {
        if (this.files != files) {
            this.dom.textContent = ''
            this.dom.append(...files.map(
                file => {
                    let comp = renderFile(file, this.dispatch)
                    this.fileComps[file] = comp
                    return comp
                }
            ))
            this.files = files
        }

        if (this.selectedFile != selectedFile) {
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
            dispatch({fileContent: dom.value})
        })
        this.dom = dom
        this.dispatch = dispatch
    }

    syncState({ selectedFile }) {
        if (this.selectedFile === selectedFile) return
        fetchOK(`/${selectedFile}`).then(
            async res => {
                let fileContent = await res.text()
                this.dom.value = fileContent
                this.dom.scrollTop = 0 // detail
                this.selectedFile = selectedFile
                this.dispatch({fileContent})
            }
        ).catch(console.log)
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
    constructor(init_state, dispatch) {
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
        this.syncState(init_state)
    }

    syncState(state) {
        for (let c of this.components)
            c.syncState(state)
    }
}

async function getFiles() {
    let res = await fetchOK('/')
    return (await res.text()).split('\n')
}

function runApp() {
    getFiles().then(files => {
        let state = { files, selectedFile: files[0] }, app;
        app = new MargApp(state, function (action) {
            state = handleAction(state, action)
            app.syncState(state)
        })
        document.body.appendChild(app.dom)
    })

}

runApp()