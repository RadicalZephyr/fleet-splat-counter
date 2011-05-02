// ==UserScript==
// @name           Little Helper
// @version        0.01
// @require        http://jqueryjs.googlecode.com/files/jquery-1.3.2.min.js
// @namespace      tag: earthlingzephyr@gmail.com,2010-03-08:littlehelper
// @description    Various small utility scripts
// @include        http://www.spybattle.com/research.php
// @include        http://www.starpirates.net/research.php
// @include        http://www.spybattle.com/slots.php*
// @include        http://www.starpirates.net/slots.php*
// @include        http://www.spybattle.com/pointmarket.php
// @include        http://www.starpirates.net/pointmarket.php
// ==/UserScript==

function GM_printall (obj) {
    var str = '';
    for( var memb in obj ) {
        if (memb != 'unique') {
            str += memb + ' = ' + obj[memb] + '\n'; 
        }
    }
    GM_log(str);
}

function researcher () {
    var energy, research, gauges, buttons,
        values, lowest, links;

    gauges = $('a.textstatsbox div.hover_text_percent');
    energy = gauges[1].textContent.replace("%","");
    research = gauges[2].textContent.replace("%","");
    links = $('td[colspan="2"] a');
    GM_log(energy);
    GM_log(research);

    if (energy === '0') {
        links[2].style.fontSize = '300%';
    }
    if (parseInt(research) < 45) {
        links[0].style.fontSize = '300%';
    }
    buttons = $('.contentcontent input').slice(2,5);
    // acces wanted info with [i].value
    // range wanted is 
    
    
    values = $('.contentcontent td[align="center"]');
    // access the wanted info with [i].innerHTML
    
    lowest = -1;
    
    for (var i = 0; i < 3; i++) {
        var index, number;
        number = parseInt(values[i].innerHTML.replace(/[^0-9]/g,''));
        
        if (lowest === -1 || lowest > number) {
            lowest = number;
            index = i;
        }
    }
    
    for (var i = 0; i < 3; i++) {
        if (i != index) {
            buttons[i].value = "--";
        }
    }
}
function gambler () {
    var banklinks = $('a[alt="bank"]');
    for (var i = 0; i < banklinks.length; i++) {
        banklinks[i].target = "_blank";
    }
}

// Another awesomely helpful little function would be to adjust point
// buy values to the total you can currently afford.

function pointbuyer () {
    var pointlist, banklinks, bank, money;
    
    banklinks = $('a.textstatsbox[alt="bank"]');

    if (document.title === 'Spy Battle') {
        bank = banklinks[1].textContent.replace(/[^0-9]/g,'');
        money = banklinks[3].textContent.replace(/[^0-9]/g,'');
    }
    else if (document.title === 'Star Pirates') {
        bank = banklinks[0].textContent.replace(/[^0-9]/g,'');
        money = banklinks[1].textContent.replace(/[^0-9]/g,'');
    }
        
    pointlist = $('td.contentcontent table[width="100%"] tr');

    for (var i = 0; i < pointlist.length; i++) {
        var points, cost, numbers, buyamount, buybutton;
        numbers = pointlist[i].textContent.slice(5,pointlist[i].textContent.length);

        numbers = numbers.replace(/,/g,'').match(/[0-9]+/g);
        points = numbers[0];
        cost = numbers[1];
        buyamount = pointlist[i].childNodes[1].childNodes[1];
        buybutton = pointlist[i].wrappedJSObject.childNodes[2].firstChild;
        GM_log(buybutton.value);

        if (parseInt(buyamount.value) > parseInt(points) ||
            buybutton.value.indexOf("Remove") !== -1) {
            buyamount.value = points;
        }
        else {
        buyamount.value = (parseInt(money)/parseInt(cost)).toFixed(0);
        }

    }
}

var URL = document.URL;

if (URL.indexOf('research') !== -1 &&
    GM_getValue('researchon', true)) {
    researcher();
}
else if (URL.indexOf('slots') !== -1 &&
         GM_getValue('slotson', true)) {
    gambler();
}
else if (URL.indexOf('pointmarket') !== -1 &&
         GM_getValue('pointson', true)) {
    pointbuyer();
}