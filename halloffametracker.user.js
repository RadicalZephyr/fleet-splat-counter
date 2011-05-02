// ==UserScript==
// @name           Hall of Fame Tracker
// @version        2.01
// @require        http://jqueryjs.googlecode.com/files/jquery-1.3.2.min.js
// @namespace      tag: earthlingzephyr@gmail.com,2010-03-08:HoFTracker
// @description    Compares players HoF Level and Total Stats ranks to find good targets.  Displays results on profile page and in search page.
// @include        http://www.spybattle.com/halloffame.php?view=totalstats*
// @include        http://www.starpirates.net/halloffame.php?view=totalstats*
// @include        http://www.spybattle.com/halloffame.php?view=exp*
// @include        http://www.starpirates.net/halloffame.php?view=exp*
// @include        http://www.starpirates.net/profiles.php*
// @include        http://www.spybattle.com/profiles.php*
// @include        http://www.starpirates.net/search.php*
// @include        http://www.spybattle.com/search.php*
// ==/UserScript==

function printallmembers(obj) {
    var str = '';
    for (var memb in obj) {
        if (memb != 'unique') {
            str += memb + ' = ' + obj[memb] + '\n'; 
        }
    }
    return str;
}

function stringToPlayerObj(string) {
    var obj = {};
    var arr = string.split(',');
    obj.level = arr[0];
    obj.stats = arr[1];
    return obj;
}

function elem(name, attrs, style, text) {
    var key;
    var e = document.createElement(name);
    if (attrs) {
        for (key in attrs) {
            if (key == 'class') {
                e.className = attrs[key];
            } else if (key == 'id') {
                e.id = attrs[key];
            } else {
                e.setAttribute(key, attrs[key]);
            }
        }
    }
    if (style) {
        for (key in style) {
            e.style[key] = style[key];
        }
    }
    if (text) {
        e.appendChild(document.createTextNode(text));
    }
    return e;
}

function integrateObjs(obj1, obj2) {
    var toRet = {};
    if (obj1.level === 0) {
        toRet.level = obj2.level;
    }
    else {
        toRet.level = obj1.level;
    }
    if (obj1.stats === 0) {
        toRet.stats = obj2.stats;
    }
    else {
        toRet.stats = obj1.stats;
    }
    return toRet;
}

function setRecord() {
    window.localStorage.setItem('delete', 'false');
    this.nextSibling.value = "Delete";
    this.value = "RECORD";
    processHOF();
}

function setDelete() {
    window.localStorage.setItem('delete', 'true');
    this.previousSibling.value = "Record";
    this.value = "DELETE";
    processHOF();
}

function setUpRecord() {
    var xpathCC = $("td.contentcontent tr");
    
    var deleteMode = window.localStorage.getItem('delete') || 'true';
    var div = elem('div');
    var form = elem('form');
    var rec = elem('input');
    var del = elem('input');
    
    
    del.type = "button";
    del.addEventListener("click", setRecord, false);
    
    rec.type = "button";
    
    rec.addEventListener("click", setDelete, false);
    
    if (deleteMode == "false") {
        del.value = "RECORD";
        rec.value = "Delete";
    }
    else if (deleteMode == "true") {
        del.value = "Record";
        rec.value = "DELETE";
    }
    
    div.appendChild(del);
    div.appendChild(rec);
    
    xpathCC[0].parentNode.appendChild(div);
}


function processHOF() {
    var xpathCC = $("td.contentcontent tr");
    var plist = [];
    var page = xpathCC[0].childNodes[5].firstChild.nodeValue;
    
    var deleteMode = window.localStorage.getItem('delete') || 'false';
    
    for (var i = 1; i < xpathCC.length; i++) {
        var current = xpathCC[i];
	
        // Check to see if there's a faction

        try {
            if (current.childNodes[3].firstChild == 
                '[object HTMLSpanElement]') {
                var pid = current.childNodes[3].firstChild.firstChild.search;
            }
            else if (current.childNodes[3].childNodes[2] == 
                     '[object HTMLSpanElement]') {
                var pid = current.childNodes[3].childNodes[2].firstChild.search;
            }
            else {
                var pid = current.childNodes[3].childNodes[2].search;
            }
        }
        catch (err) {
            var pid = current.childNodes[3].firstChild.search;
        }
        
        // Get the rank number
        var rank = current.childNodes[1].firstChild.nodeValue;
	
        //Check to see if this id is already in the list
	
        if (plist.indexOf(pid) == -1) {
            plist[plist.length] = pid;
        }
        plist[pid] = {level : 0,
                      stats : 0};
	
        // Check which HoF page we're on and assign to
        // the correct object memeber
        if (page == "Level") {
            plist[pid].level = rank;
        }
        else if (page == "Total Stats") {
            plist[pid].stats = rank;
        }
    }
	
    for (var i = 1; i < plist.length;i++) {
        var obj = stringToPlayerObj(window.localStorage.getItem(plist[i]) || '0,0');
        if (plist[plist[i]]) {
            var entry = integrateObjs(plist[plist[i]], obj);
        }
        else {
            var entry = obj;
        }
        
        if (deleteMode == 'false') {
            window.localStorage.setItem(plist[i], entry.level + ',' + entry.stats);
        }
        else if (deleteMode == 'true') {
            window.localStorage.removeItem(plist[i]);
        }
    }
}

function displayHOF() {
    var bioHTML = $('div#bioT')[0];
    var pid = $('div#nameT')[0].lastChild.search;
    var mypid = $('a.textstatsbox')[0].search;
    
    var pStats = (window.localStorage.getItem(pid) || '0,0').split(',');
    bioHTML.innerHTML = bioHTML.innerHTML + "<br>HoF Rankings: Level " +
        pStats[0] + " Stats " + pStats[1];
    
}

function evalSearchPage() {
    
    var searchResults = $("td.contentcontent tr[valign='middle']");
    
    var selfID = $("div.stats_box_in")[0].childNodes[1].search;
    var selfData = (window.localStorage.getItem(selfID) || '0,0').split(',');
    
    for (var i = 0; i < searchResults.length; i++) {
	
        var current = searchResults[i].childNodes[1];

        if (document.title == "Star Pirates") {
            var levelTD = searchResults[i].childNodes[3].firstChild;
        }
        else if (document.title == "Spy Battle") {
            var levelTD = searchResults[i].childNodes[3].firstChild;
        }

        if (current.firstChild.pathname == "/profiles.php") {
            var pid = current.firstChild.search; //for non-noto/fleet
        }
        else if (current.firstChild.pathname == "/viewgang.php") {
            if (!current.childNodes[2].search) {
                var pid = current.childNodes[2].firstChild.search;
                // for noto with fleet
            }
            else {
                var pid = current.childNodes[2].search; 
                //for non-noto + fleet
            }
        }
        // Continue for
        var pData = (window.localStorage.getItem(pid) || '0,0').split(',');
        if (pData[1] === 0) {
            var target = "Who knows?";
        }
        else if (pData[1] <= 3) {
            var target = "Suicide";
        }
        else if (selfData[1] + 100 <= pData[1]) {
            var target = "Splendiferous";
        }
        else if (selfData[1] - 100 >= pData[1]) {
            var target = "Crazy Talk";
        }
        else if (selfData[1] <= pData[1]) {
            var target = "Alright";
        }
        else if (selfData[1] >= pData[1]) {
            var target = "Unwise";
        }
	
        levelTD.nodeValue = levelTD.nodeValue + " " + target;
	
    }
}

var URL = document.URL;

if (document.title == "Star Pirates") {
    var PI = "SP";
}
else if (document.title == "Spy Battle") {
    var PI = "SB";
}

if (URL.indexOf('halloffame') != -1) {
    setUpRecord();
    processHOF();
}
else if (URL.indexOf('profiles') != -1) {
    displayHOF();
}
else if (URL.indexOf('search') != -1) {
    evalSearchPage();
}
