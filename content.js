chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var template = request.template;

        console.log(template);
        var focused = $(':focus');

        if (!focused.length) {
            // No focused element was found, generally meaning your target is an iframe
            focused = $("iframe");
            focused = focused.contents().find("body")[0];

            focused.innerHTML = template;
        } else {
            focused.val(template);
        }

    }
);