// ==UserScript==
// @name           Fleet Splats on People
// @namespace      tag: earthlingzephyr@gmail.com,2009-11-01:FDR/Fleet_Splats
// @description    Shows fleet members splats on other players.
// @include        http://www.starpirates.net/gangattacklog.php*
// @include        http://www.starpirates.net//gangattacklog.php*
// @include        http://www.starpirates.net///gangattacklog.php*
// ==/UserScript==
GM_log("Does anything work?");

function strToArr(stringtobe)
{
    GM_log('strToArr called');
    GM_log('stringtobe '+stringtobe);
    // regexp that matches everything except the spaces (or comma-space)
    // delimiting the list (in the string).
    var listPattern = /[^, | ]+/g;
    GM_log('gaveback a list');
    return stringtobe.match(listPattern);
}

function isInList(item, list)
{
    GM_log('isInList called');
    for (var i = 0; i < list.length; i++)
	{
	    if (list[i] == item)
		{
		    GM_log('isList');
		    return true;
		}
	}
    GM_log('isNotList');
    return false;
}

function timeToArr(time)
{
    GM_log('timeToArr called');
    GM_log('time is: '+time);
    // Turn a time string into an array
    var timeObj = [];
    var time_re = /\d+/g;
    return timeObj.concat(time.match(time_re));
}

function insertHTML(place, html)
{
    GM_log('insertHTML started');
    GM_log('place: '+place);
    GM_log('html: '+html);
    // Pre get a location and a string of html
    // Post return a reference to the topmost bit of html in the string
    // and insert the html into the page

    var dummyNode = document.createElement('div');
    dummyNode.innerHTML = html;
    return place.parentNode.appendChild(dummyNode);
}


function isOlder(older, younger)
{
    // test relative ages of two time stamp strings
    // function returns true if variables are named 'correctly'
    GM_log('older time = '+older);
    var old = timeToArr(older);
    var young = timeToArr(younger);
    GM_log('old '+old);
    GM_log('young '+young);
    for (var i = 0; i < old.length; i++)
	{
	    if (old[i] > young[i])
		{
		    GM_log('isOlderFalse');
		    return false;
		}
	}
    GM_log('isOlder true');
    return true;
}

function tdToObject(td)
{
    GM_log('tdToObj called');
    // Preconditions
    // Postconditions

    var nodeList = td.childNodes;
    for (var i = 0; i < nodeList.length; i++)
	{
	    if (!splat_re_data.test(nodeList[i].href))
		{
		    var tempNode = nodeList[i].childNodes;
		    for (var j = 0; j < tempNode.length; j++)
			{
			    if (splat_re_data.test(tempNode[j].href))
				{
				    GM_log(tempNode[j].href);
				    return tempNode[j].href.match
					(splat_re_data)[1];

				}
			}
		}
	    else
		{
		    GM_log(nodeList[i].href);
		    return nodeList[i].href.match(splat_re_data)[1];
		}
	}
}

function trToObject(tr)
{
    GM_log('trToObj called');
    // Pre tr.nodeName == tr element containing an attack event
    // Post returns a keyed array with parameters: 
    // time, attacker, defender, winner
    var nodeList = tr.childNodes;
    var rowObject = [];
    GM_log('typeof tdToObject() '+typeof tdToObject(nodeList[1]));
    GM_log('return value of tdToObj+" "'+tdToObject(nodeList[1])+' ');
    rowObject.time = nodeList[0].firstChild.nodeValue;
    rowObject.attacker = tdToObject(nodeList[1])+' ';
    rowObject.defender = tdToObject(nodeList[2])+' ';
    rowObject.winner = tdToObject(nodeList[3])+' ';
    GM_log(rowObject.winner);
    return rowObject;

}

function readEventLog(contestList)
{
    GM_log('readEventLog started');
    // Preconditions maybe: timestamp in form: yyyy-mm-dd hh:mm:ss
    // use event_xpath to get a list of tr elements
    // Postconditions return a list of data objects with properties:
    // time, attacker, defender, winner
    var event_xpath = '/html/body/div/div/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr/td[@class="contentcontent"]/table/tbody/tr';
    // Get the event row objects.
    var eventLog = document.evaluate(event_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var objectList = [];
    // Skip the first and the last two results, they are a header and the bottom
    // row quick link buttons.
    for (var i = 1; i < eventLog.snapshotLength-2; i++)
	{
	    // Grab an easy reference to the current node being looked at
	    var node = eventLog.snapshotItem(i);
	    // Add it to the list of objects after trToObject parses it
	    objectList.push(trToObject(node));
	}

    GM_log('objectList '+objectList.toString());
    var fltObjList = [];
    // Now look at the whole parsed row object list and decide which ones
    // we should keep.
    for (var i = 0; i < objectList.length; i++)
	{
	    // Handy reference
	    var curEvent = objectList[i];
//	    GM _log('curevent '+curEvent.attacker);
// 	    GM_log('def '+curEvent.defender);
// 	    GM_log('winner '+curEvent.winner);
// 	    GM_log('contest list '+contestList);
//	    GM_log('isInList '+isInList(curEvent.winner, contestList));
	    // If attacker(fleetmember) didn't win, it's not a splat
	    // it's also not a splat if the winner isn't in the contestList
            if ((curEvent.defender == curEvent.winner) && isInList(curEvent.winner,contestList))
		{
		    // Might be a splat keep it.
		    // Check it's time stamp against our last recorded newest 
		    // one though to make sure it's not being double counted
		    // is older should return true (as in the timelog is older
		    // than this current event
		    GM_log('splatmaybe '+curEvent.time);
		    GM_log('timelog '+GM_getValue('timeLog'));
		    if (isOlder(GM_getValue('timeLog', curEvent.time),curEvent.time))
			{
			    fltObjList.push(objectList[i]);
			    var curTimeStamp = GM_getValue('curTimeStamp', '');
			    GM_log('currentTimeStamp '+curTimeStamp);
			    if (!curTimeStamp) // log if NO stamp exists
				{
				    GM_log('curEvent.time '+curEvent.time);
				    GM_setValue('curTimeStamp', curEvent.time);
				}
			}
		}
	}
    GM_log('eventlogobjects'+fltObjList.toString());
    //GM_log(fail);
    return fltObjList;
}

function incSplatter(splatter, splattee, splatterList)
{
    GM_log('incSplatter called');
    // Precon get the UID of a splatter, and increment their splats on 
    // the splattee in the splatterList
    // Postcon return nothing, but change the splatterList in place
    GM_log('splattertype '+typeof splatter);
    GM_log('splatteetype '+typeof splattee);
    GM_log('spatterList[splatter] '+splatterList[splatter]);
    if (!splatterList[splatter])
	{
	    GM_log('splatterList[splatter] should now exist');
	    splatterList[splatter] = [];
	    GM_log(typeof splatterList[splatter]);
	}
    if (splatterList[splatter][splattee])
	{
	    GM_log('Next we should go here');
	    splatterList[splatter][splattee]++;
	}
    else
	{
	    GM_log('or at least here');
	    splatterList[splatter].push(splattee);
	    splatterList[splatter][splattee] = 1;
	    GM_log(splatterList[splatter]);
	    GM_log(splatterList[splatter][0]);
	    GM_log('last splatterlist value '+splatterList[splatter][splattee]);
	}
}

function countSplatter(splatList)
{
    GM_log('countSplatter called');
    // Pre object list of potential splats
    // Post return a list of unique splatter's with their id being an
    // index in the same list to get a list of their splats on each splattee
    GM_log(splatList.length);
    GM_log(splatList[0]);
    var splatterList = [];
    for (var i = 0; i < splatList.length; i++)
	{
	    GM_log('incountSplatter i = '+i);
	    GM_log('typeof splatlist ='+
typeof splatList);
	    if (!isInList(splatList[i].attacker, splatterList))
		{
		    splatterList.push(splatList[i].attacker);
		}
	    GM_log('splatList[i].attacker '+splatList[i].attacker);
	    incSplatter(splatList[i].attacker, splatList[i].winner, splatterList);
	}
    GM_log('ending splatterlist '+splatterList);
    return splatterList;


}

function countSplattee(splatList)
{
    GM_log('countsplattee called');
    // Pre splatList is the sorted list of all possible splats.
    // Post returns an indexed and ordered array.  The values in the ordered
    // portion give access to the corresponding index.
    // The values in this list are the unique player id numbers and the
    // total number of splats on that player.
    GM_log('splatlist = '+splatList);
    GM_log('splatlist 0 is: '+splatList[0].attacker);
    GM_log('splatList.length = '+splatList.length);
    var splatteeList = new Array();
    for (var i = 0; i < splatList.length; i++)
	{
	    GM_log('in countSplattee i = '+i);
	    GM_log('splatList[i].winner = '+splatList[i].winner);
	    if (!isInList(splatList[i].winner, splatteeList))
		{
		    GM_log('Does this ever get called?');
		    GM_log('splatList[i].winner before '+splatList[i].winner);
		    GM_log('typeof splatList[i].winner'+typeof splatList[i].winner);
		    GM_log('splatteeList.length before'+splatteeList.length);
		    splatteeList.push(splatList[i].winner);
		    splatteeList[splatList[i].winner] = 1;
		    GM_log('splatteelist[0] '+splatteeList[0]);
		    GM_log('splatteeList[last]'+splatteeList[splatteeList.length-1]);
		    GM_log('splatList[i].winner '+splatList[i].winner);
		    GM_log('splatteeList.length '+splatteeList.length);
		}
	    else
		{
		    GM_log('how many times is the else called?');
		    splatteeList[splatList[i].winner]++;
		    GM_log(splatteeList[splatList[i].winner]);
		}
	    GM_log('endloop');
	}
    GM_log('ending splatteelist '+splatteeList[splatteeList[0]]);
    return splatteeList;
}

function getNextPage(number)
{
    // An alternative to getAllPages, this is the equivalent of an iterator/
    // generator in python.  Doesn't call the next page to load until the
    // current one has loaded.  Needs some method to kill the current requester
    return;
}

function getAllPages()
{
    // This is currently really ugly
    // Send httprequests and insert the other pages data.
    var tempreq = [];
    var whileswitch = true;
    var ifswitch = false;
    for (var i = 1; i < 50; i++)
	{
	    tempreq[i] = new XMLHttpRequest();
	    tempreq[i].open("GET", 'gangattacklog.php?PAGE='+i, true);
	    tempreq[i].onreadystatechange = function()
	    {
		if (tempreq[49].readyState == 4)
		    {
			if (tepmreq[49].status == 200 || tempreq[49].status == 304)
			    {
				// Set while if variable to proceed
				ifswitch = true;
			    }
			else
			    {
				GM_log(''+i+'page request failed');
			    }
		    }
	    };
	    tempreq[i].send('');
	}
    while (whileswitch)
	{
	    if (ifswitch)
		{
		    // This should only fire once all the page data has loaded
		    for (var i = 0; i <tempreq.length; i++)
			{
			    insertHTML(document.body, tempreq[i].responseText);
			}
		    whileswitch = false;
		}
	}
}
	    
function unpack(packedList)
{
    GM_log('unpack called');
    GM_log('packedList is '+packedList);
    GM_log('packedList[0] is '+packedList[0]);
    GM_log('typeof first item '+typeof packedList[0]);
    GM_log('firstitem in packed list '+packedList[0]);
    GM_log('index of firstitem '+packedList[packedList[0]]);
    // Pre 
    // Post returns the data of the list it's handed in an nicer format for 
    // accessing
    // Returns a list of list/objects with either two or three values
    var easyRead = new Array();
    for (var i = 0; i < packedList.length; i++)
	{
	    GM_log('unpack loop called');
	    GM_log('type of packedList[packedList[i]] '+typeof packedList[packedList[i]]);
	    if (typeof packedList[packedList[i]] == 'number')
		{
		    GM_log('unpack if is true');
		    easyRead.push(new Array(packedList[i], packedList[packedList[i]]));
		    GM_log('return a two list');
		}
	    else if (typeof packedList[packedList[i]] == 'object')
		{
		    GM_log('or double unpack...');
		    easyRead.push(new Array(packedList[i], unpack(packedList[packedList[i]])));
		    GM_log('return a three list');
		}
	}
    GM_log('unpack exits without doing anything');
    GM_log('unpack contents'+easyRead);
    return easyRead;
}

function handleSubmit(event)
{
    // Kicks off the entire functional part of the script
    GM_log('handleSubmit Started');
    event.preventDefault();
    // Clean up the form
    var form = document.getElementById('formfield');
    var userList = strToArr(form.firstChild.value);
    if (!userList)
	{
	    alert("No names in contest form.  Aborting.");
	}
    else
	{
	    for (var i = 0; i < userList.length; i++)
		{
		    userList[i] = userList[i]+' ';
		}
	    form.firstChild.value = '';
	    GM_log('handlesubmit -> main.body');
	    main.body(userList);
	}
}

function isInGMKey(key, value)
{
    GM_log('isInGMKey called');
    // Given a value, see if it's contained within the GM key
    // only can return true if the key has a GM value in list form
    var valList = GM_getValue(key, false);
    GM_log('valList '+valList);
    if (typeof valList == 'string' && !valList == '')
	{
	    GM_log('turn string into list');
	    return isInList(key, strToArr(valList));
	}
    return false;
}

function setOrIncGMKey(key)
{
    GM_log('setOrIncGMKey called');
    // take a string, see if it's a GM key already, if so increment
    // otherwise create it with value 1
    var setOrInc = GM_getValue(key, false);
    GM_log('key '+key);
    GM_log('keyvalue '+setOrInc);
    if (setOrInc)
	{
	    GM_setValue(key, setOrInc+1);
	    //GM_log(setorinctrue);
	}
    else
	{
	    GM_setValue(key, 1);
	    //GM_log(setorincfalse);
	}
    GM_log('setorInc exits');
}

function logSplats(unpacked)
{
    GM_log('logsplats started');
    GM_log('unpacked type: '+typeof unpacked);
    // Get a list of splat counts (from unpack), check the script storage 
    // log for that index
    // if it doesn't exist, add it in the appropriate format
    // else, combine lifetime totals with current list
    // Also, log a list of all players whose splats are being tracked so their
    // logged data can be deleted by deleteLog
    if (!GM_getValue('uidlog', false))
	{
	    GM_log('set uidlog in GMValues');
	    GM_setValue('uidlog', '');
	    GM_log(fail);
	}
    for (var i = 0; i < unpacked.length; i++)
	{
	    GM_log('logsplats loop');
	    if (unpacked[i].length == 2)
		{
		    var tempKey = unpacked[i][0];
		    GM_log('tempKey: '+tempKey);
		    GM_log('tempKeytype '+typeof tempKey);
		    setOrIncGMKey(tempKey, unpacked[i][1]);
		    GM_log('setOrInc successful. Check if name is in uidlog');
		    if (!isInGMKey('uidlog', unpacked[i]))
			{
			    GM_log('is it this value?');
			    GM_log('tempKey again '+tempKey);
			    GM_log('tempKeytype '+typeof tempKey);
			    //GM_setValue('uidlog', tempKey);
			    GM_log(!isInGMKey);
			}
		}
	    else if (unpacked[i].length == 3)
		{
		    var tempKey = unpacked[i][0]+' '+unpacked[i][1];
		    setOrIncGMKey(tempKey, toString(unpacked[i][2]));
		    if (!isInGMKey('uidlog', unpacked[i]))
			{
			    GM_log('or is it this value?');
			    GM_log('tempKey again '+tempKey);
			    GM_log('tempKeytype '+typeof tempKey);
			    GM_setValue('uidlog', tempKey);
			    GM_log(length3fail);
			}
		}
	}
    GM_setValue('timeLog', GM_getValue('curEventLog'));
    GM_log(fail);
    GM_log('end logsplats');
}




function readLog()
{
    // Return log data in 2d array
    var uidLog = GM_getValue('uidlog', null);
    var returnList = [];
    if (uidLog === null)
	{
	    return uidLog;
	}
    else
	{
	    var uidArr = strToArr(uidLog);
	    for (var i = 0; i < uidArr.length; i++)
		{
		    returnList.push(GM_getValue(uidArr[i]));
		}
	}
    return returnList;
}

function deleteLog()
{
    // Reset all player totals
    return;
}

function addTableEl(col1, col2)
{
    GM_log('addTableEl called');
    return '<tr><td>'+col1+'</td><td>'+col2+'</td></tr>';
}

function displayResults()
{
    GM_log('displayResults called');
    // Display the results from the log
    var logData = readLog();
    var insertTable = '';
    for (var i = 0; i < readLog.length; i++)
	{
	    GM_log('displayLoop called');
	    insertTable = insertTable + addTableEl(logData[i][0], logData[i][1]);
	}

    insertTable = '<tbody>' + insertTable + '</tbody>';
    insertTable = '<table>' + insertTable + '</table>';
    var contestForm = document.getElementById('formfield');
    GM_log('insertTable value: '+insertTable);
    insertHTML(contestForm, insertTable);
}


var content_xpath = '//td[@class="contentcontent"]';

var formContent = '<form id=\'formfield\' name=\'input\' action=\'\'><input type="text"><br /><input type="submit" value="Submit Contest Names" /></form>';

var splat_re_data = /profiles.php\?id=([0-9]+)/;

var newPage_re1 = /(^(.|\n|\r)+<\/script>)/g;
var newPage_re2 = /<\/body>(.|\n|\r)+$/g;

var main = 
{
    init: function()
    {
	var contentList = document.evaluate(content_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var contentBlock = contentList.snapshotItem(1);
	
	var contestForm = insertHTML(contentBlock.parentNode, formContent);
	contestForm.addEventListener('submit', handleSubmit, false);
	GM_log('contestForm up');
	// From here, it's up to the event listener, handleSubmit, to kick
	// off the rest of the functionality of the script.
    },

    body: function(contestList)
    {
	// the actual meat of the script, called by handleSubmit
	//	getAllPages();
	var eventLog = readEventLog(contestList);
	if (eventLog.length > 0)
	    {
		alert("No splats on contest names.  Try other names.");
	    }
	else
	    {
		GM_log('event log'+eventLog);
		var splatterlist = countSplatter(eventLog);
		GM_log('event log'+eventLog);
		var splatteelist = countSplattee(eventLog);
		GM_log('splatteelist  '+typeof splatteelist[splatteelist[0]]);
		GM_log('splatterlist  '+typeof splatterlist[splatterlist[0]]);
		GM_log('splatterlist  '+typeof splatterlist[0]);
		logSplats(unpack(splatterlist));
		logSplats(unpack(splatteelist));
		displayResults();
	    }
    }
};
GM_log("whole thing checks");
main.init();