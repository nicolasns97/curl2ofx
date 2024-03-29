import copyToClipboard from './modules/clipboard.mjs'

window.onload = () => {
    document.getElementById('parse').addEventListener('click', handleParse);
    document.getElementById('copy').addEventListener('click', handleCopy);
}

const handleCopy = () => {
    copyToClipboard(document.getElementById('output').value);
}

const handleParse = () => {
    let active = document.querySelector('.nav-item a.active');
    let dataInput;
    switch(active.getAttribute('href')) {
        case '#curl-tab': 
            dataInput = 'CURL'; 
            break;
        case '#dynatrace-tab': 
            dataInput = 'DYNATRACE';
            break;
    }
    let data;
    if (dataInput === 'CURL') {
        let text = document.getElementById('curl').value;
        data = getCUrlData(text);
    } else if (dataInput === 'DYNATRACE') {
        let text = document.getElementById('dynatrace').value;
        let cURL = getCUrl(text);
        data = getCUrlData(cURL);
    }
    let template = document.getElementById('ofx').value;
    if (template != "") {
        let output = document.getElementById('output');
        output.value = '\n\n' + unescape(parseTemplate(template, data));
    }
}

const parseTemplate = (src, data) => {
    let doc = parseXmlFromString(src);

    data.forEach(d => {
        const query = `[select*="@name='${d.field}'"]`;
        doc.querySelectorAll(query).forEach(el => {
            let parent = el.parentNode;
            el.remove();
            parent.textContent = d.value;
        });
    });

    return new XMLSerializer().serializeToString(doc);
}

const getCUrl = (src) => {
    let doc = parseXmlFromString(src);
    let nodes = getDumpNodes(doc);
    return nodes.join("")
}

/**
 * Estrae il valore del parametro -d corrispondente ai dati della cURL
 * @param {string} cURL 
 */
const getCUrlData = (cURL) => {
    let temp = cURL.slice(cURL.indexOf('curl '))
    temp = temp.slice(temp.indexOf('-d '));
    temp = temp.slice(temp.indexOf('"') + 1);
    temp = temp.slice(0, temp.indexOf('"'));
    return temp.split('&').map(el => ( { field: el.split('=')[0], value: el.split('=')[1] } ));
}

/**
 * Converte una stringa contenente XML in un oggetto di tipo XMLDocument.
 * @param {string} text 
 */
const parseXmlFromString = (text) => {
    let parser = new DOMParser();
    let doc = parser.parseFromString(text, "application/xml");
    removeElement(doc, 'parsererror');
    return doc;
}

const removeElement = (dom, query) => {
    dom.querySelectorAll(query).forEach(el => el.remove());
}

/**
 * Estrae il valore dell'attributo "node" per ogni nodo "nodeinfo" trovato.
 * @param {XMLDocument} doc 
 */
const getDumpNodes = (doc) => {
    let xPathResult = document.evaluate(".//nodeinfo/@node", doc, null, XPathResult.ANY_TYPE, null);
    let nodes = [];
    let node = xPathResult.iterateNext();
    while (node) {
        nodes.push(node);
        node = xPathResult.iterateNext();
    }
    return nodes.map(el => el.value);
}

/**
 * Ritorna l'indice del primo array contenente la stringa passata in input.
 * @param {Array} arr 
 * @param {string} text 
 */
const indexOfStringArray = (arr, text) => {
    let result = null;
    if (arr && arr.length) {
        result = arr.reduce((acc, cur, idx) => cur.indexOf(text) != -1 ? acc = idx : acc);
    }
    return result ? +result : -1;
}
