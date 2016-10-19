/**
 * Do things when the dom is loaded for the main menu
 */
document.addEventListener('DOMContentLoaded', function() {
    $( function() {
        $("#main_menu").accordion({
            collapsible: true,
            heightStyle: "content",
            header: "> div > h3"
        });

        $(document).on('click', '.update_submit', function() {
            var clipTexts    = getLocalStorage("cliptext"),
                clipTitles   = getLocalStorage("cliptitle"),
                clipId       = getLocalStorage("clipid"),
                accordionRef = $("#responses"),
                id           = $(this).attr('id').replace('update_', ''),
                i            = clipId.indexOf(id),
                title        = $('#update_title_' + id).val(),
                text         = $('#update_text_'  + id).val();

            clipTitles[i] = title;
            clipTexts[i]  = text;

            setLocalStorage("cliptext",  clipTexts);
            setLocalStorage("cliptitle", clipTitles);

            chrome.extension.getBackgroundPage().buildMenu(true);

            accordionRef.accordion( "destroy" );
            accordionRef.empty();
            buildAccordion();
        });

        $('.submit_import').click(function(e) {
            var text     = $('textarea#export_output').val(),
                sections = text.split('||||||||'),
                stores   = ['clipid','cliptitle','cliptext'],
                responsesRef = $("#responses");


            $(stores).each(function(index, value) {
                console.log(JSON.parse(sections[index]));
                localStorage.setItem(value, JSON.parse(sections[index]).join('||||||'));
            });

            chrome.extension.getBackgroundPage().buildMenu(true);

            responsesRef.accordion( "destroy" );
            responsesRef.empty();
            buildAccordion();

            e.preventDefault();
        });

        $('.export_file').click(function() {
            var clipTexts    = JSON.stringify(getLocalStorage("cliptext")),
                clipTitles   = JSON.stringify(getLocalStorage("cliptitle")),
                clipId       = JSON.stringify(getLocalStorage("clipid")),
                items        = clipId + "||||||||" + clipTitles + "||||||||" + clipTexts;

            // Save as file
            var url = 'data:application/json;base64,' + btoa(items);
            chrome.downloads.download({
                url: url,
                filename: 'common_responses_output.json'
            });
        });

        $(document).on('click', '.delete_submit', function() {
            var clipTexts    = getLocalStorage("cliptext"),
                clipTitles   = getLocalStorage("cliptitle"),
                clipId       = getLocalStorage("clipid"),
                responsesRef = $("#responses"),
                id           = $(this).attr('id').replace('delete_', ''),
                i            = clipId.indexOf(id);

            if(i != -1) {
                clipTexts.splice(i, 1);
                clipTitles.splice(i, 1);
                clipId.splice(i, 1);
            }

            setLocalStorage("cliptext",  clipTexts);
            setLocalStorage("cliptitle", clipTitles);
            setLocalStorage("clipid",    clipId);

            chrome.extension.getBackgroundPage().buildMenu(true);

            responsesRef.accordion( "destroy" );
            responsesRef.empty();
            buildAccordion();
        });

        function buildAccordion() {

            var clipTexts    = getLocalStorage("cliptext"),
                clipTitles   = getLocalStorage("cliptitle"),
                clipId       = getLocalStorage("clipid"),
                responsesRef = $('#responses');

            for (var i = 0; i <= clipTitles.length; i++) {
                if (clipTitles[i]) {
                    responsesRef.append($('<div>', {
                        class  : 'group second_tier',
                        id     : clipId[i],
                        html   : "<h3 id='id_"+i+"' data-order='"+i+"'>" + (i+1) + ". " + clipTitles[i] + "</h3>" +
                        '<div><p><label>Title</label><br><input type="text" id="update_title_' + clipId[i] + '" value="' + clipTitles[i] + '"></p>' +
                        "<p><label>Response</label><br><textarea id='update_text_" + clipId[i] + "'>" + clipTexts[i] + "</textarea></p>" +
                        "<p><input type='submit' class='update_submit' id='update_"+clipId[i]+"' value='update'/>" +
                        "<input type='submit' class='delete_submit' id='delete_"+clipId[i]+"' value='delete'/></p></div>"
                    }));
                }
            }

            responsesRef.accordion({
                collapsible: true,
                heightStyle: "content",
                header: "> div > h3"
            }).sortable({
                axis: 'y',
                handle: 'h3',
                stop: function (event, ui) {
                    ui.item.children( "h3" ).triggerHandler( "focusout" );
                    // Refresh accordion to handle new order
                    $( this ).accordion( "refresh" );
                },
                update: function () {
                    $("#responses h3").each(function() {
                        var id      = $(this).attr('id').replace('id_', ''),
                            order   = $(this).index('h3') - 1;

                        if (id != order) {
                            clipTexts  = swap(clipTexts, id, order);
                            clipTitles = swap(clipTitles, id, order);
                            return false;
                        }
                    });

                    setLocalStorage("cliptext" ,  clipTexts);
                    setLocalStorage("cliptitle", clipTitles);

                    chrome.extension.getBackgroundPage().buildMenu(true);

                    responsesRef.accordion( "destroy" );
                    responsesRef.empty();
                    buildAccordion();
                }
            });
        }

        function swap(array, id, order) {
            var temp     = array[id];
            array[id]    = array[order];
            array[order] = temp;
            return array;
        }

        function getLocalStorage(field) {
            var getLocal = localStorage.getItem(field);

            return (getLocal) ? getLocal.split('||||||') : '';
        }

        function setLocalStorage(field, value) {
            localStorage.setItem(field, value.join('||||||'));
        }

        buildAccordion();

    } );
}, false);