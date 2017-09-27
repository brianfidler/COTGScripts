// ==UserScript==
// @name                CotG Raid Calculator
// @description         Simple In-Game raid calculator
// @author              ChrisMack
// @include          https://*.crownofthegods.com/
// @version          0.0.1
// @grant           none
// @namespace http://www.chrismack.co.uk
// ==/UserScript==


(function() {
    'use strict';

    //Loot for cavern at 100%
    var baseloot = [360, 1040, 4400, 16000, 33600, 57600, 120000, 204800, 304000, 464000];
    var selected = {
        lvl: null,
        prog: null,
        type: null,
        troops: null
    };

    cotgsubscribe.subscribe('regional', function(data) {
        selected.type = data.info.type;
        if (data.type === 'dungeon') {
            selected.lvl = data.info.lvl;
            selected.prog = data.info.prog;
            displayToopList(data);
        } else if (data.type === 'boss') {
            if ($('#troopGuide').length > 0) {
                $('#troopGuide').remove();
                $('#bottomcrownpic.troopGuide').remove();
            }
            clearRaidButtons();
            nullSelected();
        } else {
            nullSelected();
        }
    });

    document.getElementById('raidDungGo').addEventListener('click', function() {
        if (selected.type !== null && selected.troops !== null) {
            addToRaidTable();
        }
    });

    // Re add buttons when raid button is clicked
    document.getElementById('raidGo').addEventListener('click', function() {
        if (selected.type !== null && selected.troops !== null) {
            setTimeout(function() {
                addToRaidTable();
            }, 100);
        }
    });

    var nullSelected = function () {
        selected.lvl = null;
        selected.prog = null;
        selected.type = null;
        selected.troops = null;
    };

    var addToRaidTable = function() {
        $('#raidingTable').css({'cssText': 'overflow-x: hidden !important'});
        var raidingTable = $('#raidingTable > #raidTrps');
        setTimeout(function() {
            for (var i in selected.troops) {
                var raidTR = raidingTable.find('tr#raid' + selected.troops[i].id);
                if(!raidTR.find('td:last').hasClass('recTroopTD')) {
                    raidTR.append($('<td class="recTroopTD"></td>'));
                }
                if(raidTR.length > 0) {
                    var recButton = $('<button>Best ' + selected.troops[i].count + '</button>');
                    var lastElm = raidTR.find('td:last');
                    lastElm.empty();
                    recButton.addClass('brownb');
                    recButton.css({
                        'width': '110%',
                        'height': '30px',
                        'font-size': '10px'
                    });
                    recButton.click( function(id, count, event) {
                        var raidRow = raidingTable.find('tr#raid' + id);
                        var troopInput = raidRow.find('td>input');
                        troopInput.val(count);
                    }.bind(this, selected.troops[i].id, selected.troops[i].count));
                    lastElm.append(recButton);
                }
            }
        }, 100);
    };

    var clearRaidButtons = function() {
        var raidButtons = $('td[class=recTroopTD]');
        raidButtons.each(function(index) {
            $(this).remove();
        });
    };

    var isRaidTableOpen = function() {
        return $('#commandsPopUpBox').css('display') !== 'none';
    };

    var displayToopList = function(data) {
        if ($('#troopGuide').length < 1) {
            createTroopList();
        }
        insertTroops();

        // If the raid table is open and the dungeon is changed
        if (isRaidTableOpen()) {
            if (data.type === 'dungeon') {
                addToRaidTable();
            }
        }
    };

    // Create parent container for troop table
    var createTroopList = function() {
        var splitter = $('#squaredung').find('#bottomcrownpic');
        var troopGuide = $('<div id="troopGuide"></div>');
        troopGuide.css({
            width: '94%',
            margin: '1% 0 2% 3%',
            height: 'auto'
        });

        splitter.after(troopGuide.get(0));
        $('#troopGuide').after(splitter.clone().addClass('troopGuide').get(0));
    };

    // Build table display
    var insertTroops = function() {
        var troopGuide = $('#troopGuide');
        troopGuide.empty();
        troopGuide.append('<span>Troop Recommendations</span>');

        var container = $('<div></div>');
        container.attr({'id': 'extraContainer'});
        container.css({
            'display': 'block',
            'padding-top': '10px',
            'float': 'right'
        });
        container.append('<span>Extra Carry (%)</span>');

        var extraPercent = $('<input></input>');
        extraPercent.attr({'id': 'extraPercent'});
        extraPercent.css({
            'width': '40px',
            'height': '20px',
            'margin-left': '5px'
        });
        extraPercent.keyup(onPercentChange);

        container.append(extraPercent.get(0));
        troopGuide.append(container.get(0));

        var troops = getTroops(getRequiredTS(selected.lvl, selected.prog), selected.type);
        //Set base troops needed for raid buttons
        selected.troops = troops;
        var content = buildTroopTable(troops);
        troopGuide.append(content);
    };

    // Rebuilds table when extra carry percentage is changed
    var onPercentChange = function(e) {
        if (!isNaN(e.target.value)) {
            var value = e.target.value;
            if (value === '') {
                value = 0;
            }

            var troopGuide = $('#troopGuide');
            $('#troopTable').remove();
            var troops = getTroops(getRequiredTS(selected.lvl, selected.prog, parseInt(value, 10)), selected.type);
            troopGuide.append(buildTroopTable(troops));
        }
    };

    var buildTroopTable = function(troops) {
        var content = $('<table>' +
            '<tr><td style="text-align: center">Unit</td>' +
            '<td style="text-align: center">Count</td>' +
            '<td style="text-align: center">Recommended</td></tr></table>');
        content.attr({'id': 'troopTable'});
        content.css({
            'width': '100%',
            'font-size': '140%',
            'padding': '2% 0 0 2%'
        });

        for (var i in troops) {
            content.find('tr').last().after('<tr>' +
                '<td style="text-align: center">' + troops[i].troop + '</td>' +
                '<td style="text-align: center">' + troops[i].count + '</td>' +
                '<td style="text-align: center">' + (troops[i].rec ? 'Yes' : 'No') + '</td>' +
                '</tr>');
        }
        return content;
    };

    // Calculate required TS
    var getRequiredTS = function(level, progress, extra = 0) {
        var loot = baseloot[level - 1];
        var baseTs = Math.ceil((loot + loot * ((100 - progress) / 100)) / 10);
        var totalTs = Math.ceil(baseTs * (1 + extra / 100));
        return totalTs;
    };

    // Map TS to troop
    var getTroops = function(ts, type) {
        return [
            {
                id: 'TR5',
                troop: 'Vanquisher',
                count: ts,
                rec: type === 'Mountain Cavern'
            },
            {
                id: 'TR2',
                troop: 'Ranger',
                count: ts,
                rec: type === 'Mountain Cavern'
            },
            {
                id: 'TR3',
                troop: 'Triari',
                count: Math.ceil(ts / 2),
                rec: type === 'Mountain Cavern'
            },
            {
                id: 'TR8',
                troop: 'Arbalist',
                count: Math.ceil(ts / 1.5),
                rec: type === 'Forest Cavern'
            },
            {
                id: 'TR10',
                troop: 'Horseman',
                count: Math.ceil(ts / 1.5),
                rec: type === 'Forest Cavern'
            },
            {
                id: 'TR6',
                troop: 'Sorcerer',
                count: Math.ceil(ts * 2),
                rec: type === 'Hill Cavern'
            },
            {
                id: 'TR11',
                troop: 'Druid',
                count: ts,
                rec: type === 'Hill Cavern'
            },
            {
                id: 'TR4',
                troop: 'Priestess',
                count: ts,
                rec: type === 'Mountain Cavern'
            },
            {
                id: 'TR9',
                troop: 'Praetor',
                count: Math.ceil(ts / 2),
                rec: type === 'Forest Cavern'
            },
            {
                id: 'TR15',
                troop: 'Stinger',
                count: Math.ceil(ts / 150),
                rec: type === 'Siren\'s Cove'
            },
            {
                id: 'TR16',
                troop: 'Warship',
                count: Math.ceil(ts / 300),
                rec: type === 'Siren\'s Cove'
            }
        ];
    };
})();