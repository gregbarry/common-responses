function buildMenu(initial) {
    var clipTexts  = getLocalStorage("cliptext"),
        clipTitles = getLocalStorage("cliptitle"),
        clipId     = getLocalStorage("clipid"),
        clipCount  = clipTexts.length || 0;

    if (initial) {
        chrome.contextMenus.removeAll()

        var root = chrome.contextMenus.create({
            title: 'Common Responses',
            type : "normal",
            contexts: ['page', 'selection', 'editable'],
            id: 'rootNode'
        });

        chrome.contextMenus.create({
            title: 'Add Response from Selection',
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
            id: checkId(clipId,clipId[clipCount-1], 'clip_'),
            parentId: 'rootNode'
        });
    }
}

/**
 * Check the array of known clip ids to determine if one is already in use.  If so, +1.
 *
 * @param clipId
 * @param key
 * @param pretext
 * @returns {*}
 */
function checkId(clipId, key, pretext) {

    if (clipId.indexOf(key) > -1) {
        key = Number((key.replace(pretext, ''))) + 1;
        key = pretext + key;
        checkId(clipId, key);
    }

    return key;
}

function createClipping(text){
    var clipText, clipTitle, clipId, key, prepTitle;

    try {
        clipText  = getLocalStorage("cliptext")  || [];
        clipTitle = getLocalStorage("cliptitle") || [];
        clipId    = getLocalStorage("clipid")    || [];
    } catch(err){
        console.log('Could not retrieve records.');
    }

    key = 'clip_' + (clipTitle.length + 1);

    key = checkId(clipId, key, 'clip_');

    prepTitle = text.substring(0, 20).replace(/(\r\n|\n|\r)/gm,"") + '...' || '';

    clipTitle.push(prepTitle);
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

var contextMenuClick = function(e, tab) {
    chrome.tabs.sendMessage(tab.id, "getClickedEl", function(clickedEl) {
        return true;
    });

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

    var cleanedValue = value.join('||||||');

    if (cleanedValue.substring(0,11) == '||||||||||||') {
        cleanedValue = cleanedValue.slice(0,11);
    }
    localStorage.setItem(field, cleanedValue);

}

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request.type == 'backgroundData') {
        callback( getLocalStorage(request.text) );
    }
});

buildMenu(true);