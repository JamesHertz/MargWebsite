function elt(type, props, ...children) {
    let dom = document.createElement(type);
    if (props) Object.assign(dom, props);
    for (let child of children) {
        if (typeof child != "string") dom.appendChild(child);
        else dom.appendChild(document.createTextNode(child));
    }
    return dom;
}

function fetchOK(url, options) {
    return fetch(url, options).then(response => {
        if (response.status < 400) return response;
        else throw new Error(response.statusText);
    });
}



class InfoPane {
    constructor() {
        this.file = elt('em')
        this.dom = elt('div', { id: 'editor-info' }, this.file)
    }

    syncState(state) {
        this.file.textContent = state.selFile
    }
}

class Editor {

    constructor() {
        this.dom = elt('textarea', { id: 'editor' })
    }

    syncState({ selFile }) {
        if (this.selFile === selFile) return
        fetchOK(`/${selFile}`).then(
            res => res.text()
        ).then(txt =>
            this.dom.textContent = txt
        ).catch(console.log)
        this.selFile = selFile
    }
}


class FilePane {

    // by now
    constructor(dispatch) {
        this.dispatch = dispatch
        this.dom = elt('div', { id: 'file-pane' })
    }

    syncState({ files }) {
        if (this.files == files) return
        this.dom.textContent = ''
        this.dom.append(...files.map(
            file => elt('button',
                {
                    className: 'file',
                    onclick: () => {
                        this.dispatch({ selFile: file })
                    }
                }, file
            )
        ))
        this.files = files
    }

}


class MargApp {
    constructor(init_state, dispatch) {
        let filePane = new FilePane(dispatch)
        let editcomp = [new Editor(), new InfoPane()]
        this.components = [filePane, ...editcomp]

        this.dom = elt(
            'div', { id: 'main-pane' },
            filePane.dom,
            elt('div', { id: 'editor-pane' },
                ...editcomp.map(c => c.dom)
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
        let state = { files, selFile: files[0] }, app;
        app = new MargApp(state, function (action) {
            state = Object.assign(state, action)
            app.syncState(state)
        })
        document.body.appendChild(app.dom)
    })

}

runApp()