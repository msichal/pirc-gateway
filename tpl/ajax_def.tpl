	<body>
		<div id="background-wrapper"></div>
		<div id="not_connected_wrapper">
			<img src="/styles/img/gbg.png" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" />
			<div id="not_connected_div">
				<div class="not-connected-text">
					<h3>Ładowanie</h3>
					<p>Aby korzystać z bramki należy włączyć obsługę JavaScript.</p>
				</div>
			</div>
		</div>	
		
		<div id="query-umodes-dialog" title="Blokowanie wiadomości prywatnych">
			Nie chcę otrzymywać wiadomości prywatnych:
			<table>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="setUmodeD" onchange="disp.changeSettings(event)" /></td>
					<td class="info">żadnych (tryb +D)</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="setUmodeR" onchange="disp.changeSettings(event)" /></td>
					<td class="info">od niezarejestrowanych użytkowników (tryb +R)</td>
				</tr>
			</table>
		</div>
		<div id="options-dialog" title="Ustawienia">
			<table>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="showPartQuit" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Nie pokazuj wiadomości PART/JOIN/QUIT (wejścia/wyjścia z kanałów)</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="showMode" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Nie pokazuj wiadomości MODE (zmian trybów)</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="tabsListBottom" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Listę zakładek pokazuj na dole strony</td>
				</tr>
				<tr title="Pokazuje informację user@host przy dołączaniu i opuszczaniu kanałów przez użytkowników">
					<td class="optionsCheckBox"><input type="checkbox" id="showUserHostnames" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Pokazuj nazwy hosta użytkowników</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="autoReconnect" onchange="disp.changeSettings(event)" checked="checked" /></td>
					<td class="info">Automatycznie łącz ponownie po rozłączeniu</td>
				</tr>
				<tr title="Ustawienie nie wpływa na linki, które są już wyświetlone">
					<td class="optionsCheckBox"><input type="checkbox" id="displayLinkWarning" onchange="disp.changeSettings(event)" checked="checked" /></td>
					<td class="info">Pokazuj ostrzeżenia o niebezpiecznych linkach</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="blackTheme" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Ciemny motyw bramki (eksperymentalny)</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="coloredNicks" onchange="disp.changeSettings(event)" checked="checked" /></td>
					<td class="info">Koloruj nicki w oknie rozmowy</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="newMsgSound" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Informuj dźwiękiem o nowej wiadomości</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="dispEmoji" onchange="disp.changeSettings(event)" checked="checked" /></td>
					<td class="info">Wyświetlaj emoji w miejsce emotikon tekstowych (na przykład "🙂" w miejsce ":)")</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="sendEmoji" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Wysyłaj powyższe emoji na IRC</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="monoSpaceFont" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Wyświetlaj treść rozmowy fontem o stałej szerokości</td>
				</tr>
				<tr>
					<td class="optionsCheckBox"><input type="checkbox" id="autoDisconnect" onchange="disp.changeSettings(event)" checked="checked" /></td>
					<td class="info">Automatycznie rozłączaj przy zamykaniu strony</td>
				</tr>
				<tr style="display:none;">
					<td class="optionsCheckBox"><input type="checkbox" id="automLogIn" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Automatyczne łączenie (bez podawania nicka i hasła)</td>
				</tr>
				<tr>
					<td><input type="text" id="backlogCount" onchange="disp.changeSettings(event)" /></td>
					<td class="info">Ilość linii w historii rozmów z poprzedniej wizyty</td>
				</tr>
				<tr title="Gdy rozmowa prywatna jest już otwarta, to, niezależnie od tego ustawienia, tam pojawią się wszystkie NOTICE">
					<td colspan="2">
						Sposób wyświetlania wiadomości NOTICE &nbsp;
						<select id="noticeDisplay" onchange="disp.changeSettings(event)">
							<option value="0">Wyskakujące okienko</option>
							<option value="1">Rozmowa prywatna</option>
							<option value="2">Zakładka statusu</option>
						</select>
					</td>
				</tr>
				<tr><td colspan="2"><a href="javascript:ignore.showIgnoreManagement();">Zarządzaj ignorowanymi nickami</a></td></tr>
			</table>
		</div>
		
		<div id="about-dialog" title="Informacje">
				<h3>Bramka WWW PIRC.PL</h3>
				<p>Wersja: <script type="text/javascript">document.write(gatewayVersion);</script></p>
				<p>Pokaż <a href="http://pirc.pl/teksty/bramka_ajax" target="blank">ostatnie zmiany</a></p>
				<p>&copy; 2010-2016 <a href="http://pirc.pl">PIRC.PL</a>. Wszelkie prawa zastrzeżone</p>
		</div>

		<div id="top_menu">
			<div id="leftarrow">
				<input class="top" type="image" src="/styles/img/g_lewo.png" value="" onClick="gateway.prevTab()" />
			</div>
			<div id="tab-wrapper">
				<ul class="tabs" id="tabs">
					<li id="--status-tab"><a href="javascript:void(0);" onclick="gateway.switchTab('--status')" class="switchTab">Status</a><a href="#"></a></li>
				</ul>
			</div>
			<div id="rightarrow">
				<input class="top" type="image" src="/styles/img/g_prawo.png" value="" onClick="gateway.nextTab()" />
			</div>
		</div>
		
		<div id="options-box">
			<a id="button-tsize" href="javascript:void(0);" onclick="disp.showSizes();" title="Zmień rozmiar tekstu"></a>
			<a id="button-options" href="javascript:void(0);" onClick="disp.showOptions();" title="Ustawienia"></a> 
			<a id="button-about" href="javascript:void(0);" onClick="disp.showAbout();" title="Informacje o bramce"></a>
			<a id="button-quit" href="javascript:void(0);" onClick="gateway.clickQuit();" title="Rozłącz z IRC"></a> 
		</div>

		<div id="wrapper">
			<div id="info">
				<span id="--status-topic">
					<h1>Status</h1>
					<h2>------</h2>
				</span>
			</div>
			<div id="chatbox">
				<div id="chat-wrapper">
					<div style="width: 98%; margin: 0 auto; margin-top: 1%; margin-bottom: 1%;" id="main-window">
						<span id="--status-window"></span>
					</div>
				</div>
			</div>
			<div id="chstats">
				<div class="chstatswrapper">
					<span class="chstats-text" id="--status-chstats">Okno statusu</span>
				</div>
			</div>
			<div id="nicklist-closed">
				<div id="nicklist-hide-button" class="closed" onclick="gateway.nickListToggle()"></div>
			</div>
			<div id="nicklist">
				<div id="nick-wrapper">
					<div style="margin: 0 auto; width: 93%; margin-top: 3%; margin-bottom: 3%;" id="nicklist-main">
						<div id="nicklist-hide-button" onclick="gateway.nickListToggle()"></div>
						<div id="nicklist-hide-wrap">
							<span id="--status-nicklist">
							</span>
						</div>
					</div>
				</div>
			</div>
			<div id="chlist">
				<div class="chlistwrapper">
					<div id="chlist-body">
						Poczekaj, trwa ładowanie...
					</div>
					<div id="chlist-button" onclick="gateway.toggleChanList()">⮙ lista kanałów ⮙</div>
				</div>
			</div>
			<div id="nickopts">
				<div id="nickopts-wrapper">
					<div class="nickoptsButton" onclick="gateway.toggleNickOpts()">Opcje nicka</div>
					<ul id="nickOptions">
						<li id="nickRegister" onclick="services.registerMyNick()">Zarejestruj nicka</li>
						<li onclick="services.changeMyNick()">Zmień nicka</li>
						<li onclick="disp.showQueryUmodes()">Blokowanie wiadomości prywatnych</li>
						<!--<li class="nickRegistered" onclick="services.setCloak()">Ustaw automatycznego vhosta</li>-->
						<li class="nickRegistered" onclick="services.setVhost()">Poproś o vhosta</li>
						<li class="nickRegistered" onclick="services.perform('ns', 'alist', true)">Pokaż kanały, na których masz stałe uprawnienia</li>
						<li class="nickRegistered" onclick="services.perform('ns', 'ajoin list', true)">Pokaż kanały, na które automatycznie wchodzisz</li>
						<!--<li onclick="gateway.send(\'MODE '+bsEscape(this.name)+' I\')" title="Znajdujący się na liście nie potrzebują zaproszenia, gdy jest ustawiony tryb +i">Lista wyjątków i (I)</li>
						<li onclick="gateway.showChannelModes(\''+bsEscape(this.name)+'\')">Tryby kanału</li>
						<li onclick="gateway.showInvitePrompt(\''+bsEscape(this.name)+'\')">Zaproś na kanał</li>
						<li onclick="services.showChanServCmds(\''+bsEscape(this.name)+'\')">Polecenia ChanServ</li>
						<li onclick="services.showBotServCmds(\''+bsEscape(this.name)+'\')">Polecenia BotServ</li>-->
					</ul>
				</div>
			</div>
		</div>

		<div id="inputbox">
			<div id="input-wrapper">
				<table class="nostyle"><tr>
					<!--<td style="width: 150px; text-align: right;"><span id="usernick" class="yournickname">{$nick}</span></td>-->
					<td style="width: 10px;"><input type="image" src="/styles/img/plus.png" value="" class="completion" onClick="gateway.doComplete();$('#input').focus()" title="Uzupełnij nick lub polecenie [Tab]" /></td>
					<td style="padding-right: 10px; padding-left: 5px;"> <input id="input" type="text" name="input" class="input" autocomplete="off"/></td>
					<td style="width: 10px;"><input type="image" src="/styles/img/smiley_mu.png" class="symbols" onClick="disp.symbolWindowShow()" title="Emotikony i symbole" /></td>
					<td style="width: 10px;"><input type="image" src="/styles/img/kolorki.png" value="" class="insertColor" onClick="disp.colorWindowShow()" title="Kolory i formatowanie" /></td>
					<td style="width: 10px;"><input type="submit" value="&bull;" class="submit" OnClick="gateway.enterPressed()" title="Wyślij [Enter]" /></td>
				</tr></table>
			</div>
		</div>

		<div class="statuswindow">
			<div class="status-close" onclick="gateway.closeStatus()">
				&#215;
			</div>
			<div class="status-text">
			</div>
		</div>
		
		<div id="color-dialog" title="Formatowanie tekstu">
			<h3>Wstaw kod koloru</h3>
			<table>
				<tr>
					<td><button type="button" class="colorButton" value="" style="background-color: white;" onClick="gateway.insertColor(0)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: black;" onClick="gateway.insertColor(1)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #1B54FF;" onClick="gateway.insertColor(2)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #4BC128;" onClick="gateway.insertColor(3)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #F15254;" onClick="gateway.insertColor(4)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #9B4244;" onClick="gateway.insertColor(5)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #D749D6;" onClick="gateway.insertColor(6)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #AEB32F;" onClick="gateway.insertColor(7)" /></td>
				</tr>
				<tr>
					<td><button type="button" class="colorButton" value="" style="background-color: #E7EF3B;" onClick="gateway.insertColor(8)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #59FF54;" onClick="gateway.insertColor(9)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #00DFD6;" onClick="gateway.insertColor(10)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #60FFF8;" onClick="gateway.insertColor(11)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #5F6BFF;" onClick="gateway.insertColor(12)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #FF83F2;" onClick="gateway.insertColor(13)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #B5B5B5;" onClick="gateway.insertColor(14)" /></td>
					<td><button type="button" class="colorButton" value="" style="background-color: #E0E0E0;" onClick="gateway.insertColor(15)" /></td>
				</tr>
			</table>
			<h3>Wstaw kod specjalny</h3>
			<button type="button" class="textFormat" onClick="gateway.insertCode(3)">Wyłącz kolor</button>
			<button type="button" class="textFormat" onClick="gateway.insertCode(2)">Pogrubienie</button>
			<button type="button" class="textFormat" onClick="gateway.insertCode(22)">Odwróć kolory</button>
			<button type="button" class="textFormat" onClick="gateway.insertCode(29)">Pochylenie</button>
			<button type="button" class="textFormat" onClick="gateway.insertCode(31)">Podkreślenie</button>
   			<button type="button" class="textFormat" onClick="gateway.insertCode(15)">Czyść wygląd</button>
   		</div>
		
		<div id="symbol-dialog" title="Symbole">
			<h3>Emotikony</h3>
			<a onclick="gateway.insert('☺')">☺</a> 
			<a onclick="gateway.insert('😀')">😀</a> <a onclick="gateway.insert('😁')">😁</a> <a onclick="gateway.insert('😂')">😂</a> <a onclick="gateway.insert('😃')">😃</a> <a onclick="gateway.insert('😄')">😄</a> <a onclick="gateway.insert('😅')">😅</a>
			<a onclick="gateway.insert('😅')">😅</a> <a onclick="gateway.insert('😇')">😇</a> <a onclick="gateway.insert('😈')">😈</a> <a onclick="gateway.insert('😉')">😉</a> <a onclick="gateway.insert('😊')">😊</a> <a onclick="gateway.insert('😋')">😋</a>
			<a onclick="gateway.insert('😌')">😌</a> <a onclick="gateway.insert('😍')">😍</a> <a onclick="gateway.insert('😎')">😎</a> <a onclick="gateway.insert('😏')">😏</a> <a onclick="gateway.insert('😐')">😐</a> <a onclick="gateway.insert('😑')">😑</a>
			<a onclick="gateway.insert('😒')">😒</a> <a onclick="gateway.insert('😓')">😓</a> <a onclick="gateway.insert('😔')">😔</a> <a onclick="gateway.insert('😕')">😕</a> <a onclick="gateway.insert('😖')">😖</a> <a onclick="gateway.insert('😗')">😗</a>
			<a onclick="gateway.insert('😘')">😘</a> <a onclick="gateway.insert('😙')">😙</a> <a onclick="gateway.insert('😚')">😚</a> <a onclick="gateway.insert('😛')">😛</a> <a onclick="gateway.insert('😜')">😜</a> <a onclick="gateway.insert('😝')">😝</a>
			<a onclick="gateway.insert('😞')">😞</a> <a onclick="gateway.insert('😟')">😟</a> <a onclick="gateway.insert('😠')">😠</a> <a onclick="gateway.insert('😡')">😡</a> <a onclick="gateway.insert('😢')">😢</a> <a onclick="gateway.insert('😣')">😣</a>
			<a onclick="gateway.insert('😤')">😤</a> <a onclick="gateway.insert('😥')">😥</a> <a onclick="gateway.insert('😦')">😦</a> <a onclick="gateway.insert('😧')">😧</a> <a onclick="gateway.insert('😨')">😨</a> <a onclick="gateway.insert('😩')">😩</a>
			<a onclick="gateway.insert('😪')">😪</a> <a onclick="gateway.insert('😫')">😫</a> <a onclick="gateway.insert('😬')">😬</a> <a onclick="gateway.insert('😭')">😭</a> <a onclick="gateway.insert('😮')">😮</a> <a onclick="gateway.insert('😯')">😯</a>
			<a onclick="gateway.insert('😰')">😰</a> <a onclick="gateway.insert('😱')">😱</a> <a onclick="gateway.insert('😲')">😲</a> <a onclick="gateway.insert('😳')">😳 </a> <a onclick="gateway.insert('😴')">😴</a> <a onclick="gateway.insert('😵')">😵</a>
			<a onclick="gateway.insert('😶')">😶</a> <a onclick="gateway.insert('😷')">😷</a> <a onclick="gateway.insert('😸')">😸</a> <a onclick="gateway.insert('😹')">😹</a> <a onclick="gateway.insert('😽')">😽</a> <a onclick="gateway.insert('😿')">😿</a>
			<a onclick="gateway.insert('😘')">😘</a> <a onclick="gateway.insert('😙')">😙</a> <a onclick="gateway.insert('😚')">😚</a> <a onclick="gateway.insert('😛')">😛</a> <a onclick="gateway.insert('😜')">😜</a> <a onclick="gateway.insert('😝')">😝</a>
			<a onclick="gateway.insert('🙁')">🙁</a> <a onclick="gateway.insert('🙂')">🙂</a> <a onclick="gateway.insert('🙃')">🙃</a> <a onclick="gateway.insert('💀')">💀</a>
			<h3>Symbole inżynierskie</h3>
			<a onclick="gateway.insert('µ')">µ</a> <a onclick="gateway.insert('Ω')">Ω</a> <a onclick="gateway.insert('φ')">φ</a> <a onclick="gateway.insert('Δ')">Δ</a> <a onclick="gateway.insert('Θ')">Θ</a> <a onclick="gateway.insert('Λ')">Λ</a>
			<a onclick="gateway.insert('Σ')">Σ</a> <a onclick="gateway.insert('Φ')">Φ</a> <a onclick="gateway.insert('Ψ')">Ψ</a> <a onclick="gateway.insert('α')">α</a>
			<a onclick="gateway.insert('β')">β</a> <a onclick="gateway.insert('χ')">χ</a> <a onclick="gateway.insert('τ')">τ</a> <a onclick="gateway.insert('δ')">δ</a> <a onclick="gateway.insert('ε')">ε</a> <a onclick="gateway.insert('η')">η</a>
			<a onclick="gateway.insert('ψ')">ψ</a> <a onclick="gateway.insert('θ')">θ</a> <a onclick="gateway.insert('λ')">λ</a> <a onclick="gateway.insert('ξ')">ξ</a> <a onclick="gateway.insert('ρ')">ρ</a> <a onclick="gateway.insert('σ')">σ</a>
			<a onclick="gateway.insert('√')">√</a> <a onclick="gateway.insert('∞')">∞</a> <a onclick="gateway.insert('∫')">∫</a> <a onclick="gateway.insert('≈')">≈</a> <a onclick="gateway.insert('≠')">≠</a> <a onclick="gateway.insert('±')">±</a>
			<a onclick="gateway.insert('ω')">ω</a> <a onclick="gateway.insert('κ')">κ</a> <a onclick="gateway.insert('π')">π</a> <a onclick="gateway.insert('§')">§</a> <a onclick="gateway.insert('Γ')">Γ</a> <a onclick="gateway.insert('∑')">∑</a>
		</div>
		<div id="size-dialog" title="Wybierz wielkość tekstu">
			<a onclick="javascript:disp.setSize(0.6)" style="font-size:0.6em">A</a>
			<a onclick="javascript:disp.setSize(0.8)" style="font-size:0.8em">A</a> 
			<a onclick="javascript:disp.setSize(1.0)" style="font-size:1.0em">A</a>
			<a onclick="javascript:disp.setSize(1.2)" style="font-size:1.2em">A</a> 
			<a onclick="javascript:disp.setSize(1.4)" style="font-size:1.4em">A</a> 
			<a onclick="javascript:disp.setSize(1.6)" style="font-size:1.6em">A</a> 
			<a onclick="javascript:disp.setSize(1.8)" style="font-size:1.8em">A</a> 
		 	<a onclick="javascript:disp.setSize(2.0)" style="font-size:2.0em">A</a>
		</div>
		<!--<div id="chanlist-dialog" title="Lista kanałów sieci PIRC">
			<a href="http://pirc.pl/statystyki/kanaly" target="_blank">Skrócona lista kanałów</a><br>
			<a href="http://pirc.pl/statystyki/kanaly/full" target="_blank">Pełna lista kanałów</a>
		</div>-->
		<div id="sound"></div>
	</body>
</html>
