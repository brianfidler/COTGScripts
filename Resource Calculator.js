// ==UserScript==
// @name             CotG Resource Request
// @description      Crown of the gods resource request calculator
// @author           ChrisMack
// @include          https://*.crownofthegods.com/
// @version          0.0.1
// @grant            none
// @namespace        http://www.chrismack.co.uk
// ==/UserScript==


(function() {

    'use strict';

    /*
     * Resource Request script
     */
    var reqResDiv = $('#reqResDiv');
    var paneVisable = false;
    var showTT = true;  //Show travel time or arrival time

    // Listen for res request changes
    var onReqResShow = new MutationObserver(function() { paneVisable = reqResDiv.css('display') !== 'none';});
    onReqResShow.observe(reqResDiv.get(0), {attributes: true});

    // Listen for changes in the request table
    var reqTable = $('#reqResReturnCities>table');

    // Request resource table header
    var reqTableThread = reqTable.children().find('th');
    var transportTimeHeader = reqTableThread[2];

    // Button to switch between Transport Time and Arrival Time
    var ttInput = $('<input />');
    ttInput.attr({'type': 'checkbox'});
    ttInput.css({'width': '10px', 'margin-left': '5px'});
    ttInput.click(function() {
        console.log('Clcik');
        console.log(reqTable);
        var tableRows = reqTable.children().find('tr');
        tableRows.each(function() {
            var el = $(this);
            if (el.attr('id') !== undefined) {
                console.log(el.children()[2]);
                if (el.prop('tt') === undefined) {
                    console.log('No tt');
                    el.prop({tt: el.children()[2].val()});
                } else {
                    console.log(el.prop('tt'));
                }
            }
        });
    });
    transportTimeHeader.append(ttInput.get(0));

    // Listen for changes in the req res table
    reqTable.bind('DOMNodeInserted', function(e) {
        if (e.target.id !== '') {
            var reqRow = $('#' + e.target.id);
            var time = reqRow.get(0).children[2].innerHTML.split(':');
            for (var i in time) {
                time[i] = parseInt(time[i], 10);
            }

            // Convert array to seconds
            var timeInSeconds = (time[0] * 3360) + time[1] * 60 + time[2];

            var resTypeId = $('input[name=reqresra]:checked').get(0).id;
            var resType = resTypeId.substr(0, resTypeId.length - 8);

            var resources = cotg.city.resources();
            var madeInTransport = resources[resType + '_ph'] / (3600 / timeInSeconds);
            var needed = resources[resType + '_st'] - resources[resType];

            console.log(needed);
            console.log(madeInTransport);
            console.log(needed - madeInTransport);
        }
    });

})();