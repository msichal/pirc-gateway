guser.changeNick = function(newnick, silent) {
	irc.lastNick = guser.nick;
	guser.nick = newnick;
	$('#usernick').text(he(guser.nick));
	$(document).attr('title', he(guser.nick)+ ' @ PIRC.pl');
	if(!silent) {
		for (i in gateway.channels) {
			gateway.channels[i].appendMessage(messagePatterns.nickChangeOwn, [$$.niceTime(), he(guser.nick)]);
		}
	}
	return true;
}

guser.umodes = {};

guser.setUmode = function(modechar, plus){
	guser.umodes[modechar] = plus;
}

guser.clearUmodes = function(){
	guser.umodes = {};
}

var irc = {
	'lastNick': '',
	'messagedata': function() {
		this.text = '';
		this.args = [];
		this.command = '';
		this.sender = {
			'nick': '',
			'ident': '',
			'host': '',
			'server': false,
			'user': false
		};
	},
	'oldData': '',
	'parseMessage': function(msg){
		var packets = [];
		var packetcnt = 0;
		var msglen = msg.length;
		var line = irc.oldData;
		irc.oldData = '';
		for(var i = 0; i < msglen; i++){
			var c = msg.charAt(i);
			if(c == '\r' || c == '\n'){
				if(line == ''){
					continue;
				}
				var ircmsg = irc.parseLine(line);
				if(ircmsg){
					packets[packetcnt] = ircmsg;
					packetcnt++;
				}
				line = '';
			} else {
				line += c;
			}
		}
		if(line.length > 0){
			irc.oldData = line;
		}
		return {'status': 2, 'packets': packets };
	},
	'parseLine': function(line){
		var ircmsg = new irc.messagedata();

		var line = line.trim();
		line.replace(/^\s+|\s+$/gm,'');
		
		if(line == ''){
			return;
		}
		
		var msglen = line.length;
	
		var pstate = stateStart;
		var currArg = '';

		for(var i = 0; i < msglen; i++){
			var cchar = line.charAt(i);
			switch(pstate){
				case stateStart:
					switch(cchar){
						case ':': pstate = stateSenderNick; break;
						default:
							pstate = stateCommand; 
							ircmsg.command += cchar;
							break;
					}
					break;
				case stateSenderNick:
					switch(cchar){
						case '!': pstate = stateSenderUser; break;
						case '@': pstate = stateSenderHost; break;
						case ' ': pstate = stateCommand; break;
						default: ircmsg.sender.nick += cchar; break;
					}
					break;
				case stateSenderUser:
					switch(cchar){
						case '@': pstate = stateSenderHost; break;
						case ' ': pstate = stateCommand; break;
						default: ircmsg.sender.ident += cchar; break;
					}
					break;
				case stateSenderHost:
					switch(cchar){
						case ' ': pstate = stateCommand; break;
						default: ircmsg.sender.host += cchar; break;
					}
					break;
				case stateCommand:
					switch(cchar){
						case ' ': pstate = stateArgs; break;
						default: ircmsg.command += cchar; break;
					}
					break;
				case stateArgs:
					switch(cchar){
						case ' ':
							if(currArg != ''){
								ircmsg.args.push(currArg);
							}
							currArg = '';
							break;
						case ':':
							if(prevChar == ' '){
								pstate = stateMessage;
							} else {
								currArg += cchar;
							}
							break;
						default: currArg += cchar; break;
					}
					break;
				case stateMessage:
					ircmsg.text += cchar;
					break;
			}
			var prevChar = cchar;
		}
		if(pstate == stateArgs){
			ircmsg.args.push(currArg);
		}
	
		if(ircmsg.sender.ident == '' && ircmsg.sender.host == '' && ircmsg.sender.nick.indexOf('.')!=-1){
			ircmsg.sender.server = true;
		} else {
			ircmsg.sender.user = true;
		}
	
	//	console.log(line);
		console.log(ircmsg);
	
	/*	packets[packetcnt] = ircmsg;
		packetcnt++;*/

//		return {'status': 2, 'packets': packets };
		return ircmsg;
	}
};

var gateway = {
	'websock': 0,
	'whois': '',
	'connectStatus': statusDisconnected,
	'joined': 0,
	'setConnectedWhenIdentified': 0,
	'connectTimeoutID': 0,
	'pingIntervalID': false,
	'whoChannelsIntervalID': false,
	'disconnectMessageShown': 0,
	'displayOwnWhois': false,
	'firstConnect': 1, //jeśli dostanę ERROR gdy to jest nadal 1 = błąd z poprzedniej sesji, od razu łączę ponownie
	'allowNewSend' : true,
	'statusWindow': new Status(),
	'userQuit': false,
	'chanPassword': function(chan) {
		if($('#chpass').val() == ''){
			$$.alert('Nie podałeś hasła!');
			return false;
		}
		gateway.send('JOIN '+chan+' '+$('#chpass').val());
		$(".errorwindow").fadeOut(250);
		return true;
	},
	'reconnect': function() { //wywoływana po kliknięciu 'połącz ponownie'
		gateway.websock.onerror = undefined;
		gateway.websock.onclose = undefined;
		gateway.websock.close();
		gateway.websock = false;
		setTimeout(function(){
			gateway.connectStatus = statusDisconnected;
			$$.closeDialog('connect', 'reconnect');
			$$.displayDialog('connect', '1', 'Łączenie', 'Ponowne łączenie, czekaj...');
			gateway.connect(true);
		}, 500);
	},
	'iKnowIAmConnected': function() { //użytkownik może już pisać na kanale
		if(!gateway.pingIntervalID){
			gateway.pingIntervalID = setInterval(function(){
				gateway.ping();
			}, 20000);
		}
		/*if(!gateway.whoChannelsIntervalID){
			gateway.whoChannelsIntervalID = setInterval(function(){
				gateway.channels.forEach(function(channel){
					gateway.send('WHO '+channel.name);
				});
			}, 10000);
		}*/
	/*	if(gateway.connectStatus == statusIdentified){
			gateway.connectStatus = statusConnected;
			if(guser.nickservnick != '' && guser.nick != guser.nickservnick) { //ostatnia próba zmiany nicka na właściwy
				gateway.send('NICK '+guser.nickservnick);
			}
		} else {*/
			gateway.setConnectedWhenIdentified = 1;
		//}
	//	$('#not_connected_wrapper').fadeOut(400); //schować szare tło!
		$$.closeDialog('connect', '1');
		clearTimeout(gateway.connectTimeoutID); //już ok więc nie czekam na nieudane połączenie
		connectTimeoutID = false;
		gateway.firstConnect = 0;
		if (gateway.getActive() && gateway.findChannel(gateway.active)) {
			$('#'+gateway.findChannel(gateway.active).id+'-nicklist').show(); //gwarantuje pokazanie listy nicków na bieżącym kanale po ponownym połączeniu
		}
	},
	'pingcnt': 0,
	'disconnected': function(text) { //informacja w okienkach i ich blokowanie przy rozłączeniu
		clearTimeout(gateway.connectTimeoutID);
		gateway.websock.onerror = undefined;
		gateway.websock.onclose = undefined;
		gateway.connectTimeoutID = false;
		clearInterval(gateway.pingIntervalID);
		gateway.pingIntervalID = false;
		if(guser.nickservnick != ''){
			irc.lastNick = guser.nick;
			guser.nick = guser.nickservnick;
		}
		if(gateway.disconnectMessageShown) {
			return;
		}
		gateway.disconnectMessageShown = 1;
		for(c in gateway.channels) {
			gateway.channels[c].part();
			gateway.channels[c].appendMessage(messagePatterns.error, [$$.niceTime(), text]);
		}
		gateway.statusWindow.appendMessage(messagePatterns.error, [$$.niceTime(), text]);
	},
	'ping': function() { //pytanie IRCD o ping i błąd kiedy brak odpowiedzi
		if(gateway.connectStatus != statusConnected) {
			gateway.pingcnt = 0;
			return;
		}
		//gateway.forceSend('PING :JavaScript');
		gateway.forceSend('MODE '+guser.nick);
		if(gateway.pingcnt > 3) {
			gateway.connectStatus = statusError;
			if($('#autoReconnect').is(':checked')){
				gateway.reconnect();
			} else {
				$$.displayReconnect();
			}
			gateway.disconnected('Przekroczony czas odpowiedzi serwera');
			gateway.pingcnt = 0;
		} else {
			gateway.pingcnt++;
		}
	},
	'configureConnection': function(){
		gateway.websock.onmessage = gateway.onRecv;
		gateway.websock.onerror = gateway.sockError;
		gateway.websock.onclose = gateway.sockError;
		if(gateway.delayedSendTimer){
			clearInterval(gateway.delayedSendTimer);
			gateway.delayedSendTimer = false;
		}
		gateway.delayedSendTimer = setInterval(function(){
			if(gateway.toSend.length > 0){
				gateway.forceSend(gateway.toSend.shift());
			} else {
				if(gateway.sendDelayCnt > 0){
					gateway.sendDelayCnt--;	
				}
			}
		}, 1000);
	},
	'connect': function(force) {
		gateway.userQuit = false;
		gateway.connectTimeoutID = setTimeout(gateway.connectTimeout, 20000);
		/*if(!gateway.websock || gateway.websock.readyState == WebSocket.CLOSING || gateway.websock.readyState == WebSocket.CLOSED){
			gateway.websock = new WebSocket(server);
			gateway.websock.onmessage = function(e){
				var regexp = /^SYNC ([^ ]+)$/i
				var rmatch = regexp.exec(e.data);
				if(rmatch[1]){
					if(rmatch[1] == '1'){
						gateway.recoverConnection();
					} else {
						gateway.connect(true);
					}
				}

			};
			gateway.websock.onopen = function(){
				gateway.forceSend('SYNC '+sessionid);
			};
			
		} else {
			if(guser.nickservpass != '' && guser.nickservnick != ''){
				gateway.websock.onmessage = function(e){
					var regexp = /^SYNC ([^ ]+)$/i
					var rmatch = regexp.exec(e.data);
					if(rmatch[1]){
						if(rmatch[1] == '1'){
							gateway.recoverConnection();
						} else {
							gateway.configureConnection();
							gateway.forceSend('NEW '+sessionid+' ' + guser.nick + ' ' + md5(guser.nickservpass));
						}
					}
				};
				gateway.forceSend('FIND '+ guser.nickservnick + ' ' + md5(guser.nickservpass) + ' '+ sessionid);
			} else {
				gateway.configureConnection();
				gateway.forceSend('NEW '+sessionid+' ' + guser.nick + ' x');
			}
		}*/
		gateway.websock = new WebSocket(server);
		gateway.websock.onopen = function(e){
			gateway.configureConnection();
			var username = 'Użytkownik bramki PIRC.pl';
			try {
				var ckNick = localStorage.getItem('origNick');
			 	if(ckNick){
					username += ' "'+ckNick+'"';
				}
			} catch(e) {}
			gateway.send('USER pirc * * :'+username+'\r\n');
			gateway.send('NICK '+guser.nick);
		}

	},
	/*'recoverConnection': function() {
		$('#not_connected_wrapper').fadeOut(400);
		if(gateway.connectTimeoutID){
			clearTimeout(gateway.connectTimeoutID);
		}
		gateway.connectTimeoutID = setTimeout(gateway.connectTimeout, 20000);
		// już jest połączenie
		gateway.configureConnection();
		gateway.statusWindow.appendMessage(messagePatterns.existingConnection, [$$.niceTime()]);
		$$.displayDialog('error', 'error', 'Ostrzeżenie', 'UWAGA: jeśli posiadasz już otwartą bramkę, zamknij ją, aby uniknąć problemów!');
		gateway.send('PRIVMSG');
			
		if(guser.nick == localStorage.getItem('nick') && localStorage.getItem('password')){
			guser.nickservnick = guser.nick;
			guser.nickservpass = atob(localStorage.getItem('password'));
		}
			
		setTimeout(function(){
			if(reqChannel && reqChannel.match(/^#[^ ]/)){
				gateway.send('JOIN '+reqChannel);
			}
			if(guser.channels[0] && guser.channels[0] != reqChannel && guser.channels[0].match(/^#[^ ]/)){
				gateway.send('JOIN '+guser.channels[0]);
			}
		}, 500);
	},*/
	'processData': function(data) {
		for (i in data.packets) { //wywoływanie funkcji 'handlerów' od poleceń
			var msg = data.packets[i];
			var command = msg.command
			if(command in cmdBinds) {
				for(func in cmdBinds[command]) {
					cmdBinds[command][func](msg);
				}
			}
		}
	},
	'sockError': function(e) {
		console.log('WebSocket error!');
		setTimeout(function(){
			if(gateway.connectStatus != statusDisconnected && gateway.connectStatus != statusError){
				gateway.connectStatus = statusError;
				//gateway.disconnected('Błąd serwera bramki');
				gateway.disconnected('Utracono połączenie z serwerem');
				if($('#autoReconnect').is(':checked')){
					gateway.reconnect();
				} else {
					$$.displayReconnect();
				}
			}
		}, 1000);
	},
	'onRecv': function(sdata) {
		//data = irc.parseMessage(Base64.decode(sdata.data));
		var reader = new FileReader();
		reader.addEventListener("loadend", function() {
		   // reader.result contains the contents of blob as a typed array
			data = irc.parseMessage(reader.result);
			gateway.processData(data);
			gateway.processStatus();
		});
		reader.readAsText(sdata.data);

//		data = irc.parseMessage(sdata.data);
//		gateway.processData(data);
//		gateway.processStatus();
	},
	'ctcp': function(dest, text) {
		gateway.send('PRIVMSG '+dest+' :\001'+text+'\001');
	},
	'processStatus': function() {
		if(guser.nickservpass != '' && guser.nickservnick != ''){
			if(gateway.connectStatus == status001) {
				if(guser.nick != guser.nickservnick) { //auto-ghost
					gateway.connectStatus = statusGhostSent;
					gateway.send("PRIVMSG NickServ :RECOVER "+guser.nickservnick+" "+guser.nickservpass);
				} else {
					gateway.send("PRIVMSG NickServ :IDENTIFY "+guser.nickservpass);
					gateway.connectStatus = statusIdentified;
				}
			}
			if(gateway.connectStatus == statusGhostAndNickSent && guser.nick == guser.nickservnick){ //ghost się udał
				gateway.send("PRIVMSG NickServ :IDENTIFY "+guser.nickservpass);
				if(gateway.nickWasInUse){
					var html = '<p>I już nie jest: usunąłem go używając twojego hasła :)</p>';
					$$.displayDialog('warning', 'warning', 'Ostrzeżenie', html);
					gateway.nickWasInUse = false;
				}
				gateway.connectStatus = statusIdentified;
			}
		} else {
			if(gateway.connectStatus == status001) { //nie ma hasła więc od razu uznajemy że ok
				gateway.connectStatus = statusIdentified;
			}
		}
		if(gateway.connectStatus == statusIdentified && gateway.setConnectedWhenIdentified == 1){ //podłączony, a szare tło schowane już wcześniej
			gateway.connectStatus = statusConnected;
		}
		if(gateway.connectStatus == statusConnected){
			gateway.setConnectedWhenIdentified = 0;
			if(!gateway.joined) {
				$('#input').focus();
			//	gateway.joinChannels();
				gateway.joined = 1;
				gateway.disconnectMessageShown = 0; //tutaj resetuję
			}
		} else {
			gateway.joined = 0;
		}
	},
	'joinChannels': function() {
		var joinstr = guser.channels[0]?('JOIN '+guser.channels[0]+'\r\n'):'';
		for(c in gateway.channels) {
			joinstr += "JOIN "+gateway.channels[c].name+"\r\n";
		}
		gateway.send(joinstr);
	},
	'connectTimeout': function() {
		gateway.connectTimeoutID = false;
		if(gateway.userQuit){
			return;
		}
		if(gateway.connectStatus != statusConnected){
			var button = [ {
				text: 'Połącz ponownie',
				click: function(){
					gateway.stopAndReconnect();
				}
			} ];
			$$.closeDialog('connect', '1');
			$$.displayDialog('connect', 'reconnect', 'Łączenie', '<p>Łączenie trwa zbyt długo. Możesz poczekać lub spróbować jeszcze raz.</p>', button);
		}
	},
	'stopAndReconnect': function () {
		gateway.disconnected('Zbyt długi czas łączenia');
		gateway.send('QUIT :Błąd bramki >> łączenie trwało zbyt długo');
		gateway.connectStatus = statusDisconnected;
		setTimeout('gateway.reconnect()', 500);
	},
	'initSys': function() {
		var html = 'Poczekaj, trwa łączenie...<br />Nie używaj teraz przycisku "Wstecz" ani "Odśwież".';
		$$.displayDialog('connect', '1', 'Łączenie', html);
	},
	'initialize': function() {
		var nickInput = $('#nsnick').val();
		var chanInput = $('#nschan').val();
		var passInput = $('#nspass').val();
		if(nickInput == ''){
			$$.alert('Musisz podać nicka!');
			return false;
		}
		if(chanInput == ''){
			$$.alert('Musisz podać kanał!');
			return false;
		}
		if(!nickInput.match(/^[\^\|0-9a-z_`\[\]\-]+$/i)) {
			$$.alert('Nick zawiera niedozwolone znaki!');
			return false;
		}
		if(nickInput.match(/^[0-9-]/)){
			$$.alert('Nick nie może zaczynać się od cyfry ani minusa!');
			return false;
		}
		if(!chanInput.match(/^[#,a-z0-9_\.\-\\]+$/i)) {
			$$.alert('Kanał zawiera niedozwolone znaki!');
			return false;
		}
		if(passInput.match(/[ ]+/i)) {
			$$.alert('Hasło nie powinno zawierać spacji!');
			return false;
		}
		if(nickInput != guser.nick) {
			guser.changeNick(nickInput);
		}
		guser.channels = [ chanInput ];
		if(passInput != '') {
			guser.nickservnick = nickInput;
			guser.nickservpass = $('#nspass').val();
		}
		try {
			if(chanInput){
				localStorage.setItem('channel', chanInput);
			}
			if(nickInput){
				localStorage.setItem('nick', nickInput);
			}
			if($('#save_password').is(":checked")){
				if(guser.nickservnick && guser.nickservpass){
					localStorage.setItem('password', btoa(guser.nickservpass));
				}
			}
		} catch(e) {}
		gateway.initSys();
		gateway.connect(false);

		return true;
	},
	'delayedSendTimer': false,
	'toSend': [],
	'sendDelayCnt': 0,
	'sendDelayed': function(data){
		gateway.toSend.push(data);
	},
	'send': function(data) {
		if(gateway.websock.readyState === gateway.websock.OPEN && gateway.sendDelayCnt < 3){
			gateway.forceSend(data);
			gateway.sendDelayCnt++;
		} else {
			gateway.toSend.push(data);
		}
	},
	'forceSend': function(data){
		if(gateway.websock.readyState === gateway.websock.OPEN){
			console.log('← '+data);
			//sdata = Base64.encode(data+'\r\n');
			sdata = data + '\r\n';
			gateway.websock.send(sdata);
		} else {
			console.log('Outmsg delayed: '+data);
			gateway.toSend.push(data);
		}
	},
	'channels': [],
	'findChannel': function(name) {
		if(typeof(name) != 'string') return false;
		for (i in gateway.channels) {
			if(gateway.channels[i] && gateway.channels[i].name.toLowerCase() == name.toLowerCase()) {
				return gateway.channels[i];
			}
		}
		return false;
	},
	'removeChannel': function(name) {
		if(typeof(name) != 'string') return false;
		var channels2 = [];
		for (i in gateway.channels) {
			if(gateway.channels[i] && gateway.channels[i].name.toLowerCase() == name.toLowerCase()) {
				gateway.findChannel(name).markRead();
				gateway.channels[i].close();
			} else if(gateway.channels[i]) {
				channels2.push(gateway.channels[i]);
			}
		}
		gateway.channels = channels2;
		$('#input').focus();
		return false;
	},
	'queries': [],
	'findQuery': function(name) {
		if(typeof(name) != 'string') return false;
		for (i in gateway.queries) {
			if(gateway.queries[i] && gateway.queries[i].name.toLowerCase() == name.toLowerCase()) {
				return gateway.queries[i];
			}
		}
		return false;
	},
	'removeQuery': function(name) {
		if(typeof(name) != 'string') return false;
		var queries2 = [];
		for (i in gateway.queries) {
			if(gateway.queries[i] && gateway.queries[i].name.toLowerCase() == name.toLowerCase()) {
				gateway.findQuery(name).markRead();
				gateway.queries[i].close();
			} else if(gateway.queries[i]) {
				queries2.push(gateway.queries[i]);
			}
		}
		gateway.queries = queries2;
		$('#input').focus();
		return false;
	},
	'changeTopic': function(channel) {
		if(!confirm('Czy zmienić temat dla '+channel+'? Nie można tego cofnąć.')){
			return;
		}
		var newTopic = $('#topicEdit').val().replace(/\n/g, ' ');
		gateway.send('TOPIC '+channel+' :'+$$.tagsToColors(newTopic));
	},
	'tabHistory': ['--status'],
	'lasterror': '',
	'nickListVisibility': true,
	'nickListToggle': function() {
		var active = gateway.getActive();
		if(!active){
			active = gateway.statusWindow;
		}
		active.saveScroll();
		if($("#nicklist").width() > 40) {
			$("#nicklist").animate({
				"opacity": "toggle",
				"width":	"40px"
			}, 400);
			$("#chstats").animate({
				"opacity": "toggle",
				"width":	"40px"
			}, 400);
			$("#chatbox").animate({
				"width":	"97%"
			}, 401, function () {
				$("#nicklist-closed").fadeIn(200);
				setTimeout(function(){
					gateway.getActive().restoreScroll();
				}, 250);
			});
			gateway.nickListVisibility = false;
		} else {
			gateway.showNickList();
			gateway.nickListVisibility = true;
		}
		gateway.checkNickListVisibility();
		$('#input').focus();
	},
	'checkNickListVisibility': function() {
		setTimeout(function(){
			if(!$('#nicklist-closed').is(':visible') && !$('#nicklist').is(':visible')){
				gateway.showNickList();
			}
		}, 1500);
	},
	'showNickList': function() {
		$("#nicklist-closed").fadeOut(200, function () {
			$("#nicklist").animate({
				"opacity": "toggle",
				"width":	"23%"
			}, 400);
			$("#chstats").animate({
				"opacity": "toggle",
				"width":	"23%"
			}, 400);
			$("#chatbox").animate({
				"width":	"77%"
			}, 401);
			setTimeout(function(){
				var tab = gateway.getActive();
				if(!tab){
					tab = gateway.statusWindow;
				}
				tab.restoreScroll();
			}, 450);
		});
	},
	'insert': function(text) {
		var input = $('#input');
		var oldText = input.val();
		input.focus();
		input.val(oldText + text);
	}, 
	'insertColor': function(color) {
		gateway.insert('[!color]' + (color<10?'0':'') + color.toString());
	},
	'insertCode': function(code) {
		var text = false;
		switch(code){
			case 2: text = '[!bold]'; break;
			case 3: text = '[!color]'; break;
			case 15: text = '[!reset]'; break;
			case 22: text = '[!invert]'; break;
			case 29: text = '[!italic]'; break;
			case 31: text = '[!uline]'; break;
		}
		if(text) gateway.insert(text);
	},
	'nextTab': function() {
		var swtab = $('li.activeWindow').next().find('a.switchTab');
		if(swtab){
			swtab.trigger('click');
		}
	},
	'prevTab': function() {
		var swtab = $('li.activeWindow').prev().find('a.switchTab');
		if(swtab){
			swtab.trigger('click');
		}
	},
	'switchTab': function(chan) {
		var act = gateway.getActive();
		if(act){
			act.saveScroll();
			act.setMark();
		} else {
			gateway.statusWindow.saveScroll();
			gateway.statusWindow.setMark();
		}
		chan = chan.toLowerCase();
		if(chan != "--status" && gateway.findChannel(chan)) {
			$('#main-window > span').hide();
			$('#nicklist-main > span').hide();
			$('#chstats > div').hide();
			$('#info > span').hide();
			$('#'+gateway.findChannel(chan).id+'-nicklist').show();
			$('#tabs > li').removeClass("activeWindow");
			$('#'+gateway.findChannel(chan).id+'-tab').addClass("activeWindow");
			$('#'+gateway.findChannel(chan).id+'-window').show();
			$('#'+gateway.findChannel(chan).id+'-chstats').show();
			$('#'+gateway.findChannel(chan).id+'-topic').show();
			$('#'+gateway.findChannel(chan).id+'-topic').prop('title', 'Kliknij aby zobaczyć cały temat');
			gateway.findChannel(chan).markRead();
			gateway.active = chan;
			gateway.tabHistory.push(chan);
			$('#input').focus();
			if($("#nicklist").width() < 41 && gateway.nickListVisibility) {
				$("#nicklist-closed").fadeOut(1, function () {
					$("#nicklist").animate({
						"opacity": "toggle",
						"width":	"23%"
					}, 1);
					$("#chstats").animate({
						"opacity": "toggle",
						"width":	"23%"
					}, 1);
					$("#chatbox").animate({
						"width":	"77%"
					}, 1, function() {
						gateway.findChannel(chan).restoreScroll();
						setTimeout(function(){
							gateway.findChannel(chan).restoreScroll();
						}, 200);
					});
				});
			} else {
				gateway.findChannel(chan).restoreScroll();
				setTimeout(function(){
					gateway.findChannel(chan).restoreScroll();
				}, 200);
			}
			
		} else if(chan != "--status" && gateway.findQuery(chan)) {
			$('#main-window > span').hide();
			$('#nicklist-main > span').hide();
			$('#info > span').hide();
			$('#chstats > div').hide();
			$('#--status-nicklist').show();
			$('#tabs > li').removeClass("activeWindow");
			$('#'+gateway.findQuery(chan).id+'-tab').addClass("activeWindow");
			$('#'+gateway.findQuery(chan).id+'-window').show();
			$('#'+gateway.findQuery(chan).id+'-topic').show();
			$('#'+gateway.findQuery(chan).id+'-chstats').show();
			$('#'+gateway.findChannel(chan).id+'-topic').prop('title', '');
			gateway.active = chan;
			gateway.tabHistory.push(chan);
			$('#input').focus();
			if($("#nicklist").width() > 40) {
				$("#nicklist").animate({
					"opacity": "toggle",
					"width":	"40px"
				}, 1);
				$("#chstats").animate({
					"opacity": "toggle",
					"width":	"40px"
				}, 1);
				$("#chatbox").animate({
					"width":	"97%"
				}, 1, function () {
					$("#nicklist-closed").fadeIn(1);
					gateway.findQuery(chan).restoreScroll();
					setTimeout(function(){
						gateway.findQuery(chan).restoreScroll();
					}, 200);
				});
			} else {
				gateway.findQuery(chan).restoreScroll();
				setTimeout(function(){
					gateway.findQuery(chan).restoreScroll();
				}, 200);
			}
			gateway.findQuery(chan).markRead();
		} else if(chan == "--status") {
			$('#main-window > span').hide();
			$('#nicklist-main > span').hide();
			$('#info > span').hide();
			$('#chstats > div').hide();
			$('#--status-nicklist').show();
			$('#tabs > li').removeClass("activeWindow");
			$('#--status-tab').addClass("activeWindow");
			$('#--status-window').show();
			$('#--status-topic').show();
			$('#--status-chstats').show();
			$('#'+gateway.findChannel(chan).id+'-topic').prop('title', '');
			gateway.statusWindow.markRead();
			gateway.active = chan;
			gateway.tabHistory.push(chan);
			$('#input').focus();
			if($("#nicklist").width() > 40) {
				$("#nicklist").animate({
					"opacity": "toggle",
					"width":	"40px"
				}, 1);
				$("#chstats").animate({
					"opacity": "toggle",
					"width":	"40px"
				}, 1);
				$("#chatbox").animate({
					"width":	"97%"
				}, 1, function () {
					$("#nicklist-closed").fadeIn(1);
					gateway.statusWindow.restoreScroll();
					setTimeout(function(){
						gateway.statusWindow.restoreScroll();
					}, 200);
				});
			} else {
				gateway.statusWindow.restoreScroll();
				setTimeout(function(){
					gateway.statusWindow.restoreScroll();
				}, 200);
			}
		}
		gateway.checkNickListVisibility();
	},
	'tabHistoryLast': function(ignore) {
		var ignorec = ignore.toLowerCase();
		for(var i=gateway.tabHistory.length; i > 0; i--) {
			if(gateway.tabHistory[i] && ((gateway.findChannel(gateway.tabHistory[i]) || gateway.findChannel(gateway.tabHistory[i])) && (!ignorec || ignorec != gateway.tabHistory[i]))) {
				return gateway.tabHistory[i];
			}
		}
		return '--status';
	},
	'notEnoughParams': function(command, reason) {
		if(gateway.getActive()) {
			gateway.getActive().appendMessage(messagePatterns.notEnoughParams, [$$.niceTime(), command, reason]);
		} else {
			gateway.statusWindow.appendMessage(messagePatterns.notEnoughParams, [$$.niceTime(), command, reason]);
		}
	},
	'callCommand': function(command, input, alias) {
		if(alias && alias in commands) {
			if(typeof(commands[alias].callback) == 'string') {
				return gateway.callCommand(command, input, commands[alias].callback);
			} else if(typeof(commands[alias].callback) == 'function') {
				commands[alias].callback(command, input);
				return true;
			} else {
				return false;
			}
		} else if(command[0].toLowerCase() in commands) {
			if(typeof(commands[command[0].toLowerCase()].callback) == 'string') {
				return gateway.callCommand(command, input, commands[command[0].toLowerCase()].callback);
			} else if(typeof(commands[command[0].toLowerCase()].callback) == 'function') {
				commands[command[0].toLowerCase()].callback(command, input);
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	},
	'parseUserCommand': function(input) {
		command = input.slice(1).split(" ");
		if(!gateway.callCommand(command, input)) {
			if (gateway.getActive()) {
				gateway.getActive().appendMessage(messagePatterns.noSuchCommand, [$$.niceTime(), he(command[0])]);
			} else {
				gateway.statusWindow.appendMessage(messagePatterns.noSuchCommand, [$$.niceTime(), he(command[0])]);
			}
		}
	},
	'parseUserMessage': function(input){
		var active = gateway.getActive();
		if(gateway.getActive()) {
			var textToSend = input;
			do {
				var sendNow = textToSend.substring(0, 420);
				textToSend = textToSend.substring(420);
				gateway.send("PRIVMSG " + gateway.getActive().name + " :" + sendNow);
				var message = $$.colorize(sendNow);
				for(f in messageProcessors){
					message = messageProcessors[f](guser.nick, active.name, message);
				}
				active.appendMessage(messagePatterns.yourMsg, [$$.niceTime(), $$.nickColor(guser.nick), guser.nick, message]);
			} while (textToSend != "");
			active.appendMessage('%s', [$$.parseImages(input)]);
		}
	},
	'parseUserInput': function(input) {
		if(!input){
			input = '';
		}
		input = $$.tagsToColors(input);
		if($('#sendEmoji').is(':checked')){
			input = $$.textToEmoji(input);
		}
		if (!input) {
			return;
		}
		if(gateway.connectStatus > 0) {
			var regexp = /^\s+(\/.*)$/;
			var match = regexp.exec(input);
			if(match){
				var button = [ {
					text: 'Wyślij wiadomość',
					click: function(){
						gateway.parseUserMessage(input);
						$(this).dialog('close');
					}
				}, {
					text: 'Wykonaj polecenie',
					click: function(){
						gateway.parseUserCommand(match[1]);
						$(this).dialog('close');
					}
				}, {
					text: 'Anuluj',
					click: function(){
						$(this).dialog('close');
					}
				} ];
				var html = 'Wpisany tekst zaczyna się od znaku "/", ale poprzedzonego spacją. Aby uniknąć pomyłki, wybierz, co chcesz zrobić.<br><br><strong>'+$$.sescape(input)+'</string>';
				$$.displayDialog('confirm', 'command', 'Potwierdź', html, button);
			} else {
				regexp = /^(#[^ ,]{1,25})$/;
				match = regexp.exec(input);
				if(match){
					var button = [ {
						text: 'Wyślij wiadomość',
						click: function(){
							gateway.parseUserMessage(input);
							$(this).dialog('close');
						}
					}, {
						text: 'Dołącz do '+input,
						click: function(){
							gateway.send('JOIN '+input);
							$(this).dialog('close');
						}
					}, {
						text: 'Anuluj',
						click: function(){
							$(this).dialog('close');
						}
					} ];
					var html = 'Wpisana wiadomość wygląda jak nazwa kanału IRC. Podawanie nazw kanałów na innych kanałach jest często uznawane jako spam. Aby uniknąć pomyłki, wybierz, co chcesz zrobić.<br><br><strong>'+$$.sescape(input)+'</string>';
					$$.displayDialog('confirm', 'command', 'Potwierdź', html, button);
				} else if(input.charAt(0) == "/") {
					gateway.parseUserCommand(input);
				} else {
					gateway.parseUserMessage(input);
				}
			}
		} else {
			if (gateway.getActive()) {
				gateway.getActive().appendMessage(messagePatterns.notConnected, [$$.niceTime()]);
			} else {
				gateway.statusWindow.appendMessage(messagePatterns.notConnected, [$$.niceTime()]);
			}
		}
		$("#input").val("");
	},
	'performCommand': function(input){
		input = '/' + input;
		var command = input.slice(1).split(" ");
		if(!gateway.callCommand(command, input)) {
			console.log('Invalid performCommand: '+command[0]);
		}
	},
	'commandHistory': [],
	'commandHistoryPos': -1,
	'inputFocus': function() {
		if(window.getSelection().toString() == ''){
			$("#input").focus();
		}
	},
	'openQuery': function(nick, id) {
		if(ignore.ignoring(nick, 'query')){
			var button = [
				{
					text: 'Zmień ustawienia',
					click: function(){
						ignore.askIgnore(nick);
						$(this).dialog('close');
					}
				},
				{
					text: 'OK',
					click: function(){
						$(this).dialog('close');
					}
				}
			];
			var html = '<p>Nie możesz rozmawiać prywatnie z tym użytkownikiem, ponieważ jest na Twojej liście ignorowanych.</p>';
			$$.displayDialog('error', 'ignore', 'Błąd', html, button);
			return;
		}
		gateway.findOrCreate(nick, true);
		if(id){
			gateway.toggleNickOpt(id);
		}
	},
	'showStatus': function(channel, nick) {
	  	var html = 
			'<p>Daj użytkownikowi '+he(nick)+' bieżące uprawnienia na kanale '+he(channel)+':</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' +q '+$$.sescape(nick)+'\');">FOUNDER (Właściciel kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' +a '+$$.sescape(nick)+'\');">PROTECT (Ochrona przed kopnięciem)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' +o '+$$.sescape(nick)+'\');">OP (Operator kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' +h '+$$.sescape(nick)+'\');">HALFOP (Pół-operator kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' +v '+$$.sescape(nick)+'\');">VOICE (Uprawnienie do głosu)</p>' +
			'<p>Daj użytkownikowi '+he(nick)+' uprawnienia w ChanServ (na stałe) na kanale '+he(channel)+'<br>(musisz posiadać odpowiedni dostęp do serwisów):</p>' +
			'<p class="statusbutton" onClick="gateway.performCommand(\'CS QOP '+bsEscape(channel)+' ADD "+$$.sescape(nick)+"\");">QOP: FOUNDER (Właściciel kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.performCommand(\'CS SOP '+bsEscape(channel)+' ADD "+$$.sescape(nick)+"\");">SOP: PROTECT (Ochrona przed kopnięciem)</p>' +
			'<p class="statusbutton" onClick="gateway.performCommand(\'CS AOP '+bsEscape(channel)+' ADD "+$$.sescape(nick)+"\");">AOP: OP (Operator kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.performCommand(\'CS HOP '+bsEscape(channel)+' ADD "+$$.sescape(nick)+"\");">HOP: HALFOP (Pół-operator kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.performCommand(\'CS VOP '+bsEscape(channel)+' ADD "+$$.sescape(nick)+"\");">VOP: VOICE (Uprawnienie do głosu)</p>';
		$$.displayDialog('admin', channel, 'Zarządzanie '+he(channel), html);
	},
	'showStatusAnti': function(channel, nick) {
		var html =
			'<p>Odbierz użytkownikowi '+he(nick)+' uprawnienia na kanale '+he(channel)+':</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' -q '+$$.sescape(nick)+'\');">FOUNDER (Właściciel kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' -a '+$$.sescape(nick)+'\');">PROTECT (Ochrona przed kopnięciem)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' -o '+$$.sescape(nick)+'\');">OP (Operator kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' -h '+$$.sescape(nick)+'\');">HALFOP (Pół-operator kanału)</p>' +
			'<p class="statusbutton" onClick="gateway.send(\'MODE '+bsEscape(channel)+' -v '+$$.sescape(nick)+'\');">VOICE (Uprawnienie do głosu)</p>';
		$$.displayDialog('admin', channel, 'Zarządzanie '+he(channel), html);
	},
	'showChannelModes': function(channel) {
		var channame = channel.substring(1);
		var ch = md5(channame);
		
		var html = "<p>Zmień tryby kanału "+he(channel)+":</p>" +
			"<table><tr><th></th><th>Litera</th><th>Opis</th></tr>";
		//generacja HTML z tabelą z wszystkimi trybami
		modes.changeableSingle.forEach(function(mode){
			html += '<tr><td><input type="checkbox" id="'+ch+'_mode_'+mode[0]+'"></td><td>'+mode[0]+'</td><td>'+mode[1]+'</td></tr>';
		}, this);
		modes.changeableArg.forEach(function(mode){
			html += '<tr><td><input type="checkbox" id="'+ch+'_mode_'+mode[0]+'"></td><td>'+mode[0]+'</td><td>'+mode[1]+'</td><td><input type="text" id="'+ch+'_mode_'+mode[0]+'_text"></td></tr>';
		}, this);
		html += '</table>';

		var button = [ {
			text: 'Zatwierdź',
			click: function(){
				gateway.changeChannelModes(channel);
				$(this).dialog('close');
			}
		} ];

		$$.displayDialog('admin', channel, 'Zarządzanie '+he(channel), html, button);
			
		var chanModes = gateway.findChannel(channel).modes;
		if(!chanModes){
			return;
		}
		//uzupełnianie tabeli trybami już ustawionymi
		modes.changeableSingle.forEach(function(mode){
			if(chanModes[mode[0]]){
				$('#'+ch+'_mode_'+mode[0]).prop('checked', true);
			}
		}, this);
		modes.changeableArg.forEach(function(mode){
			if(chanModes[mode[0]]){
				$('#'+ch+'_mode_'+mode[0]).prop('checked', true);
				$('#'+ch+'_mode_'+mode[0]+'_text').val(chanModes[mode[0]]);
			}
		}, this);
	},
	'changeChannelModes': function(channel) {
		var modesw = '';
		var modeop = '';
		var modearg = '';
		var chanModes = gateway.findChannel(channel).modes;
		var channame = channel.substring(1);
		var ch = md5(channame);
		
		modes.changeableSingle.forEach(function(mode){
			mode = mode[0];
			var set = chanModes[mode];
			var checked = $('#'+ch+'_mode_'+mode).prop('checked');
			if(set != checked){
				if(checked){
					if(modeop != '+'){
						modeop = '+';
						modesw += '+';
					}
					modesw += mode;
				} else {
					if(modeop != '-'){
						modeop = '-';
						modesw += '-';
					}
					modesw += mode;
				}
			}
		}, this);
		
		modes.changeableArg.forEach(function(mode){
			mode = mode[0];
			var set = chanModes[mode];
			var checked = $('#'+ch+'_mode_'+mode).prop('checked');
			var text = $('#'+ch+'_mode_'+mode+'_text').val();
			if(set != checked || (set && set != text)){
				if(checked){
					if(modeop != '+'){
						modeop = '+';
						modesw += '+';
					}
					modesw += mode;
					modearg += text + ' ';
				} else {
					if(modeop != '-'){
						modeop = '-';
						modesw += '-';
					}
					modesw += mode;
					if(mode == 'k'){
						modearg += text + ' ';
					}
				}
			}
		}, this);
		
		var modeStr = 'MODE '+channel+' '+modesw+' '+modearg;
		gateway.send(modeStr);
		setTimeout(function(){ gateway.showChannelModes(channel); }, 2000);
	},
	'showInvitePrompt': function(channel) {
		var html = '<p>Nick: <input id="inviteNick" type="text"></p>';
		var button = [ {
			text: 'Anuluj',
			click: function(){
				$(this).dialog('close');
			}
		}, {
			text: 'Zaproś',
			click: function(){
				var nick = $('#inviteNick').val();
				if(!nick || nick == ''){
					$$.alert('Musisz podać nicka!');
					return;
				}
				gateway.send('INVITE '+nick+' '+channel);
				$(this).dialog('close');
			}
		} ];
		$$.displayDialog('admin', 'invite-'+channel, 'Zaproś użytkownika na '+he(channel), html, button);
	},
	'knocking': function(channel, nick, reason) {
		var html = '<b>'+nick+'</b> prosi o dostęp na <b>'+he(channel)+'</b> ('+$$.colorize(reason)+')';
		var button = [ {
			text: 'Zaproś',
			click: function(){
				gateway.send('INVITE '+nick+' '+channel);
				$(this).dialog('close');
			}
		} ];
		$$.displayDialog('knock', nick, 'Prośba o dostęp', html, button);
	},
	'showKick' : function(channel, nick) {
		var html = "<p>Wyrzuć użytkownika "+he(nick)+" z kanału "+he(channel)+". Możesz podać powód dla KICKa, który zostanie wyświetlony dla wszystkich użytkowników kanału.</p>" +
			"<input type='text' id='kickinput' maxlength='307' />";
		var button = [ {
			text: 'Anuluj',
			click: function(){
				$(this).dialog('close');
			}
		}, {
			text: 'Wyrzuć',
			click: function(){
				var reason = $('#kickinput').val();
				if(reason != ''){
					gateway.send('KICK '+channel+' '+nick+' '+reason);
				} else {
					gateway.send('KICK '+channel+' '+nick);
				}
				$(this).dialog('close');
			}
		} ];
		$$.displayDialog('admin', 'kick-'+channel, 'KICK', html, button);
	},
	/*'showBan' : function(channel, nick) {
		$(".status-text").text(" ");
		banData.clear();
		banData.nick = nick;
		banData.channel = channel;

		var nickListItem = gateway.findChannel(channel).nicklist.findNick(nick);
		var host = nickListItem.host;
		var ident = nickListItem.ident;
		var nline = '<td><input type="checkbox" onchange="gateway.banFormatView()" id="banNick" checked="checked"></td><td></td>';
		var html = '<h3>Ban</h3>' +
			"<p>Zablokuj dostęp dla "+he(nick)+" na kanale "+he(channel)+".</p>" +
			'<form action="javascript:void"><table>' +
				'<tr><td>' + nick + '</td><td>!</td>';
		if(ident.charAt(0) == '~'){
			html += '<td>~</td>';
			nline += '<td><input onchange="gateway.banFormatView()" type="checkbox" id="banNoIdent"></td>';
			ident = ident.substr(1);
			banData.noIdent = true;
		}
		banData.ident = ident;
		html += '<td>'+ident+'</td><td>@</td>'
		nline += '<td><input type="checkbox" onchange="gateway.banFormatView()" id="banIdentText" checked="checked"></td><td></td>';
		
		var i = 0;
		var cnt = 0;
		var hostElement = '';
		
		do {
			var c = host.charAt(i);
			switch(c){
				default: hostElement += c; break;
				case ':': case '.':
					html += '<td>'+hostElement+'</td><td>'+c+'</td>';
					nline += '<td><input type="checkbox" onchange="gateway.banFormatView()" id="banHostElement'+cnt+'"></td><td></td>';
					banData.hostElements.push(hostElement);
					banData.hostElementSeparators.push(c);
					hostElement = '';
					cnt++;
					break;
			}
			i++;
		} while(host.charAt(i));
		banData.hostElements.push(hostElement);
		html += '<td>'+hostElement+'</td>';
		nline += '<td><input type="checkbox" onchange="gateway.banFormatView()" id="banHostElement'+cnt+'" checked="checked"></td>';
		html += '</tr><tr>'+nline+'</tr></table></form>' +
			'<p>Postać bana: <span id="banFormat"></span></p>' + 
  //	  $(".status-text").append("<input type='text' class='kickinput' maxlenght='307' />");
			'<p class="statusbutton" onClick="gateway.banClick()">Banuj</p>';
		$(".status-text").html(html);
		if(cnt > 0){
			$('#banHostElement'+(cnt-1)).prop('checked', true);
		}
		$(".statuswindow").fadeIn(200);
		gateway.banFormatView();
	},
	'banClick': function() {
	},
	'banFormatView': function() {
		var banFormat = '';
		if($('#banNick').is(':checked')){
			banFormat += banData.nick;
		} else {
			banFormat += '*';
		}
		banFormat += '!';
		if(banData.noIdent){
			if($('#banNoIdent').is(':checked')){
				banFormat += '~';
			} else {
				banFormat += '*';
			}
		}
		if($('#banIdentText').is(':checked')){
			banFormat += banData.ident;
		} else {
			banFormat += '*';
		}
		banFormat += '@';
		var len = banData.hostElements.length;
		var hostElementAdded = false;
		for(var i=0;i<len;i++){
			if($('#banHostElement' + i).is(':checked')){
				if(!hostElementAdded){
					hostElementAdded = true;
					if(i > 0){
						banFormat += '*'+lastSeparator;
					}
				}
				banFormat += banData.hostElements[i];
				
			} else {
				if(hostElementAdded) {
					banFormat += '*';
				} else {
					var lastSeparator = banData.hostElementSeparators[i];
				}
			}
			if(hostElementAdded && i < len-1){
				banFormat += banData.hostElementSeparators[i];
			}
		}
		if(!hostElementAdded){
			banFormat += '*';
		}
		$('#banFormat').text(banFormat);
		return banFormat;
	},*/
	'getActive': function() {
		if(gateway.active == '--status') {
			return false;
		} else if(gateway.findChannel(gateway.active)) {
			return gateway.findChannel(gateway.active);
		} else if(gateway.findQuery(gateway.active)) {
			return gateway.findQuery(gateway.active);
		} else {
			return false;
		}
	},
	'active': '--status',
	'toggleNickOpt': function(nicklistid) {
		if($('#'+nicklistid+'-opt').is(':visible')) {
			if($('#'+nicklistid+'-opt-info').is(':visible')){
				 $('#'+nicklistid+'-opt-info').hide('blind', {
					direction: "vertical"
				}, 300);
				$('#'+nicklistid+'-opt').removeClass('activeInfo');
			 }
			$('#'+nicklistid+'-opt').hide('blind', {
				direction: "vertical"
			}, 300);
			$('#'+nicklistid).removeClass('activeNick');
		} else {
			$('#'+nicklistid+'-opt').show('blind', {
				direction: "vertical"
			}, 300);
			$('#'+nicklistid).addClass('activeNick');
		}
	},
	'toggleNickOptInfo': function(nicklistid) {
		if($('#'+nicklistid+'-opt-info').is(':visible')){
			 $('#'+nicklistid+'-opt-info').hide('blind', {
				direction: "vertical"
			}, 300);
			$('#'+nicklistid+'-opt').removeClass('activeInfo');
		} else {
			$('#'+nicklistid+'-opt-info').show('blind', {
				direction: "vertical"
			}, 300);
			$('#'+nicklistid+'-opt').addClass('activeInfo');
		}
	},
	'toggleNickOptAdmin': function(nicklistid) {
		if($('#'+nicklistid+'-opt-admin').is(':visible')){
			 $('#'+nicklistid+'-opt-admin').hide('blind', {
				direction: "vertical"
			}, 300);
			$('#'+nicklistid+'-opt').removeClass('activeAdmin');
		} else {
			$('#'+nicklistid+'-opt-admin').show('blind', {
				direction: "vertical"
			}, 300);
			$('#'+nicklistid+'-opt').addClass('activeAdmin');
		}
	},
	'toggleChannelOperOpts': function(channel) {
		var $element = $('#'+gateway.findChannel(channel).id+'-operActions ul');
		if($element.is(':visible')){
			$element.hide('blind', {
				direction: 'vertical'
			}, 300);
			$('#'+gateway.findChannel(channel).id+'-operActions').removeClass('channelAdminActive');
		} else {
			$element.show('blind', {
				direction: 'vertical'
			}, 300);
			$('#'+gateway.findChannel(channel).id+'-operActions').addClass('channelAdminActive');
		}
	},
	'toggleChannelOpts': function(channel) {
		/*var html = '<p>Uwaga: ta funkcjonalność nie jest jeszcze gotowa, więc może być niekompletna lub działać niepoprawnie!</p>'+
			'<table><tr><td>Automatycznie wchodź na ten kanał przy każdym połączeniu (wymaga zarejestrowanego nicka)</td>'+
			'<td><button onclick="gateway.send(\'NS AJOIN ADD '+bsEscape(chan)+'\')">Włącz</button> <button onclick="gateway.send(\'NS AJOIN DEL '+bsEscape(chan)+'\')">Wyłącz</button></td>'+
			'</tr></table>';
		$$.displayDialog('admin', chan, 'Ustawienia dla kanału '+chan, html);*/
		var $element = $('#'+gateway.findChannel(channel).id+'-channelOptions ul');
		if($element.is(':visible')){
			$element.hide('blind', {
				direction: 'vertical'
			}, 300);
			$('#'+gateway.findChannel(channel).id+'-channelOptions').removeClass('channelAdminActive');
		} else {
			$element.show('blind', {
				direction: 'vertical'
			}, 300);
			$('#'+gateway.findChannel(channel).id+'-channelOptions').addClass('channelAdminActive');
		}
	},
	'showPermError': function(text) {
		var html = 'Brak uprawnień' +
			'<br>Nie masz wystarczających uprawnień aby wykonać żądaną akcję.<br>'+text;
		$$.displayDialog('error', 'error', 'Błąd', html);
	},
	'clickQuit': function() {
		var html = '<form id="quit-form" onsubmit="gateway.quit();" action="javascript:void(0);">'+
			'Wiadomość pożegnalna: <input type="text" id="quit-msg" value="Użytkownik rozłączył się" />';
			'</form>';
		var button = [ {
			text: 'Rozłącz',
			click: function(){
				$('#quit-form').submit();
				$(this).dialog('close');
			}
		}, {
			text: 'Anuluj',
			click: function(){
				$(this).dialog('close');
			}
		} ];
		$$.displayDialog('confirm', 'quit', 'Wyjście z IRC', html, button);
		$('#quit-msg').focus();
		$('#quit-msg').select();
	},
	'quit': function() {
		commands.quit.callback(['quit'], '/quit '+$('#quit-msg').val());
		$('.notifywindow').fadeOut(100);
	},
	'completion': {
		'string': '',
		'rawStr': '',
		'repeat': 0,
		'array': [],
		'lastPos': -1,
		'find': function(string, rawStr, comPos) {
			var complarr = [];
			var ccount = 0;
			//komendy
			//complarr[0] = string;
			//ccount++;
			if(string.length > 0 && string.indexOf('/') == 0 && comPos == 0) {
				for (i in commands) {
					if(i.indexOf(string.slice(1).toLowerCase()) == 0) {
						complarr[ccount] = '/'+i;
						ccount++;
					}
				}
			//else, bo jak sa komendy to nic innego nie trzeba uzup
			} else {
				if(string.indexOf('#') == 0) {
					for (var ichannel = 0; ichannel < gateway.channels.length; ichannel++) {
						if(gateway.channels[ichannel].name.toLowerCase().replace(/^[^a-z0-9]/ig).indexOf(string.toLowerCase().replace(/^[^a-z0-9]/ig)) == 0) {
							complarr[ccount] = gateway.channels[ichannel].name;
							ccount++;
						}
					}
				} else {
					if(gateway.findChannel(gateway.active)) {
						for (var inick=0; inick < gateway.findChannel(gateway.active).nicklist.list.length; inick++) {
							if(gateway.findChannel(gateway.active).nicklist.list[inick].nick.toLowerCase().replace(/^[^a-z0-9]/ig).indexOf(string.toLowerCase().replace(/^[^a-z0-9]/ig)) == 0) {
								complarr[ccount] = gateway.findChannel(gateway.active).nicklist.list[inick].nick;
								if(comPos == 0) {
									complarr[ccount] += ':';
								}
								ccount++;
							}
						}
					}
				}
			}
			return complarr;
		}
	},
	'doComplete': function() {
		if(gateway.completion.repeat == 0 || gateway.completion.array.length == 0) {
			var rawstr = $('#input').val().replace(/^\s+/g, '').replace(/\s+$/g, '');
			var str = $('#input').val().replace(/^\s+/g, '').replace(/\s+$/g, '').split(/\s+/);
			if(str && str.length > 0 && str[str.length-1].length > 0) {
				gateway.completion.array = gateway.completion.find(str[str.length-1], rawstr, str.length-1);
				if(gateway.completion.array.length > 0) {
					str[str.length-1] = gateway.completion.array[0] + " ";
					gateway.completion.repeat = 1;
					$('#input').val(str.join(" "));
					gateway.completion.lastPos = 0;
				}
				//gateway.statusWindow.appendMessage('%s - %s<br />', [ gateway.completion.lastPos, gateway.completion.array.toString() ]);
			}
		} else if(gateway.completion.array.length > 0) {
			var str = $('#input').val().replace(/^\s+/g, '').replace(/\s+$/g, '').split(/\s+/);
			if(gateway.completion.lastPos+1 < gateway.completion.array.length) {
				str[str.length-1] = gateway.completion.array[gateway.completion.lastPos+1] + " ";
				gateway.completion.lastPos++;
				$('#input').val(str.join(" "));
			} else {
				gateway.completion.lastPos = 0;
				str[str.length-1] = gateway.completion.array[0] + " ";
				$('#input').val(str.join(" "));
			}
		}
	},
	'parseChannelMode': function(args, chan, type) {
		var plus = true;
		var nextarg = 1;
		var modearr = args[0].split('');
		var log = '';
		var mode = '';
		var modechar = '';
		var infoText = '';
		var dir = '';
		for (i in modearr) {
			if(modearr[i] == '+') {
				log += "Change +\n";
				plus = true;
				if(type == 1){
					dir = '';
				} else {
					dir = 'ustawił ';
				}
			} else if(modearr[i] == '-') {
				if(type == 1){
					continue;
				}
				dir = 'zdjął ';
				log += "Change -\n";
				plus = false;
			} else if($.inArray(modearr[i], modes.argBoth) > -1) {
				log += "Mode 'both' "+plus+' '+modearr[i]+' '+args[nextarg]+"\n";
				infoText = infoText.apList(dir+getModeInfo(modearr[i], type)+' '+args[nextarg]);
				if(modearr[i] == 'k' || modearr[i] == 'f'){
					if(plus){
						chan.modes[modearr[i]] = args[nextarg];
					} else {
						chan.modes[modearr[i]] = false;
					}
				}
				nextarg++;
			} else if($.inArray(modearr[i], modes.argAdd) > -1 ) {
				log += "Mode 'add' "+plus+' '+modearr[i]+' '+args[nextarg]+"\n";
				if(plus){
					chan.modes[modearr[i]] = args[nextarg];
					infoText = infoText.apList(dir+getModeInfo(modearr[i]+'-add', type)+' '+args[nextarg]);
					nextarg++;
				} else {
					infoText = infoText.apList(dir+getModeInfo(modearr[i]+'-remove', type));
					chan.modes[modearr[i]] = false;
				}
			} else if($.inArray(modearr[i], modes.user) > -1) {
				modechar = modearr[i];
				log += "Mode 'user' "+plus+' '+modearr[i]+' '+args[nextarg]+"\n";
				if(plus) {
					if(chan.nicklist.findNick(args[nextarg])) {
						mode = '';
						switch (modechar) {
							case 'q':
								mode = 'owner'
								break;
							case 'a':
								mode = 'admin'
								break;
							case 'o':
								mode = 'op'
								break;
							case 'h':
								mode = 'halfop'
								break;
							case 'v':
								mode = 'voice'
								break;
							default:
								//i tak nie nastapi
								break;
						}
						chan.nicklist.findNick(args[nextarg]).setMode(mode, true);
						infoText = infoText.apList('dał '+getModeInfo(modechar, type)+' dla <span class="modevictim">'+args[nextarg]+'</span>');
					}
				} else {
					if(chan.nicklist.findNick(args[nextarg])) {
						mode = '';
						switch (modechar) {
							case 'q':
								mode = 'owner'
								break;
							case 'a':
								mode = 'admin'
								break;
							case 'o':
								mode = 'op'
								break;
							case 'h':
								mode = 'halfop'
								break;
							case 'v':
								mode = 'voice'
								break;
							default:
								//i tak nie nastapi
								break;
						}
						chan.nicklist.findNick(args[nextarg]).setMode(mode, false);
						infoText = infoText.apList('odebrał '+getModeInfo(modechar, type)+' <span class="modevictim">'+args[nextarg]+'</span>');
					}
				}
				nextarg++;
			} else {
				log += "Mode 'normal' "+plus+' '+modearr[i]+"\n";
				chan.modes[modearr[i]] = plus;
				infoText = infoText.apList(dir+' '+getModeInfo(modearr[i], type));
			}
		}
		return infoText;
	//	console.log(log);
	},
	'storageHandler': function(evt) {
		if(!evt.newValue){
			return;
		}
		if(conn.waitForAlive && evt.key == 'checkAliveReply'){
			var nick = evt.newValue;
			conn.waitForAlive = false;
			
			var chan = guser.channels[0];
			var html = 'Masz już otwartą bramkę w innej karcie przeglądarki i jesteś połączony jako <strong>'+he(evt.newValue)+'</strong>! Nie można otworzyć drugiej bramki.';
			$('#not_connected_wrapper').fadeOut(400);
			
			try {
				localStorage.removeItem(evt.key);
				if(chan && chan != '#'){
					html += '<br>Przejdź do tamtej karty, aby wejść na <strong>'+chan+'</strong>.';
					localStorage.setItem('reqChannelJoin', guser.channels[0]);
				}
			} catch(e) {}


			$$.displayDialog('connect', '0', 'Już połączony!', html);
		}
		if(gateway.connectStatus == statusConnected){
			try {
				if(evt.key == 'checkAlive'){
					localStorage.removeItem(evt.key);
					localStorage.setItem('checkAliveReply', guser.nick);
				}
				if(evt.key == 'reqChannelJoin'){
					var chan = evt.newValue;
					localStorage.removeItem(evt.key);
					for(var i=0; i<gateway.channels.length; i++){
						if(gateway.channels[i].name.toLowerCase() == chan.toLowerCase()){
							return;
						}
					}
					var html = 'Inna karta chce dołączyć do kanału <strong>'+chan+'</strong>.';
					var button = [ {
						text: 'Anuluj',
						click: function(){
							$(this).dialog('close');
						}
					}, {
						text: 'Dołącz',
						click: function(){
							gateway.send('JOIN '+chan);
							$(this).dialog('close');
						}
					} ];
					$$.displayDialog('confirm', 'join', 'Potwierdź', html, button);
				}
			} catch(e) {}
		}
	},
	'quitQueue': [],
	'quitTimeout': false,
	'netJoinUsers': {},
	'netJoinQueue': [],
	'netJoinTimeout': false,
	'processNetsplit': function(){
		gateway.quitTimeout = false;
		if(gateway.quitQueue.length == 0) return;
		
		for(c in gateway.channels){
			var nickNames = '';
			var chan = gateway.channels[c];
			var nicklist = chan.nicklist;
			for(n in gateway.quitQueue){
				var nick = gateway.quitQueue[n].sender.nick;
				if(!gateway.netJoinUsers[chan.name]){
					gateway.netJoinUsers[chan.name] = {};
				}
				gateway.netJoinUsers[chan.name][nick] = (+new Date)/1000;
				if(nicklist.findNick(nick)){
					nicklist.removeNick(nick);
					if(nickNames != ''){
						nickNames += ', ';
					}
					nickNames += nick;
				}
			}
			if(nickNames != ''){
				chan.appendMessage(messagePatterns.netsplit, [$$.niceTime(), nickNames]);
			}
		}
		gateway.quitQueue = [];
	},
	'processNetjoin': function(){
		gateway.netJoinTimeout = false;
		if(gateway.netJoinQueue.length == 0) return;
		
		for(c in gateway.channels){
			var nickNames = '';
			var chan = gateway.channels[c];
			var nicklist = chan.nicklist;
			for(n in gateway.netJoinQueue){
				if(gateway.netJoinQueue[n].msg.text.toLowerCase() != chan.name.toLowerCase()){
					continue;
				}
				var nick = gateway.netJoinQueue[n].sender.nick;
				if(nickNames != ''){
					nickNames += ', ';
				}
				nickNames += nick;
			}
			if(nickNames != ''){
				chan.appendMessage(messagePatterns.netjoin, [$$.niceTime(), nickNames]);
			}
		}
		gateway.netJoinQueue = [];
	},
	'processQuit': function(msg){
		if(gateway.findQuery(msg.sender.nick)) {
			if (!$('#showPartQuit').is(':checked')) {
				gateway.findQuery(msg.sender.nick).appendMessage(messagePatterns.quit, [$$.niceTime(), he(msg.sender.nick), he(msg.sender.ident), he(msg.sender.host), $$.colorize(msg.text)]);
			}
		}

		if(msg.text.match(/^[^ :]+\.[^ :]+ [^ :]+\.[^ :]+$/)){
			gateway.quitQueue.push(msg);
			if(gateway.quitTimeout){
				clearTimeout(gateway.quitTimeout);
			}
			gateway.quitTimeout = setTimeout(gateway.processNetsplit, 700);
			return;
		}
		
		for(c in gateway.channels) {
			if(gateway.channels[c].nicklist.findNick(msg.sender.nick)) {
				gateway.channels[c].nicklist.removeNick(msg.sender.nick);
				if (!$('#showPartQuit').is(':checked')) {
					gateway.channels[c].appendMessage(messagePatterns.quit, [$$.niceTime(), he(msg.sender.nick), he(msg.sender.ident), he(msg.sender.host), $$.colorize(msg.text)]);
				}
			}
		}
	},
	'processJoin': function(msg){
		var chan = gateway.findChannel(msg.text);
		var dlimit = (+new Date)/1000 - 300;
		if(!chan) return;
		var netjoin = false;
		if(gateway.netJoinUsers[msg.text] && gateway.netJoinUsers[msg.text][msg.sender.nick]){
			if(gateway.netJoinUsers[msg.text][msg.sender.nick] > dlimit){
				netjoin = true;
			}
			delete gateway.netJoinUsers[msg.text][msg.sender.nick];
		} 
		if(netjoin){
			gateway.netJoinQueue.push(msg);
			if(gateway.netJoinTimeout){
				clearTimeout(gateway.netJoinTimeout);
			}
			gateway.netJoinTimeout = setTimeout(gateway.processNetjoin, 700);
		} else if (!$('#showPartQuit').is(':checked')) {
			chan.appendMessage(messagePatterns.join, [$$.niceTime(), he(msg.sender.nick), he(msg.sender.ident), he(msg.sender.host), msg.text]);
		}
	},
	'findOrCreate': function(name, setActive){
		if(!name || name == ''){
			return null;
		}
		if(name.charAt(0) == '#'){ //kanał
			var tab = gateway.findChannel(name);
			if(!tab) {
				tab = new Channel(name);
				gateway.channels.push(tab);
			}
		} else { //query
			tab = gateway.findQuery(name);
			if(!tab) {
				tab = new Query(name);
				gateway.queries.push(tab);
			}
		}
		if(setActive){
			gateway.switchTab(name);
		}
		return tab;
	},
	'smallListLoading': false,
	'smallListData': [],
	'toggleChanList': function() {
		if($('#chlist-body').is(':visible')){
			$('#chlist-body').css('display', '');

			$('#chlist').css('height', '').css('top', '');
			$('#nicklist').css('bottom', '');
			var nicklistBottom = $('#nicklist').css('bottom');
			$('#nicklist').css('bottom', '36%');
			$("#nicklist").animate({
				"bottom":	nicklistBottom
			}, 400);
			
			
			
			$('#chlist-button').text('⮙ lista kanałów ⮙');
		} else {
			$('#chlist-body').css('display', 'block');
			$('#chlist').css('height', 'initial').css('top', '64.5%');
		//	$('#nicklist').css('bottom', '31%');
			$("#nicklist").animate({
				"bottom":	"36%"
			}, 400);
			$('#chlist-button').text('⮛ schowaj listę ⮛');
			if(!$('#chlist-body > table').length){
				gateway.smallListLoading = true;
				gateway.send('LIST >9');
			}
		}
	},
	'refreshChanList': function() {
		gateway.smallListLoading = true;
		gateway.send('LIST >9');
		$('#chlist-body').html('Poczekaj, trwa ładowanie...');
	},
	'parseUmodes': function(modes) {
		var plus = false;
		for(var i=0; i<modes.length; i++){
			var c = modes.charAt(i);
			switch(c){
				case '+': plus = true; break;
				case '-': plus = false; break;
				case ' ': return;
				default: guser.setUmode(c, plus); break;
			}
		}
	}
}

