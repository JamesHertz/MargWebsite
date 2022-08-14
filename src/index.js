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
    constructor(files, dispatch) {
        this.files = []
        this.dom = elt('div', { id: 'file-pane' },
            ...files.map(
                file => elt('button', {
                    className: 'file',
                    // animation ...
                    onclick: () => {
                        dispatch({ selFile: file })
                    }
                }, file)
            )
        )
    }

    syncState() { }

}


class MargDisplay {
    constructor(parent, files, state) {
        let components = [new Editor(files), new InfoPane()]
        let filePane = new FilePane(files, update_state)

        function update_state(diff) {
            state = Object.assign(state, diff)
            components.forEach(e => e.syncState(state))
        }


        this.dom = elt(
            'div', { id: 'main-pane' },
            filePane.dom,
            elt('div', { id: 'editor-pane' },
                ...components.map(c => c.dom)
            )
        )
        parent.appendChild(this.dom)
        update_state({ selFile: files[0] })
    }
}

async function getFiles() {
    let res = await fetchOK('/')
    return (await res.text()).split('\n')
}

async function runApp() {
    let files = await getFiles()
    new MargDisplay(document.body, files, {})
}

runApp()