function buildMenu(initial) {
    var clipTexts  = getLocalStorage("cliptext"),
        clipTitles = getLocalStorage("cliptext"),
        clipId     = getLocalStorage("clipid"),
        clipCount  = clipTexts.length || 0;

    if (initial) {
        var root = chrome.contextMenus.create({
            title: 'Common Responses',
            type : "normal",
            contexts: ['page', 'selection', 'editable'],
            id: 'rootNode'
        });

        chrome.contextMenus.create({
            title: 'Add Clipping from Selection',
            type : "normal",
            contexts: ["all", "editable"],
            parentId: root,
            id: 'addFromSelection',
            onclick: addFromSelectionClick
        });

        if (clipCount > 0) {
            for (var i = 0; i <= clipCount; i++) {
                if (clipTitles[i]) {
                    chrome.contextMenus.create({
                        title: clipTitles[i],
                        type : "normal",
                        contexts: ["all", "editable"],
                        onclick: contextMenuClick,
                        id: clipId[i],
                        parentId: 'rootNode'
                    });
                }
            }
        }
    } else {
        chrome.contextMenus.create({
            title: clipTitles[clipCount-1],
            type : "normal",
            contexts: ["all", "editable"],
            onclick: contextMenuClick,
            id: clipId[clipCount-1],
            parentId: 'rootNode'
        });
    }
}

function createClipping(text){
    var clipText, clipTitle, clipId, key;

    try {
        clipText  = getLocalStorage("cliptext")  || [];
        clipTitle = getLocalStorage("cliptitle") || [];
        clipId    = getLocalStorage("clipid")    || [];
    } catch(err){

    }

    key = 'clip_' + (clipTitle.length + 1);

    clipTitle.push(text.substring(0, 20).replace(/(\r\n|\n|\r)/gm,"") + '...');
    clipText.push(text);
    clipId.push(key);

    setLocalStorage("cliptitle", clipTitle);
    setLocalStorage("cliptext",  clipText);
    setLocalStorage("clipid",    clipId);

    buildMenu(false);
}

var addFromSelectionClick = function(e) {

    // We know that selected text exists
    if (e.selectionText) {

        // We have to do this insanity because the event's selection text strips out line breaks.
        chrome.tabs.executeScript( {
            code: "window.getSelection().toString();"
        }, function(selection) {

            var text = selection[0] || e.selectionText;

            createClipping(text);
        });
    }
};

var contextMenuClick = function(e) {
    var id = e.menuItemId,
        clipTexts  = getLocalStorage("cliptext"),
        clipId     = getLocalStorage("clipid"),
        clipCount  = clipTexts.length || 0,
        clipText;

    for (var i = 0; i <= clipCount; i++) {
        if (clipId[i] === id) {
            clipText = clipTexts[i];
        }
    }

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            template: clipText
        }, function (response) {

        });
    });
};

function getLocalStorage(field) {
    var getLocal = localStorage.getItem(field);

    return (getLocal) ? getLocal.split('||||||') : '';
}

function setLocalStorage(field, value) {
    localStorage.setItem(field, value.join('||||||'));
}

buildMenu(true);