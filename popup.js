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

        $("#tabs").tabs();

        $(document).on('click', '.update_submit', function() {
            var clipTexts    = getLocalStorage("cliptext"),
                clipTitles   = getLocalStorage("cliptitle"),
                clipId       = getLocalStorage("clipid"),
                responsesRef = $("#responses"),
                id           = $(this).attr('id').replace('update_', ''),
                i            = clipId.indexOf(id),
                title        = $('#update_title_' + id).val(),
                text         = $('#update_text_'  + id).val();

            clipTitles[i] = title;
            clipTexts[i]  = text;

            setLocalStorage("cliptext",  clipTexts);
            setLocalStorage("cliptitle", clipTitles);

            cleanup(responsesRef);
        });

        $(document).on('click', '.add_submit', function() {
            var clipTexts    = getLocalStorage("cliptext") || [],
                clipTitles   = getLocalStorage("cliptitle") || [],
                clipId       = getLocalStorage("clipid") || [],
                clipCount    = clipTexts.length || 0,
                responsesRef = $("#responses"),
                id           = 'clip_' + clipCount,
                addTitle     = $('#add_title'),
                addText      = $('#add_text'),
                title        = addTitle.val(),
                text         = addText.val(),
                finalId      = chrome.extension.getBackgroundPage().checkId(clipId,id, 'clip_'),
                finalNum     = finalId.replace('clip_', ''),
                tab          = $('.second_tier').length - 1;

            addTitle.val('');
            addText.val('');

            clipId[finalNum]     = finalId;
            clipTitles[finalNum] = title;
            clipTexts[finalNum]  = text;

            $('#main_menu').accordion({ active: 1 });

            setLocalStorage("clipid",    clipId);
            setLocalStorage("cliptitle", clipTitles);
            setLocalStorage("cliptext",  clipTexts);

            cleanup(responsesRef, tab);
        });


        $('.submit_import').click(function(e) {
            var textarea = $('textarea#export_output'),
                text     = decodeURIComponent(textarea.val()),
                sections = text.split('||||||||'),
                stores   = ['clipid','cliptitle','cliptext'],
                responsesRef = $("#responses");

            $(stores).each(function(index, value) {
                var content = jQuery.parseJSON(sections[index]);
                localStorage.setItem(value, content.join('||||||'));
            });

            textarea.val('');

            cleanup(responsesRef, true);

            e.preventDefault();
        });

        $('.export_file').click(function() {
            var clipTexts    = JSON.stringify(getLocalStorage("cliptext")),
                clipTitles   = JSON.stringify(getLocalStorage("cliptitle")),
                clipId       = JSON.stringify(getLocalStorage("clipid")),
                items        = clipId + "||||||||" + clipTitles + "||||||||" + clipTexts;

            // Save as file
            var url = 'data:application/json;base64,' + btoa(encodeURIComponent(items));
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

            cleanup(responsesRef);
        });

        function buildAccordion() {

            var clipTexts    = getLocalStorage("cliptext"),
                clipTitles   = getLocalStorage("cliptitle"),
                clipId       = getLocalStorage("clipid"),
                responsesRef = $('#responses'),
                addResponses = $('#add_responses');

            addResponses.replaceWith($('<div>', {
                class  : 'group second_tier',
                html   : "<h3> Add Response</h3>" +
                '<div><p><label>Title</label><br><input type="text" id="add_title"></p>' +
                "<p><label>Response</label><br><textarea id='add_text'></textarea></p>" +
                "<p><input type='submit' class='add_submit' value='add'/></p></div>"
            }));

            for (var i = 0; i <= clipTitles.length; i++) {
                if (clipTitles[i]) {
                    responsesRef.append($('<div>', {
                        class  : 'group second_tier',
                        html   : "<h3 id='id_"+i+"' data-order='"+clipId[i]+"'>" + (i + 1) + ' - ' + clipTitles[i] + "</h3>" +
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
                    var newClipTexts = [],
                        newClipTitles= [];

                    $("#responses").find('.second_tier').each(function() {
                        var title = $(this).find('input').val(),
                            text  = $(this).find('textarea').val();

                        newClipTitles.push(title);
                        newClipTexts.push(text);
                    });

                    setLocalStorage("cliptext" ,  newClipTexts);
                    setLocalStorage("cliptitle", newClipTitles);

                    cleanup(responsesRef);
                }
            });
        }

        function cleanup(responsesRef, tab) {
            chrome.extension.getBackgroundPage().buildMenu(true);

            responsesRef.accordion( "destroy" );
            responsesRef.empty();
            buildAccordion();

            if (tab) {
                $( "#tabs" ).tabs( "option", "active", 1 );
                responsesRef.accordion({ active: tab });
            }
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