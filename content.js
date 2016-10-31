function markupTemplate(template, amount) {
    if (amount == 'double') {
        template = '<p>' + template.replace(/\n{2}/g, '&nbsp;</p><p>&nbsp;</p><p>').replace(/\n/g, '&nbsp;<br />') + '</p>';
    } else {
        template = template.replace(/\n{2}/g, '&nbsp;</p><p>').replace(/\n/g, '&nbsp;<br />');
    }
    return template;
}

function appendAtCaret($target, caret, $value, iframe) {
    var value;

    if (iframe) {
        value = $($target).html();

        if (caret == 0) {
            $($target).html($value + '' + value);
        } else {
            $($target).html(value + '' + $value);
        }
    } else {
        value = $target.val();
    }

    if (caret != value.length) {
        var startPos = $target.prop("selectionStart"),
            scrollTop = $target.scrollTop;

        $target.val(value.substring(0, caret) + '' + $value + '' + value.substring(caret, value.length));
        $target.prop("selectionStart", startPos + $value.length);
        $target.prop("selectionEnd", startPos + $value.length);
        $target.scrollTop = scrollTop;
    } else if (caret == 0) {
        $target.val($value + '' + value);
    } else {
        $target.val(value + '' + $value);
    }
}

function checkForInclude(template) {
    var re = /.*\$\$.*\$\$.*/;

    return re.test(template);
}

function getBackgroundData(text, fn) {
    chrome.runtime.sendMessage({
        type: 'backgroundData',
        name: 'bgData',
        text: text
    }, function(value) {
        return fn(value);
    });
}

function getIframeCaret(el) {
    var sel, range;

    el.contentWindow.focus();
    sel = el.contentWindow.getSelection();

    if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);

        return range.startOffset;
    }
}

function getCaret(el) {
    if (el.prop("selectionStart")) {
        return el.prop("selectionStart");
    } else if (document.selection) {
        el.focus();

        var r = document.selection.createRange();
        if (r == null) {
            return 0;
        }

        var re = el.createTextRange(),
            rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);

        return rc.text.length;
    }

    return 0;
}

function replaceIncludes(clipTexts, template) {
    var re = /\$\$\w+\$\$/g,
        matches = template.match(re), i;

    for (i = 0; i < matches.length; i++) {
        var match = matches[i],
            cleanInclude = match.replace('$$', '').replace('$$', ''),
            index = cleanInclude - 1;

        template = template.replace(match, clipTexts[index]);
    }

    return template;
}

function checkForPlaceholder(template) {
    var re = /.*\[\[.*]].*/;

    return re.test(template);
}

function replacePlaceholders(template) {
    var replacements = {},
        re = /\[\[\w+]]/g,
        matches = template.match(re), promptValue, i;

    for (i = 0; i < matches.length; i++) {
        var match = matches[i],
            cleanPlaceholder = match.replace('[[', '').replace(']]', '');

        promptValue = prompt("Please enter " + cleanPlaceholder);
        replacements[match] = promptValue;
    }

    template = template.replace(re, function(all) {
        return replacements[all] || all;
    });

    return template;
}

function checkEntryPoints(template, el) {
    if (template) {
        var iframe      = $("iframe").not(".preview").not(".fiddle"),
            placeholder = checkForPlaceholder(template),
            fbTarget    = $("[data-text='true']"),
            target      = $(el),
            type        = (target[0]) ? target[0].tagName : '',
            caret;

        if (type === "TEXTAREA") {
            if (placeholder) {
                template = replacePlaceholders(template);
            }
            caret = getCaret(target);
            appendAtCaret(target, caret, template);
        }

        if (fbTarget) {
            // TODO
        }

        if (iframe.length > 0) {
            try {
                var iframeBody = iframe.contents().find("body")[0];

                if (iframe) {
                    if (placeholder) {
                        template = replacePlaceholders(template);
                    }
                    caret = getIframeCaret(iframe[0]);

                    appendAtCaret(iframeBody, caret, markupTemplate(template, 'double'), true);
                }
            } catch (err) {

            }
        }

    }
}

chrome.runtime.onMessage.addListener(
    function(request) {
        var template    = request.template,
            includes    = checkForInclude(template);

        if (includes) {
            // We have to do a async callback here because we're getting data from the background
            // There is new Chrome storage option to look into in the future
            getBackgroundData('cliptext', function(value){
                template = replaceIncludes(value, template);
                checkEntryPoints(template, clickedEl);
            });
        } else {
            checkEntryPoints(template, clickedEl);
        }
    }
);

var clickedEl = null;

document.addEventListener("mousedown", function(event){
    clickedEl = event.target;
}, true);