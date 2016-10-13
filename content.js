function markupTemplate(template, amount) {
    if (amount == 'double') {
        template = '<p>' + template.replace(/\n{2}/g, '&nbsp;</p><p>&nbsp;</p><p>').replace(/\n/g, '&nbsp;<br />') + '</p>';
    } else {
        template = template.replace(/\n{2}/g, '&nbsp;</p><p>').replace(/\n/g, '&nbsp;<br />');
    }
    return template;
}

function checkForPlaceholder(template) {
    var re = /.*\{.*}.*/;

    return re.test(template);
}

function replacePlaceholders(template) {
    var replacements = {},
        re = /\{\w+}/g,
        matches = template.match(re), promptValue, i;

    for (i = 0; i < matches.length; i++) {
        var match = matches[i],
            cleanPlaceholder = match.replace('{', '').replace('}', '');

        promptValue = prompt("Please enter " + cleanPlaceholder);

        replacements[match] = promptValue;
    }

    template = template.replace(re, function(all) {
        return replacements[all] || all;
    });

    return template;
}

chrome.runtime.onMessage.addListener(
    function(request) {
        var template    = request.template,
            focused     = $(':focus'),
            textbox     = $("div[role='textbox']:focus"),
            iframe      = $("iframe"),
            placeholder = checkForPlaceholder(template);

        if (placeholder) {
            template = replacePlaceholders(template);
        }

        if (focused) {
            focused.val(template);
        }

        if (textbox.length > 0) {
            textbox.html(markupTemplate(template, 'single'));
        }

        if (iframe.length > 0) {
            try {
                iframe = iframe.contents().find("body")[0];

                if (iframe) {
                    iframe.innerHTML = markupTemplate(template, 'double');
                }
            } catch (err) {

            }
        }
    }
);