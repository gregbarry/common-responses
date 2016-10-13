/**
 * Do things when the dom is loaded for the main menu
 */
document.addEventListener('DOMContentLoaded', function() {
    var checkPageButton = document.getElementById('checkPage');
    checkPageButton.addEventListener('click', function() {

        chrome.tabs.getSelected(null, function(tab) {
            // do stuff
        });
    }, false);
}, false);