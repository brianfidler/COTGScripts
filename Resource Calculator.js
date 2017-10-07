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

    // Listen for res request changes
    var onReqResShow = new MutationObserver(function() {
        paneVisable = reqResDiv.css('display') !== 'none';
    });
    onReqResShow.observe(reqResDiv.get(0), {attributes: true});

    // Listen for changes in the request table
    var reqTable = $('#reqResReturnCities>table');

    // Request resource table header
    var reqTableThread = reqTable.children().find('th');
    var transportTimeHeader = reqTableThread[2];
    var requestHeader = reqTableThread[3];

    //Check box to toggle the optimal ammount
    var reqInput = $('<input />');
    reqInput.attr({type: 'checkbox', id: 'reqResOpti'});
    reqInput.css({width: '10px', 'margin-left': '5px'});
    reqInput.click(function() {
        var checked = $('#reqResOpti').is(':checked');
        var tableRows = reqTable.children().find('tr');
        tableRows.each(function() {
            var el = $(this);
            if (el.attr('id') !== undefined) {
                if (el.prop('maxReq') === undefined) {
                    el.prop({maxReq: el.children().eq(3).find('input').val()});
                }

                if (checked) {
                    el.children().eq(3).find('input').val(calcOptimal(el));
                    // TODO: Check if opti is more than max then show warning
                } else {
                    el.children().eq(3).find('input').val(el.prop('maxReq'));
                }
            }
        });
    });
    requestHeader.append(reqInput.get(0));

    // Button to switch between Transport Time and Arrival Time
    var ttInput = $('<input />');
    ttInput.attr({'type': 'checkbox', id: 'reqResAriB'});
    ttInput.css({'width': '10px', 'margin-left': '5px'});

    // toggle travel time and arrival time
    ttInput.click(function(e) {
        var checked = ttInput.is(':checked');
        var tableRows = reqTable.children().find('tr');
        tableRows.each(function() {
            var el = $(this);
            if (el.attr('id') !== undefined) {
                var inner = el.children().eq(2)[0].innerHTML;
                // Save the travel time to the row
                if (el.prop('tt') === undefined) {
                    var time = inner;
                    el.prop({tt: time});

                    // Convert hh:mm:ss to milliseconds
                    var timeArr = time.split(':');
                    var timeMils = ((timeArr[0] * 3600) + (timeArr[1] * 60) + (timeArr[2])) * 10;
                    el.prop({ttMils: timeMils});
                }

                // Change the time based on checked
                if(checked) {
                    var arrivalTime = currentTime() + el.prop('ttMils');
                    el.children().eq(2)[0].innerHTML = formatT(arrivalTime);
                } else {
                    el.children().eq(2)[0].innerHTML = el.prop('tt');
                }
            }
        });
    });
    transportTimeHeader.append(ttInput.get(0));

    /*
     * Reset changes after req table has been refreshed
     */
    var reset = function() {
        var ttInput = $('#reqResAriB');
        if(ttInput !== undefined) {
            ttInput.attr({checked: false});
        }

        var reqInput = $('#reqResOpti');
        if(reqInput !== undefined) {
            reqInput.attr({checked: false});
        }
    };

    // Listen for changes in the req res table
    reqTable.bind('DOMNodeInserted', function(e) {
        if (e.target.id !== '') {
            reset();
        }
    });

    /*
     * Take into account the space in the city
     * the production rate of the city, the existing resources
     * and the incoming resources
     *
     * return the optimal value to request
     *
     */
    var calcOptimal = function(row) {
        var time = row.children().eq(2).get(0).innerHTML.split(':');
        var seconds = parseInt(time[0]) * 3600 + parseInt(time[1]) * 60 + parseInt(time[2]);
        var resTypeId = $('input[name=reqresra]:checked').get(0).id;
        var resType = resTypeId.substr(0, resTypeId.length - 8);
        var resources = cotg.city.resources();
        var incoming = {
            wood: parseInt($('#incw').html().replace(',', '')),
            stone: parseInt($('#incs').html().replace(',', '')),
            iron: parseInt($('#inci').html().replace(',', '')),
            food: parseInt($('#incf').html().replace(',', ''))
        };
        var madeInTransport = resources[resType + '_ph'] / (3600 / seconds);
        var needed = resources[resType + '_st'] - resources[resType];
        var optimisedReq = needed - incoming[resType] - madeInTransport;

        return Math.floor(optimisedReq);
    };



    // Reset request table
    document.getElementById('reqResGo').addEventListener('click', reset);



})();