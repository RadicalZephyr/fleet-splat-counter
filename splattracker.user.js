// ==UserScript==
// @name           Splat Tracker
// @namespace      http://www.wordowl.com/misc/
// @description    Tracks splats based on event log
// @include        http://www.starpirates.net/events.php
// @include        http://www.starpirates.net//events.php
// @include        http://www.starpirates.net///events.php
// ==/UserScript==

// Creates the div element to insert the results into
var results = document.createElement("div");
// Sets ID so it's easily retrievable
results.setAttribute("id", "splat_results");
// Adds it to the actual page
document.body.appendChild(results);

// Initialize xpath and regular expression variables for reading event info
var eventlist = xpath("//tr/td[@colspan='3']|//td[@class='textm']");
var timestamp_re = /(January|February|March|April|May|June|July|August|September|October|November|December) ([0-9]{1,2}), (20[0-9]{2}) (1?[0-9]):([0-5][0-9]):([0-5][0-9])(am|pm)/;
var splat_re_match = /You gained ([0-9]+) experience/;
var splat_re_data = /profiles.php\?id=([0-9]+)[^>]+>([^<]+)/;

var months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

var lasttype = 1; // not timestamp
var output = "", timestamp = "";

// Retrieve various stored data
var lasthittimestamp = GM_getValue("LastStamp", "t19700101000001");

var lastrefresh = GM_getValue("lastrefresh", "t19700101000001");
var highestid = GM_getValue("HighestID", 1);
var lowestid = GM_getValue("LowestID", 0);

var newtimestamp = "t19700101000001";

var newsplats = 0;

for( var i = 0; i < eventlist.snapshotLength; i++ ) 
    {
	if(timestamp > newtimestamp) 
	    { 
		newtimestamp = timestamp; 
	    }

	if(lasttype == 0) 
	    {
		// the last one was a timestamp, look for player name
		// but first, was the last time stamp we took (last cycle) higher than our 'last recording was made' time?
		// if so, process, if not we're done, since the other events are older than the one we've just done.
		if(timestamp > lasthittimestamp) 
		    {
			var thisevent = eventlist.snapshotItem(i);
			var html = thisevent.innerHTML.replace(/[\xA0\x20\r\n\s]+/mg, " ");
					
			if(splat_re_match.test(html)) {
				var result = html.match(splat_re_data);
				if(result != null) {
					var playerid = parseInt(result[1]);
					var playername = result[2];
					output += "player id " + playerid + "\n";
					output += "player name " + playername + "\n";
				}
				// check to see if this id is in the range of 
				// players to check
				if(playerid > highestid) {
					highestid = playerid;
					if(lowestid == 0) { lowestid = playerid; }
				}
				// Same for lower bound
				if(playerid < lowestid) {
						lowestid = playerid;
				}
				
				var playerdetails = GM_getValue("Splat"+playerid, "0");
				var playerhits = parseInt(playerdetails);
				
				//playertimestamp = playerdetails.substr
				// (String(playerhits).length + 1, 15);
				
				
				if(lasthittimestamp < timestamp) {
				    // increment player hits
				    playerhits++;
				    playerstring = playerhits + "," + playername;
				    GM_setValue("Splat"+playerid, playerstring);
					
				    output += playerstring + "\n";
				    output += "event was successful";
				    newsplats++;
				}

			}
		
		} else {
			break;

		}
		
		lasttype = 1;
	} else {
		// last one was not timestamp, look for timestamp
	    // What type of 
		output = ""; // clear result
		var thisevent = eventlist.snapshotItem(i);
		GM_log(thisevent.nodeName);
		var html = thisevent.innerHTML;
		// look in the html for... ?
		html = html.replace(/\s+/g, " ");
		var tresult = html.match(timestamp_re);
		if(tresult != null) {
			timestamp = "t" + tresult[3];
			for ( var j = 0; j < 12; j++) {
				if(months[j] = tresult[1]) {
					var numstr = ("0" + String(j+1));
					timestamp += numstr.substr(numstr.length - 2);
					break;
				}
			}
			numstr = ("0" + String(tresult[2]));
			timestamp += numstr.substr(numstr.length - 2);
			
			var hour = parseInt(tresult[4]);
			if(tresult[7] == "pm") {
				hour += 12;
			}
			if(hour == 12) {
				// 12..am, reset to 0
				// 12..pm, reset to 12 (after the above pushes it to 24!)
				hour -= 12;
			}
			numstr = ("0" + String(hour));
			timestamp += numstr.substr(numstr.length - 2) + tresult[5] + tresult[6];
			
			/*
			tresult[1] = month
			tresult[2] = day
			tresult[3] = year
			tresult[4] = 12-hour hour
			tresult[5] = minute zero padded
			tresult[6] = second zero padded
			tresult[7] = am/pm
			*/
			var output = "event at ";
			output += timestamp + "\n";
			
			for ( var j = 1; j <= 6; j++) {
				output += tresult[j] + " ";
			}
			output += "\n";

		}
		lasttype = 0;
	}
}
GM_setValue("HighestID", highestid);
GM_setValue("LowestID", lowestid);

var newoutput = document.createElement("div");
newoutput.setAttribute('style', 'margin-top:4px;');
var newhtml = "";
	
if (newsplats > 0) {
	if (newsplats == 1) {
		newhtml = "1 new splat";
	} else {
		newhtml = newsplats + " new splats";
	}
} else {
	newhtml = "No new splats";
}

var timestring = months[ parseInt(lastrefresh.substr(5,2)) - 1 ] + " " + lastrefresh.substr(7,2) + " " + lastrefresh.substr(1,4) + ", ";
var hour = parseInt(lastrefresh.substr(9,2));
var suffix = "";
if(hour == 0) {
	hour = 12; suffix = "am";
} else {
	if(hour > 12) {
		hour -= 12;
		suffix = "pm";
	} else {
		if(hour == 12) {
			suffix = "pm";
		} else {
			suffix = "am";
		}
	}
}
timestring += hour + ":" + lastrefresh.substr(11,2) + ":" + lastrefresh.substr(13,2) + suffix;

if(lastrefresh > "t1971") {
	newhtml += ' &nbsp; <a style="cursor:pointer;" onclick="javascript:displayresults();">See splats since ' + timestring + '</a>';
} else {
	newhtml += ' &nbsp; <a style="cursor:pointer;" onclick="javascript:displayresults();">See all splats</a>';
}

	
newoutput.innerHTML = newhtml;
	
var a = xpath("//a[@class='button']");
if(a.snapshotLength > 0) {
	var aitem = a.snapshotItem(0);
	aitem.parentNode.appendChild(newoutput);
	// need to append newoutput as an appendChild() based off aitem.parentNode
} else {
	var td = xpath("//td[@class='contentcontent']");
	for( i = 0; i < td.snapshotLength; i++) {
		var item = td.snapshotItem(i);
		if(item.innerHTML == "Event log empty.") {
			item.parentNode.appendChild(newoutput);
			break;
		}
	}
}


	

if(newtimestamp > "t19700101000001") {
	GM_setValue("LastStamp", newtimestamp);
}

function xpath(query) {
    return document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}

unsafeWindow.resetstats = function() {
	window.setTimeout(function() {
	
	var dothis = confirm("Are you sure you want to reset stats?");
	if(dothis == true) {
	
	var highestid = GM_getValue("HighestID", 1);
	var lowestid = GM_getValue("LowestID", 0);
	GM_setValue("HighestID", 1);
	GM_setValue("LowestID", 0);
	for (i = lowestid; i <= highestid; i++) {
		var idrequest = "Splat" + i;
		var details = GM_getValue(idrequest, "0");
		if(details != "0") {
			var splats = parseInt(details);
			var playername = details.substr(String(splats).length + 1);
			GM_setValue(idrequest, "0,"+playername);
		}
	}
	GM_setValue("lastrefresh", GM_getValue("LastStamp", "t19700101000001"));
	alert("Values have been reset!");
	
	}
	
	}, 0);
	
	
}

unsafeWindow.displayresults = function() {
	
	window.setTimeout(function() {
	
	var finaloutput = '<div style="text-align:right;"><a style="cursor:pointer; font-size:120%;" onclick="javascript:document.getElementById(\'splat_results\').style.display = \'none\';">Close this window</a>&nbsp;</div>';
	finaloutput += '<div style="text-align:center;">';
	if(lastrefresh > "t19700101000001") {
		finaloutput += 'Splats since ' + timestring;
	} else {
		finaloutput += 'All splats<br>';
	}
	finaloutput += '</div>';
	
	// note this *will* get slower to load the events page once you get to a certain point since it has to
	// examine every id between the highest and lowest known ids (better than examining every id from 1 to 27k anyway)
	// key is to reset occasionally
	finaloutput += '<table><tr><th>Player</th><th>Splats</th></tr>';
	var playerstats = new Array();
	var orderedstats = new Array(); var playerlookup = new Array();
	for(i = lowestid; i <= highestid; i++) {
		var idrequest = "Splat" + i;
		var details = GM_getValue(idrequest, "0");
		if(details != "0") {
			var splats = parseInt(details);
			if(splats > 0) {
				playerstats[i] = details;
				var playername = details.substr(String(splats).length + 1);
				playerlookup[playername] = i;
				orderedstats[i] = playername;
			}
		}
	}
	orderedstats.sort( function(a,b) { return a.localeCompare(b); } );
	for(var playermixedid in orderedstats) {
		playername = orderedstats[playermixedid];
		i = playerlookup[playername];
		splats = parseInt(playerstats[i]);
		finaloutput += '<tr><td><a href="http://www.starpirates.net/profiles.php?id=' + i + '">' + playername + '</a></td><td>' + splats + '</td></tr>';
	}

	finaloutput += '</table><br><br>';
	finaloutput += '<a href="javascript:resetstats();">Reset stats</a>';
	
	var results = document.getElementById('splat_results');
	results.setAttribute("style", "position:absolute; display:block; top:75px; left:50px; z-index:50; padding:10px; width:400px; height:400px; overflow-y:scroll; border:1px solid #FFCC00; background-color:black;");
	
	results.innerHTML = finaloutput;
	
	}, 0);
}

function mysort(a,b) {
	return a.localeCompare(b);
}