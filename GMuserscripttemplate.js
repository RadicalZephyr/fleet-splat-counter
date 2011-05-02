// ==UserScript==
// @name           Stats Forum Helper
// @namespace      tag: earthlingzephyr@gmail.com,2010-03-08:StatsForumHelper
// @description    Collate Data From Stats forum Posts
// @include        http://the-academy.forummotion.com/academic-records-f13/current-stats-t10.htm
// ==/UserScript==

// Add jQuery
var GM_JQ = document.createElement('script');
GM_JQ.src = 'http://jquery.com/src/jquery-latest.js';
GM_JQ.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(GM_JQ);


// Check if jQuery's loaded
function GM_wait() {
    if(typeof unsafeWindow.jQuery == 'undefined') { window.setTimeout(GM_wait,100); }
    else { $ = unsafeWindow.jQuery; letsJQuery(); }
}
GM_wait();

// All your GM code must be inside this function
function letsJQuery() {

    function printallmembers( obj ) {
	var str = '';
	for( var memb in obj )
	    if (memb != 'unique') {
		str += memb + ' = ' + obj[memb] + '\n'; 
	    }
	return str;
    }

}