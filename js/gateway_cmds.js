var ircCommand = {
	'perform': function(command, args, text){
		ircCommand.send(command, args, text);
	},
	'performQuick': function(command, args, text){ // TODO zrobić
		ircCommand.send(command, args, text);
	},
	'performSlow': function(command, args, text){ // TODO zrobić
		ircCommand.send(command, args, text);
	},
	'flushCmdQueue': function(){ // TODO zrobić
	},
	'send': function(command, args, text){
		var cmdString = command;
		for(var i=0; i<args.length; i++){
			cmdString += ' '+args[i];
		}
		if(text){
			cmdString += ' :'+text;
		}
		gateway.send(cmdString); // TODO przenieść buforowanie tutaj
	},
	'sendMessage': function(dest, text, notice, slow){
		if(notice){
			var cmd = 'NOTICE';
		} else {
			var cmd = 'PRIVMSG';
		}
		if(slow){
			ircCommand.performSlow(cmd, [dest], text);
		} else {
			ircCommand.perform(cmd, [dest], text);
		}
	},
	'sendMessageSlow': function(dest, text, notice){
		ircCommand.sendMessage(dest, text, notice, true);
	},
	'channelInvite': function(channel, user){
		ircCommand.perform('INVITE', [user, channel]);
	},
	'channelKick': function(channel, user, reason){
		if(!reason){
			ircCommand.performQuick('KICK', [channel, user]);
		} else {
			ircCommand.performQuick('KICK', [channel, user], reason);
		}
		
	},
	'channelJoin': function(channels, passwords){ // TODO obsługa haseł jeśli tablice
		if(Array.isArray(channels)){
			var channelString = '';
			if(channels.length == 0) return;
			for(var i=0; i<channels.length; i++){
				var channel = channels[i];
				if(channel instanceof Channel){
					channel = channel.name;
				}
				if(i>0) channelString += ',';
				channelString += channel;
			}
			ircCommand.perform('JOIN', [channelString]);
		} else {
			if(passwords){
				ircCommand.perform('JOIN', [channels, passwords]);
			} else {
				ircCommand.perform('JOIN', [channels]);
			}
			
		}
	},
	'channelTopic': function(chan, text){
		if(text){
			ircCommand.perform('TOPIC', [chan], text);
		} else {
			ircCommand.perform('TOPIC', [chan]);
		}
	},
	'channelKnock': function(chan, text){
		if(!text){
			ircCommand.perform('KNOCK', [chan]);
		} else {
			ircCommand.perform('KNOCK', [chan], text);
		}
	},
	'channelNames': function(chan){
		ircCommand.perform('NAMES', [chan]);
	},
	'listChannels': function(text){
		if(text){
			ircCommand.perform('LIST', [text]);
		} else {
			ircCommand.perform('LIST');
		}
	},
	'changeNick': function(nick){
		ircCommand.performQuick('NICK', [nick]);
	},
	'sendCtcpRequest': function(dest, text){
		ircCommand.sendMessage(dest, '\001'+text+'\001');
	},
	'sendCtcpReply': function(dest, text){
		ircCommand.sendMessage(dest, '\001'+text+'\001', true, true);
	},
	'serviceCommand': function(service, command, args){
		if(args.constructor !== Array){
			var args = [args];
		}
		var commandString = '';
		for(var i=0; i<args.length; i++){
			commandString += ' '+args[i];
		}
		ircCommand.performQuick(service, [command, commandString]);
	},
	'NickServ': function(command, args){
		ircCommand.serviceCommand('NS', command, args);
	},
	'ChanServ': function(command, args){
		ircCommand.serviceCommand('CS', command, args);
	},
	'mode': function(dest, args){
		ircCommand.performQuick('MODE', [dest, args]);
	},
	'umode': function(args){
		ircCommand.mode(guser.nick, args);
	},
	'quit': function(text){
		ircCommand.performQuick('QUIT', [], text);
		gateway.connectStatus = statusDisconnected;
		ircCommand.flushCmdQueue();
	},
	'whois': function(nick){
		ircCommand.perform('WHOIS', [nick, nick]);
	},
	'who': function(dest){ // TODO dorobić zabezpieczenie przed dużą ilością żądań na raz
		ircCommand.perform('WHO', [dest]);
	}
};

