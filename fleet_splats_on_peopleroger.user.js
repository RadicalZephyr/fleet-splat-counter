// ==UserScript==
// @name           Fleet Splats on People
// @namespace      SP_Tools/Fleet_Splats
// @description    Shows fleet members splats on other players.
// @include        http://www.starpirates.net/gangattacklog.php*
// @include        http://www.starpirates.net//gangattacklog.php*
// @include        http://www.starpirates.net///gangattacklog.php*
// ==/UserScript==

var linkStyle = "white-space:nowrap;font-size:11px;margin:2px;border:solid 1px #FFFFFF;padding:3px;color:#FFFFFF;background-color:#333333;background-image:none;";


var m_ListNode = null;

function GetListNode() {
    if (null != m_ListNode) {
        return m_ListNode;
    }
    var content_xpath = '//td[@class="contentcontent"]';
    var contentList = document.evaluate(content_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var contentBlock = contentList.snapshotItem(1);

    var nRoot = contentList.snapshotItem(0);

    if (null == nRoot) {
        alert("No root node");
        return null;
    }
    if (null == nRoot.firstChild) {
        alert("No detail table");
        return null;
    }
    if (null == nRoot.firstChild.rows) {
        //this second look up is because when in the yard, the regen message is in a div at position 0
        nRoot = contentList.snapshotItem(1);
        if (null == nRoot) {
            alert("No root node");
            return null;
        }
        if (null == nRoot.firstChild) {
            alert("No detail table");
            return null;
        }
        if (null == nRoot.firstChild.rows) {
            alert("No detail table rows");
            return null;
        }
    }
    m_ListNode = nRoot.firstChild;
    return m_ListNode;
}

function SetUpOptions() {
    try {
        //1. Get place to put buttons/forms
        var nRoot = GetListNode();
        if (null == nRoot) {
            return;
        }
        nRoot = nRoot.parentNode;
        if (null == nRoot) {
            return;
        }

        var link = null;
        if (GM_getValue("Trace_Running", false)) {
            var txt = "";
            var profileIDs = GM_getValue("TraceIDs", "");
            if (profileIDs.length > 0) {
                var profileIDs = profileIDs.split(",");
                for (var i = 0; i < profileIDs.length; i++) {
                    txt += profileIDs[i];
                    txt += " after ";
                    txt += GM_getValue("Trace_LastDate_" + profileIDs[i], "EVER");
                    txt += "<br />";
                }
            }
            link = document.createElement("span");
            link.setAttribute("style", "font-size:11px;font-weight:normal;margin:3px;");
            link.innerHTML = txt;
            nRoot.insertBefore(link, nRoot.firstChild);
        }
        
        link = document.createElement("span");
        link.textContent = "Show Last Results";
        link.addEventListener("click", ShowLastResults, false);
        link.setAttribute("style", linkStyle);
        nRoot.insertBefore(link, nRoot.firstChild);

        link = document.createElement("span");
        link.textContent = "Finish Trace";
        link.addEventListener("click", FinishTrace, false);
        link.setAttribute("style", linkStyle);
        nRoot.insertBefore(link, nRoot.firstChild);

        link = document.createElement("span");
        link.textContent = "Start New Trace";
        link.addEventListener("click", StartNewTrace, false);
        link.setAttribute("style", linkStyle);
        nRoot.insertBefore(link, nRoot.firstChild);

    } catch (e) {
        alert("Failed Setup: " + e);
    }
}

function ProcessCurrentPage() {
    try {
        var profileIDs = GM_getValue("TraceIDs", "");
        if (profileIDs.length < 1) {
            alert("No profiles selected");
            return;
        }
        var profileIDs = profileIDs.split(",");
        var tbl = GetListNode();
        if (null == tbl) {
            alert("No details node");
            return;
        }
        var results = new Object();
        for(var i = 0; i < profileIDs.length;i++) {
            results[profileIDs[i]] = ParseResults(GM_getValue("Trace_CurrentResults_" + profileIDs[i], ""));
        }
        
        //Skip first row, it has headings
        for (var i = 1; i < tbl.rows.length; i++) {
            var r = tbl.rows[i];
            if (null != r) {
                if (null != r.cells) {
                    if (r.cells.length > 4) {
                        var dt = r.cells[0].innerHTML; //Date
                        var att = GetProfileID(r.cells[1].innerHTML);
                        var def = GetProfileID(r.cells[2].innerHTML);
                        var win = GetProfileID(r.cells[3].innerHTML);
                        var p = MatchesProfile(def, profileIDs);
                        if (null == p) {
                            r.setAttribute("style", "background-color:#333333;" + r.getAttribute("style"));
                        } else {
                            var dtm = GM_getValue("Trace_CurrentDate_" + p, "");
                            if (dtm < dt) {
                                GM_setValue("Trace_CurrentDate_" + p, dt);
                            }
                            dtm = GM_getValue("Trace_LastDate_" + p, "");
                            if (dtm < dt) {
                                //Want this one
                                var o = new Object();
                                o.Time = dt;
                                o.Attacker = att;
                                o.Defender = def;
                                o.Winner = win;
                                if (MergeResults(results[p], o)) {
                                    r.setAttribute("style", "background-color:#996666;" + r.getAttribute("style"));
                                } else {
                                    r.setAttribute("style", "background-color:#669966;" + r.getAttribute("style"));
                                }
                            } else {
                                r.setAttribute("style", "background-color:#666666;" + r.getAttribute("style"));
                            }
                        }
                    }
                }
            }
        }
        for (var i = 0; i < profileIDs.length; i++) {
           GM_setValue("Trace_CurrentResults_" + profileIDs[i],  SaveResults(results[profileIDs[i]]));
        }
    } catch (e) {
        alert(e.message);
    }
}

function SaveResults(arr) {
    if (null == arr) {
        return "";
    }
    var result = "";
    for (var i = 0; i < arr.length; i++) {
        var o = arr[i];
        if (null != o) {
            if (null == o) {
                continue;
            }
            if (null == o.Time) {
                continue;
            }
            if ("" == o.Time) {
                continue;
            }
            result += "|";
            result += o.Time;
            result += ",";
            result += o.Attacker;
            result += ",";
            result += o.Defender;
            result += ",";
            result += o.Winner;
        }
    }
    if (result.length < 1) {
        result = " ";
    }
    return result.substring(1, result.length);
}

function MergeResults(arr, o) {
    if (null == o) {
        return false;
    }
    if (null == o.Time) {
        return false;
    }
    if ("" == o.Time) {
        return false;
    }
    if (null == arr) {
        return false;
    }
    for (var i = 0; i < arr.length; i++) {
        var o1 = arr[i];
        if (o1.Time == o.Time) {
            if (o1.Attacker == o.Attacker) {
                if (o1.Winner == o.Winner) {
                    if (o1.Defender == o.Defender) {
                        return false;
                    }
                }
            }
        }
    }
    arr.push(o);
    return true;
}


function ParseResults(strData) {
    var results = new Array();
    try {
        if(null == strData) {
            return results;
        }
        var s = strData.split('|');
        for (var i = 0; i < s.length; i++) {
            var d = s[i].split(',');
            var o = new Object();
            o.Time = d[0];
            o.Attacker = d[1];
            o.Defender = d[2];
            o.Winner = d[3];

            results.push(o);
        }
    } catch (e) {

    }
    return results;
}

function MatchesProfile(profileID, profiles) {
    var profileIDs = "" + GM_getValue("TraceIDs", "");
    if (profileIDs.length < 1) {
        return null;
    }
    for (var i = 0; i < profiles.length; i++) {
        if (profiles[i] == profileID) {
            return profiles[i];
        }
    }
    return null;
}

function GetProfileID(strText) {
    if (null == strText) {
        return 0;
    }

    var i = strText.indexOf("profiles.php?id");
    if (i < 5) {
        return 0;
    }
    strText = strText.substring(i + 16, strText.length);
    i = strText.indexOf('"');
    strText = strText.substring(0, i);
    if (isNaN(strText)) {
        return 0;
    }
    return parseInt(strText);
}

function ShowLastResults() {

    var profileIDs = "" + prompt("Please Enter The Profile ID(s) you want to show splats for (comma separated)", GM_getValue("TraceShowIDs", GM_getValue("TraceIDs", "")));
    if (profileIDs.length < 1) {
        return;
    }
    var a = profileIDs.split(",");
    profileIDs = "";
    for (var i = 0; i < a.length; i++) {
        if (isNaN(a[i])) {
            alert(a[i] + " is not a valid profile ID, it will be skipped");
        } else {
            profileIDs += "," + a[i];
        }
    }
    if (profileIDs.length > 0) {
        profileIDs = profileIDs.substring(1, profileIDs.length);
    }
    GM_setValue("TraceShowIDs", profileIDs);

    ShowLastResults2();
}


function ShowLastResults2() {
    var profileIDs = "" + GM_getValue("TraceShowIDs", "");
    if (profileIDs.length < 1) {
        return;
    }
    var a = profileIDs.split(",");
    var strAll = "";
    for (var i = 0; i < a.length; i++) {
        var strData = GM_getValue("Trace_SummaryData_" + a[i], "");
        var strCurrent = "";
        var ctTotal = 0;
        var ctSplats = 0;
        if (strData.length > 0) {
            var arr = new Array();
            var x = strData.split("|");
            for (var j = 0; j < x.length; j++) {
                var y = x[j].split(',');
                if (y.length == 3) {
                    strCurrent += y[0] + "\t\t" + y[1] + "\t\t" + y[2] + "\n";
                    ctTotal += parseInt(y[1]);
                    ctSplats += parseInt(y[2]);
                }
            }
            strCurrent += "=========================\n";
            strCurrent += "TOTAL FOR " + a[i] + ":\t\t" + ctTotal + "\t\t" + ctSplats + "\n";
        }
        //alert(strCurrent);
        strAll += strCurrent + "\n\n";
    }
    var ct = document.getElementById("track_display_results");
    if (ct == null) {
        var p = GetListNode();
        if (null != p) {
            ct = document.createElement("textarea");
            ct.id = "track_display_results";
            ct.setAttribute("style", "width:260px;height:200px;padding:15px;margin:15px;");
            p.parentNode.insertBefore(ct, p);
        }
    }
    ct.textContent = strAll;
}

function FinishTrace () {
    try {
        GM_setValue("Trace_Running", false);
        var profileIDs = "" + GM_getValue("TraceIDs", "");
        if (profileIDs.length > 0) {
            var a = profileIDs.split(",");
            //profileIDs = "";
            for (var i = 0; i < a.length; i++) {
                GM_setValue("Trace_LastDate_" + a[i], "" + GM_getValue("Trace_CurrentDate_" + a[i], ""));

                var summary = new Object();
                var arr = new Array();
                var data = ParseResults(GM_getValue("Trace_CurrentResults_" + a[i], ""));
                for (var j = 0; j < data.length; j++) {
                    var o = data[j];
                    if (null == summary[o.Attacker]) {
                        summary[o.Attacker] = new Object();
                        summary[o.Attacker].Attacker = o.Attacker;
                        summary[o.Attacker].Total = 0;
                        summary[o.Attacker].Splats = 0;
                        arr.push(summary[o.Attacker]);
                    }
                    summary[o.Attacker].Total += 1;
                    if (o.Defender == o.Winner) {
                        summary[o.Attacker].Splats += 1;
                    }
                }
                
                arr.sort(function(a, b) {
                    if (a.Total != b.Total) { return a.Total - b.Total; } return a.Attacker - b.Attacker;
                });
                var strData = "";
                for (var j = 0; j < arr.length; j++) {
                    strData += "|";
                    strData += arr[j].Attacker;
                    strData += ",";
                    strData += arr[j].Total;
                    strData += ",";
                    strData += arr[j].Splats;
                }
                if (strData.length > 0) {
                    strData = strData.substring(1, strData.length);
                }
                GM_setValue("Trace_SummaryData_" + a[i], strData);
            }
        }
        GM_setValue("TraceShowIDs", profileIDs);
        ShowLastResults2();
    } catch (e) {
        alert(e.message);
    }
}

function StartNewTrace() {
    try {
        if (GM_getValue("Trace_Running", false)) {
            if (!confirm("A trace is currently in progress, do you want to start a new one?")) {
                return;
            }
            FinishTrace();
        }
        //if (!confirm("You should only start this on the last page (19).  Continue?")) {
        //    return;
        //}

        var profileIDs = "" + prompt("Please Enter The Profile ID(s) you want to track splats for (comma separated)", GM_getValue("TraceIDs", ""));
        if (profileIDs.length < 1) {
            return;
        }
        var a = profileIDs.split(",");
        profileIDs = "";
        for (var i = 0; i < a.length; i++) {
            if (isNaN(a[i])) {
                alert(a[i] + " is not a valid profile ID, it will be skipped");
            } else {
                profileIDs += "," + a[i];
                GM_setValue("Trace_LastDate_" + a[i], "" + prompt("Enter Date To Start From for " + a[i] + " (yyyy-mm-dd hh:mm:ss)", GM_getValue("Trace_LastDate_" + a[i], "")));
                GM_setValue("Trace_CurrentDate_" + a[i], "" + GM_getValue("Trace_LastDate_" + a[i], ""));
                GM_setValue("Trace_CurrentResults_" + a[i], "");
            }
        }
        if (profileIDs.length > 0) {
            profileIDs = profileIDs.substring(1, profileIDs.length);
        }
        GM_setValue("TraceIDs", profileIDs);
        GM_setValue("Trace_Running", true);
        ProcessCurrentPage();
    } catch (e) {
        alert(e.message);
    }
}

SetUpOptions();
if (GM_getValue("Trace_Running", true)) {
    ProcessCurrentPage();
