/**
 * Do things when the dom is loaded for the main menu
 */
document.addEventListener('DOMContentLoaded', function() {
    function markupTemplate(template, amount) {
        template = '<p>' + template.replace(/\n{2}/g, '&nbsp;</p><p>&nbsp;</p><p>').replace(/\n/g, '&nbsp;<br />') + '</p>';
        return template;
    }

    function getLocalStorage(field) {
        var getLocal = localStorage.getItem(field);

        return (getLocal) ? getLocal.split('||||||') : '';
    }

    function setLocalStorage(field, value) {
        localStorage.setItem(field, value.join('||||||'));
    }

    var clipTexts  = getLocalStorage("cliptext"),
        clipTitles = getLocalStorage("cliptext"),
        clipId     = getLocalStorage("clipid");

    for (var i = 0; i <= clipTitles.length; i++) {
        if (clipTitles[i]) {
            $('#responses').append($('<div>', {
                class  : 'group',
                id     : clipId[i],
                html   : "<h3>" + (i+1) + ". " + clipTitles[i].substring(0, 10) + "</h3>" +
                         "<div><p><label>Title</label><br><input type='text' id='update_title_" + clipId[i] + "' value='" + clipTitles[i] +"'>'</p>" +
                         "<p><label>Response</label><br><textarea id='update_text_" + clipId[i] + "'>" + clipTexts[i] +
                         "</textarea></p><p><input type='submit'/></p></div>"
            }));
        }
    }

    $( function() {
        $( "#responses" )
            .accordion({
                header: "> div > h3"
            })
            .sortable({
                axis: "y",
                handle: "h3",
                stop: function( event, ui ) {
                    // IE doesn't register the blur when sorting
                    // so trigger focusout handlers to remove .ui-state-focus
                    ui.item.children( "h3" ).triggerHandler( "focusout" );

                    // Refresh accordion to handle new order
                    $( this ).accordion( "refresh" );
                }
            });
    } );
}, false);