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

async function getFiles() {
    let res = await fetchOK('/')
    return (await res.text()).split('\n')
}

async function runApp() {

    let dom = elt(
        'div', { id: 'main-frame' },
        elt('div', { id: 'file-pane' },
            ...(await getFiles()).map(
                f => elt('div', { className: 'file' }, f, elt('br'))
            )
        )
        ,
        elt('textarea', { id: 'editor' })
    )
    document.body.appendChild(dom)
}

runApp()