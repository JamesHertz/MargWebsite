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
        this.file.textContent = state.selected
    }
}

class Editor {

    constructor() {
        this.dom = elt('textarea', { id: 'editor' })
    }

    syncState({ selected }) {
        if (this.selected === selected) return
        fetchOK(`/${selected}`).then(
            async res => {
                this.dom.textContent = await res.text()
                this.selected = selected 
            }
        ).catch(console.log)
    }
}


function renderFile(file, dispatch) {
    return elt('div',
        {
            className: 'file',
            onclick: () => dispatch({ selected: file })
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

    syncState({files, selected}){
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

        if(this.selected != selected){
            if(this.selected)
                this.fileComps[this.selected].classList.remove('selected')
            this.fileComps[selected].classList.add('selected')
            this.selected = selected
        }
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
        let state = { files, selected: files[0] }, app;
        app = new MargApp(state, function (action) {
            state = Object.assign(state, action)
            app.syncState(state)
        })
        document.body.appendChild(app.dom)
    })

}

runApp()