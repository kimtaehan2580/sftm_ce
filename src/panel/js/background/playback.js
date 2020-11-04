/*
 * Copyright 2017 SideeX committers
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */
var currentPlayingCommandIndex = -1;

var currentTestCaseId = "";
var isPause = false;
var pauseValue = null;
var isPlayingSuite = false;
var isPlayingAll = false;
var selectTabId = null;
var isSelecting = false;

var commandType = "";
var pageCount = 0;
var pageTime = "";
var ajaxCount = 0;
var ajaxTime = "";
var domCount = 0;
var domTime = "";
var implicitCount = 0;
var implicitTime = "";

var caseFailed = false;
var extCommand = new ExtCommand();



var sftm_title = "";
var sftm_user_id = "";
var sftm_id = "";


// TODO: move to another file
window.onload = function() {
	
    var recordButton = document.getElementById("record");

	//캡쳐버튼
    var screenCaptureButton = document.getElementById("screenCapture");
    $("#screenCaptureButton").click(function(e){
	});
	
   
   
    
    var logState=true;
    var referenceState=false;

    recordButton.addEventListener("click", function(){
    	
        isRecording = !isRecording;
 
        if (isRecording) {
            recorder.attach();
            notificationCount = 0;
            browser.tabs.query({windowId: extCommand.getContentWindowId(), url: "<all_urls>"})
            .then(function(tabs) {
                for(let tab of tabs) {
                    browser.tabs.sendMessage(tab.id, {attachRecorder: true});
                }
            });
            recordButton.childNodes[1].textContent = "Stop";
        }
        else {
        	// kimtaehan 여기 레코드 버튼 선택
            recorder.detach();
            browser.tabs.query({windowId: extCommand.getContentWindowId(), url: "<all_urls>"})
            .then(function(tabs) {
                for(let tab of tabs) {
                    browser.tabs.sendMessage(tab.id, {detachRecorder: true});
                }
            });
            recordButton.childNodes[1].textContent = "Record";
            
            
            
          // kimtaehan stop 이벤트 처리
            var s_suite = getSelectedSuite();
            var cases = s_suite.getElementsByTagName("p");
        	var output = "";
        	// old_case = getSelectedCase();
    	    for (var i = 0; i < cases.length; ++i) {
    	    	setSelectedCase(cases[i].id);
    	    	saveNewTarget();
    	    	output = output +
    	    		panelToFile(document.getElementById("records-grid").innerHTML)
    	    }
			var table2 = $("#command-grid"),
				rows = [],
				header = [];
		
		
			table2.find("tr").each(function () {
				var row = {};
				console.log( $(this).find("td").length);
				$(this).find("td").each(function (i) {
					var key = i,
					value = $(this).text();
					if(i==1){
						if($(this).find("option").length == 0){
							row[key] = value;
						}
						else{
							var rows2 = [];
							$(this).find("option").each(function (k) {
								rows2.push($(this).text());
							});
							
							row[key] = rows2;
						}
					}
					else{
					
						$(this).find("div").each(function (k) {
							if(k==1)
							value = $(this).text();
						});
						
						row[key] = value;
					}
					
				});
		
				rows.push(row);
			});
			
			var jobj = {"list" : rows};
			
    	    var jsonBody = {
	    		htmlFileStr : JSON.stringify(jobj)	,
	    		sftm_title : sftm_title,
	    		sftm_user_id : sftm_user_id,
	    		sftm_id: sftm_id
	    	};
    	    $.ajax({
    			url :  'http://18.191.191.42:8080/ntm/regiAutoTest.at',
    			method: "POST", 
    			dataType: "json", 
    			contentType : 'application/json',  
    			data : JSON.stringify(jsonBody),
    			success : function(data){
    				alert("자동 레코딩에 성공하였습니다.");
					window.close();
    			},
    			error : function(xhr, status, error){
    				alert("자동 레코딩에 실패하였습니다.");

					window.close();
					
    			}
    		});
    		
        }
    })
    
    
    
    // kimtaehan 녹음 요청
    function a(a) {
        o(a);
     }
     function o(a) {
         for (var o in a) {
             var e = a[o];
             
             if(e.name== "sftm_title"){
            	 sftm_title = e.value;
            	 console.log(e.value);
             }
             if(e.name== "sftm_user_id"){
            	 sftm_user_id = e.value;
            	 console.log(e.value);
             }
             if(e.name== "sftm_id"){
            	 sftm_id = e.value;
            	 console.log(e.value);
             }
            
         }

//		var t = str.replace(regExp, "");

         $("#defectName").text(" 1. 결함명 : " + decodeURI(sftm_title).replace(/\+/gi, " ") );
         $("#userName").text(" 2. 등록자 : " + sftm_user_id);
         addTestCase(sftm_title, sftm_id);
         setTimeout(function() {
         	  $("#record").trigger("click");
     	},1000);
         return;
     }
     chrome.tabs.getSelected(null, function(o) { 
         chrome.cookies.getAll({}, a)
     });
};

/**
 * Send the show element message to content script.
 * 
 * @param {Object}
 *            infos - a necessary infomation object. - key index {Int} - key
 *            tabId {Int} - key frameIds {Array} - key targetValue {String}
 */
function sendShowElementMessage(infos) {
    browser.tabs.sendMessage(infos.tabId, {
        showElement: true,
        targetValue: infos.targetValue
    }, {
        frameId: infos.frameIds[infos.index]
    }).then(function(response) {
        if (response){
            if (!response.result) {
                prepareSendNextFrame(infos);
            } else {
                let text = infos.index == 0 ? "top" : index.toString() + "(id)";
            }
        }
    }).catch(function(error) {
        if(error.message == "Could not establish connection. Receiving end does not exist.") {
            prepareSendNextFrame(infos);
        } else {
        }
    });
}

function prepareSendNextFrame(infos) {
    if (infos.index == infos.frameIds.length) {
    } else {
        infos.index++;
        sendShowElementMessage(infos);
    }
}

function cleanCommandToolBar() {
}

function play() {
    initializePlayingProgress()
        .then(executionLoop)
        .then(finalizePlayingProgress)
        .catch(catchPlayingError);
}

function stop() {

    if (isPause){
        isPause = false;
    }
    isPlaying = false;
    isPlayingSuite = false;
    isPlayingAll = false;
    switchPS();
    initAllSuite();
    finalizePlayingProgress();
}

function playAfterConnectionFailed() {
    if (isPlaying) {
        initializeAfterConnectionFailed()
            .then(executionLoop)
            .then(finalizePlayingProgress)
            .catch(catchPlayingError);
    }
}

function initializeAfterConnectionFailed() {
//    disableClick();

    isRecording = false;
    isPlaying = true;

    commandType = "preparation";
    pageCount = ajaxCount = domCount = implicitCount = 0;
    pageTime = ajaxTime = domTime = implicitTime = "";

    caseFailed = false;

    currentTestCaseId = getSelectedCase().id;
    var commands = getRecordsArray();

    return Promise.resolve(true);
}

function pause() {
    if (isPlaying) {
        isPause = true;
        isPlaying = false;
        // No need to detach
        // prevent from missing status info
        // extCommand.detach();
        switchPR();
    }
}

function resume() {
    if(currentTestCaseId!=getSelectedCase().id)
        setSelectedCase(currentTestCaseId);
    if (isPause) {
        isPlaying = true;
        isPause = false;
        extCommand.attach();
//        disableClick();
        executionLoop()
            .then(finalizePlayingProgress)
            .catch(catchPlayingError);
    }
}

function initAllSuite() {
    cleanCommandToolBar();
    var suites = document.getElementById("testCase-grid").getElementsByClassName("message");
    var length = suites.length;
    for (var k = 0; k < suites.length; ++k) {
        var cases = suites[k].getElementsByTagName("p");
        for (var u = 0; u < cases.length; ++u) {
            $("#" + cases[u].id).removeClass('fail success');
        }
    }
}

function playSuite(i) {
    isPlayingSuite = true;
    var cases = getSelectedSuite().getElementsByTagName("p");
    var length = cases.length;
    if (i == 0) {
    }
    if (i < length) {
        setSelectedCase(cases[i].id);
        setCaseScrollTop(getSelectedCase());
        play();
        nextCase(i);
    } else {
        isPlayingSuite = false;
        switchPS();
    }
}

function nextCase(i) {
    if (isPlaying || isPause) setTimeout(function() {
        nextCase(i);
    }, 500);
    else if(isPlayingSuite) playSuite(i + 1);
}

function playSuites(i) {
    isPlayingAll = true;
    var suites = document.getElementById("testCase-grid").getElementsByClassName("message");
    var length = suites.length;
    if (i < length) {
        if (suites[i].id.includes("suite")) {
            setSelectedSuite(suites[i].id);
            playSuite(0);
        }
        nextSuite(i);
    } else {
        isPlayingAll = false;
        switchPS();
    }
}

function nextSuite(i) {
    if (isPlayingSuite) setTimeout(function() {
        nextSuite(i);
    }, 2000);
    else if(isPlayingAll) playSuites(i + 1);
}

function executeCommand(index) {
    var id = parseInt(index) - 1;
    var commands = getRecordsArray();
    var commandName = getCommandName(commands[id]);
    var commandTarget = getCommandTarget(commands[id]);
    var commandValue = getCommandValue(commands[id]);


    initializePlayingProgress(true);

    setColor(id + 1, "executing");

    browser.tabs.query({
            windowId: extCommand.getContentWindowId(),
            active: true
        })
        .then(function(tabs) {
            return browser.tabs.sendMessage(tabs[0].id, {
                commands: commandName,
                target: commandTarget,
                value: commandValue
            }, {
                frameId: extCommand.getFrameId(tabs[0].id)
            })
        })
        .then(function(result) {
            if (result.result != "success") {
                setColor(id + 1, "fail");
                if (!result.result.includes("did not match")) {
                    return true;
                }
            } else {
                setColor(id + 1, "success");
            }
        })

    finalizePlayingProgress();
}

function cleanStatus() {
    var commands = getRecordsArray();
    for (var i = 0; i < commands.length; ++i) {
        commands[i].setAttribute("class", "");
        commands[i].getElementsByTagName("td")[0].classList.remove("stopping");
    }
    classifyRecords(1, commands.length);
}

function initializePlayingProgress(isDbclick) {
//    disableClick();
    
    isRecording = false;
    isPlaying = true;

    switchPS();

    currentPlayingCommandIndex = -1;

    // xian wait
    pageCount = ajaxCount = domCount = implicitCount = 0;
    pageTime = ajaxTime = domTime = implicitTime = "";

    caseFailed = false;

    currentTestCaseId = getSelectedCase().id;

    if (!isDbclick) {
        $("#" + currentTestCaseId).removeClass('fail success');
    }
    var commands = getRecordsArray();

    cleanStatus();

    return extCommand.init();
}

function executionLoop() {
    let commands = getRecordsArray();

    if (currentPlayingCommandIndex + 1 >= commands.length) {
        if (!caseFailed) {
             setColor(currentTestCaseId, "success");
            declaredVars = {};
        } else {
            caseFailed = false;
        }
        return true;
    }

    if (commands[currentPlayingCommandIndex + 1].getElementsByTagName("td")[0].classList.contains("break")
        && !commands[currentPlayingCommandIndex + 1].getElementsByTagName("td")[0].classList.contains("stopping")) {
        commands[currentPlayingCommandIndex + 1].getElementsByTagName("td")[0].classList.add("stopping");
        pause();
        return Promise.reject("shutdown");
    }

    if (!isPlaying) {
        cleanStatus();
        return Promise.reject("shutdown");
    }

    if (isPause) {
        return Promise.reject("shutdown");
    }

    currentPlayingCommandIndex++;

    if (commands[currentPlayingCommandIndex].getElementsByTagName("td")[0].classList.contains("stopping")) {
        commands[currentPlayingCommandIndex].getElementsByTagName("td")[0].classList.remove("stopping");
    }

    let commandName = getCommandName(commands[currentPlayingCommandIndex]);
    let commandTarget = getCommandTarget(commands[currentPlayingCommandIndex]);
    let commandValue = getCommandValue(commands[currentPlayingCommandIndex]);

    if (commandName == "") {
        return Promise.reject("no command name");
    }

    setColor(currentPlayingCommandIndex + 1, "executing");

    return delay($('#slider').slider("option", "value")).then(function () {
        if (isExtCommand(commandName)) {
            if (commandTarget.includes("d-XPath")) {
            } else {
            }
            let upperCase = commandName.charAt(0).toUpperCase() + commandName.slice(1);
            return (extCommand["do" + upperCase](commandTarget, commandValue))
               .then(function() {
                    setColor(currentPlayingCommandIndex + 1, "success");
               }).then(executionLoop); 
        } else {
            return doPreparation()
               .then(doPrePageWait)
               .then(doPageWait)
               .then(doAjaxWait)
               .then(doDomWait)
               .then(doCommand)
               .then(executionLoop)
        }
    });
}

function delay(t) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, t)
    });
 }

function finalizePlayingProgress() {
    if (!isPause) {
//        enableClick();
        extCommand.clear();
    }
    // console.log("success");
    setTimeout(function() {
        isPlaying = false;
        switchPS();
    }, 500);
}

//document.addEventListener("dblclick", function(event) {
//    var temp = event.target;
//    cleanCommandToolBar();
//    while (temp.tagName.toLowerCase() != "body") {
//        if (/records-(\d)+/.test(temp.id)) {
//            var index = temp.id.split("-")[1];
//            recorder.detach();
//            executeCommand(index);
//        }
//        if (temp.id == "command-grid") {
//            break;
//        } else temp = temp.parentElement;
//    }
//});

function playDisable(setting) {
    if (setting)
        document.getElementById("record").childNodes[1].textContent = "Record";
    document.getElementById("record").disabled = setting;
//    document.getElementById("playSuite").disabled = setting;
//    document.getElementById("playSuites").disabled = setting;
}

function switchPS() {
    if ((isPlaying||isPause)||isPlayingSuite||isPlayingAll) {
        playDisable(true);
    } else {
        playDisable(false);
    }
}

function switchPR() {
}

function catchPlayingError(reason) {
    // doCommands is depend on test website, so if make a new page,
    // doCommands funciton will fail, so keep retrying to get connection
    if (isReceivingEndError(reason)) {
        commandType = "preparation";
        setTimeout(function() {
            currentPlayingCommandIndex--;
            playAfterConnectionFailed();
        }, 100);
    } else if (reason == "shutdown") {
        return;
    } else {
        extCommand.clear();
//        enableClick();

        if (currentPlayingCommandIndex >= 0) {
            setColor(currentPlayingCommandIndex + 1, "fail");
        }
        setColor(currentTestCaseId, "fail");

        /* Clear the flag, reset to recording phase */
        /*
		 * A small delay for preventing recording events triggered in playing
		 * phase
		 */

        setTimeout(function() {
            isPlaying = false;
            // isRecording = true;
            switchPS();
        }, 500);
    }
}

function doPreparation() {
    if (!isPlaying) {
        currentPlayingCommandIndex--;
        return Promise.reject("shutdown");
    }
    // console.log("in preparation");
    return extCommand.sendCommand("waitPreparation", "", "")
        .then(function() {
            return true;
        })
}


function doPrePageWait() {
    if (!isPlaying) {
        currentPlayingCommandIndex--;
        return Promise.reject("shutdown");
    }
    // console.log("in prePageWait");
    return extCommand.sendCommand("prePageWait", "", "")
       .then(function(response) {
           if (response && response.new_page) {
               // console.log("prePageWaiting");
               return doPrePageWait();
           } else {
               return true;
           }
       })
}

function doPageWait() {
    if (!isPlaying) {
        currentPlayingCommandIndex--;
        return Promise.reject("shutdown");
    }
    // console.log("in pageWait");
    return extCommand.sendCommand("pageWait", "", "")
        .then(function(response) {
            if (pageTime && (Date.now() - pageTime) > 30000) {
                pageCount = 0;
                pageTime = "";
                return true;
            } else if (response && response.page_done) {
                pageCount = 0;
                pageTime = "";
                return true;
            } else {
                pageCount++;
                if (pageCount == 1) {
                    pageTime = Date.now();
                }
                return doPageWait();
            }
        })
}

function doAjaxWait() {
    // console.log("in ajaxWait");
    if (!isPlaying) {
        currentPlayingCommandIndex--;
        return Promise.reject("shutdown");
    }
    return extCommand.sendCommand("ajaxWait", "", "")
        .then(function(response) {
            if (ajaxTime && (Date.now() - ajaxTime) > 30000) {
                ajaxCount = 0;
                ajaxTime = "";
                return true;
            } else if (response && response.ajax_done) {
                ajaxCount = 0;
                ajaxTime = "";
                return true;
            } else {
                ajaxCount++;
                if (ajaxCount == 1) {
                    ajaxTime = Date.now();
                }
                return doAjaxWait();
            }
        })
}

function doDomWait() {
    if (!isPlaying) {
        currentPlayingCommandIndex--;
        return Promise.reject("shutdown");
    }
    // console.log("in domWait");
    return extCommand.sendCommand("domWait", "", "")
        .then(function(response) {
            if (domTime && (Date.now() - domTime) > 30000) {
                domCount = 0;
                domTime = "";
                return true;
            } else if (response && (Date.now() - response.dom_time) < 400) {
                domCount++;
                if (domCount == 1) {
                    domTime = Date.now();
                }
                return doDomWait();
            } else {
                domCount = 0;
                domTime = "";
                return true;
            }
        })
}

function doCommand() {
    let commands = getRecordsArray();
    let commandName = getCommandName(commands[currentPlayingCommandIndex]);
    let commandTarget = getCommandTarget(commands[currentPlayingCommandIndex]);
    let commandValue = getCommandValue(commands[currentPlayingCommandIndex]);
    // console.log("in common");

    if (implicitCount == 0) {
        if (commandTarget.includes("d-XPath")) {
        } else {
        }
    }

    if (!isPlaying) {
        currentPlayingCommandIndex--;
        return Promise.reject("shutdown");
    }

    let p = new Promise(function(resolve, reject) {
        let count = 0;
        let interval = setInterval(function() {
            if (!isPlaying) {
                currentPlayingCommandIndex--;
                reject("shutdown");
                clearInterval(interval);
            }
            if (count > 60) {
                reject("Window not Found");
                clearInterval(interval);
            }
            if (!extCommand.getPageStatus()) {
                if (count == 0) {
                }
                count++;
            } else {
                resolve();
                clearInterval(interval);
            }
        }, 500);
    });
    return p.then(function() {
            if(commandValue.indexOf("${") !== -1){
                commandValue = convertVariableToString(commandValue);
            }
            if(commandTarget.indexOf("${") !== -1){
                commandTarget = convertVariableToString(commandTarget);
            }
            if (isWindowMethodCommand(commandName))
            {
                return extCommand.sendCommand(commandName, commandTarget, commandValue, true);
            }
            return extCommand.sendCommand(commandName, commandTarget, commandValue);
        })
        .then(function(result) {
            if (result.result != "success") {
                // implicit
                if (result.result.match(/Element[\s\S]*?not found/)) {
                    if (implicitTime && (Date.now() - implicitTime > 10000)) {
                        implicitCount = 0;
                        implicitTime = "";
                    } else {
                        implicitCount++;
                        if (implicitCount == 1) {
                            implicitTime = Date.now();
                        }
                        return doCommand();
                    }
                }

                implicitCount = 0;
                implicitTime = "";
                setColor(currentPlayingCommandIndex + 1, "fail");
                setColor(currentTestCaseId, "fail");
                if (commandName.includes("verify") && result.result.includes("did not match")) {
                    setColor(currentPlayingCommandIndex + 1, "fail");
                } else {
                    caseFailed = true;
                    currentPlayingCommandIndex = commands.length;
                }
            } else {
                setColor(currentPlayingCommandIndex + 1, "success");
            }
        })
}

function isReceivingEndError(reason) {
    if (reason == "TypeError: response is undefined" ||
        reason == "Error: Could not establish connection. Receiving end does not exist." ||
        // Below message is for Google Chrome
        reason.message == "Could not establish connection. Receiving end does not exist." ||
        // Google Chrome misspells "response"
        reason.message == "The message port closed before a reponse was received." ||
        reason.message == "The message port closed before a response was received." )
        return true;
    return false;
}

function isWindowMethodCommand(command) {
    if (command == "answerOnNextPrompt"
        || command == "chooseCancelOnNextPrompt"
        || command == "assertPrompt"
        || command == "chooseOkOnNextConfirmation"
        || command == "chooseCancelOnNextConfirmation"
        || command == "assertConfirmation"
        || command == "assertAlert")
        return true;
    return false;
}

function enableButton(buttonId) {
    document.getElementById(buttonId).disabled = false;
}

function disableButton(buttonId) {
    document.getElementById(buttonId).disabled = true;
}

function convertVariableToString(variable){
    let frontIndex = variable.indexOf("${");
    let newStr = "";
    while(frontIndex !== -1){
        let prefix = variable.substring(0,frontIndex);
        let suffix = variable.substring(frontIndex);
        let tailIndex = suffix.indexOf("}");
        let suffix_front = suffix.substring(0,tailIndex + 1);
        let suffix_tail = suffix.substring(tailIndex + 1);
        newStr += prefix + xlateArgument(suffix_front);
        variable = suffix_tail;
        frontIndex = variable.indexOf("${");
    }
    return newStr + variable;
}
