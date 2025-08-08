// ==UserScript==
// @name         FlatChat+
// @namespace    com.dounford.flatmmo.flatChat
// @version      0.0.5
// @description  Better chat for FlatMMO
// @author       Dounford
// @license      MIT
// @match        *://flatmmo.com/play.php*
// @grant        none
// @require      https://update.greasyfork.org/scripts/544062/FlatMMOPlus.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/anchorme/2.1.2/anchorme.min.js
// ==/UserScript==
 
(function() {
	'use strict';

	//Which css variable corresponds to each color
	const messageColors = {
		white: "messagesColor",//local message
		grey: "messagesColor", //global message
		server: "serverMessages",
		pink: "lvlMilestoneMessages", //server messages
		red: "errorMessages", //errors (trade declines, no energy)
		lime: "restMessages", //rest message
		green: "lvlUpMessages", //level up
		cyan: "areaChangeMessages", //Leaving/Entering town
		private: "privateMessages", //private messages
		ownPrivate: "ownPrivateMessages",
		gold: "pingMessages",
	};
	const ding = new Audio("https://github.com/Dounford-Felipe/DHM-Idle-Again/raw/refs/heads/main/ding.wav");
	const IPSigils = new Set([
		'images/ui/basket_egg_sigil.png', 'images/ui/basket_sigil.png', 'images/ui/bat_sigil.png', 'images/ui/bell_sigil.png', 'images/ui/blue_party_hat_sigil.png', 'images/ui/broken_bell_sigil.png', 'images/ui/bronze_event_2_sigil.png', 'images/ui/bronze_event_sigil.png', 'images/ui/bunny_sigil.png', 'images/ui/candy_cane_sigil.png', 'images/ui/carrot_sigil.png', 'images/ui/cat_sigil.png', 'images/ui/chocolate_sigil.png', 'images/ui/dh1_max_sigil.png', 'images/ui/easter_egg_sigil.png', 'images/ui/event_2_sigil.png', 'images/ui/event_sigil.png', 'images/ui/fake_bell_sigil.png', 'images/ui/fancy_bell_sigil.png', 'images/ui/ghost_sigil.png', 'images/ui/gift_sigil.png', 'images/ui/gold_event_2_sigil.png', 'images/ui/gold_event_sigil.png', 'images/ui/green_party_hat_sigil.png', 'images/ui/hatching_chicken_sigil.png', 'images/ui/mad_bunny_sigil.png', 'images/ui/mummy_head_sigil.png', 'images/ui/mummy_sigil.png', 'images/ui/pink_party_hat_sigil.png', 'images/ui/pumpkin_sigil.png', 'images/ui/red_party_hat_sigil.png', 'images/ui/reindeer_sigil.png', 'images/ui/santa_hat_sigil.png', 'images/ui/silver_event_2_sigil.png', 'images/ui/silver_event_sigil.png', 'images/ui/skull_sigil.png', 'images/ui/snowflake_sigil.png', 'images/ui/snowman_sigil.png', 'images/ui/spider_sigil.png', 'images/ui/tree_sigil.png', 'images/ui/white_party_hat_sigil.png', 'images/ui/yellow_party_hat_sigil.png', 'images/ui/zombie_sigil.png'
	])
	const defaultThemes = {
		dark: {
			bgColor: "#323437",
			pickerLocal: "#C0C0C0",
			pickerGlobal: "#C0C0C0",
			pickerRoom: "#C0C0C0",
			pickerPrivate: "#C0C0C0",
			inputName: "#FA8072",
			inputColor: "#252729",
			inputText: "#C0C0C0",
			messagesColor: "#e1e1e1",
			serverMessages: "#6495ED",
			lvlMilestoneMessages: "#FF1493",
			errorMessages: "#FF0000",
			restMessages: "#00FF00",
			lvlUpMessages: "#00ad00",
			areaChangeMessages: "#00FFFF",
			privateMessages: "#FFA500",
			ownPrivateMessages: "#e88f4f",
			pingMessages: "#5F9EA0",
			contextBackground: "#323437",
			contextSection: "#252729",
			contextText: "#C0C0C0",
			linkColor: "#00FFFF",
		},
		light: {
			bgColor: "#ffffff",
			pickerLocal: "#000000",
			pickerGlobal: "#000000",
			pickerRoom: "#000000",
			pickerPrivate: "#000000",
			inputName: "#FA8072",
			inputColor: "#D3D3D3",
			inputText: "#000000",
			messagesColor: "#000000",
			serverMessages: "#6495ED",
			lvlMilestoneMessages: "#FF1493",
			errorMessages: "#FF0000",
			restMessages: "#00FF00",
			lvlUpMessages: "#008000",
			areaChangeMessages: "#00FFFF",
			privateMessages: "#FFA500",
			ownPrivateMessages: "#e88f4f",
			pingMessages: "#5F9EA0",
			contextBackground: "#323437",
			contextSection: "#252729",
			contextText: "#C0C0C0",
			linkColor: "#00FFFF",
		}
	}
 
	class flatChatPlugin extends FlatMMOPlusPlugin {
		constructor() {
			super("flatChat", {
				about: {
					name: GM_info.script.name,
					version: GM_info.script.version,
					author: GM_info.script.author,
					description: GM_info.script.description
				},
				config: [
					{
						id: "ignorePings",
						label: "Ignore all chat pings",
						type: "boolean",
						default: false
					},
					{
						id: "pingVolume",
						label: "Ping Volume",
						type: "range",
						min: 0,
						max: 100,
						step: 1,
						default: 100,
					},
					{
						id: "lessEnergyWarning",
						label: "Reduce the amount of low energy warnings",
						type: "boolean",
						default: false
					},
					{
						id: "showTime",
						label: "Display message received time",
						type: "boolean",
						default: true
					},
					{
						id: "showSpam",
						label: "Show duplicate messages from the same user (it may be spam)",
						type: "boolean",
						default: false
					},
					{
						id: "fontSize",
						label: "Message font size",
						type: "number",
						min: 0,
						max: 10,
						step: 0.1,
						default: 1
					},
					{
						id: "theme",
						label: "Theme",
						type: "select",
						options: [
							{value: "light", label: "Light"},
							{value: "dark", label: "Dark"},
						],
						default: "dark"
					},
					{
						id: "ignoredPlayers",
						label: "Players ignored by you (use , to separate)",
						type: "string",
						default: ""
					},
					{
						id: "ignoredWords",
						label: "Words blocked by you, messages containing these will not show (use , to separate)",
						type: "string",
						default: ""
					},
					{
						id: "watchedPlayers",
						label: "Players watched, every message from them will be highlighted (use , to separate)",
						type: "string",
						default: ""
					},
					{
						id: "watchedWords",
						label: "Words watched, you will receive a ping every time a message containing them is sent (use , to separate)",
						type: "string",
						default: ""
					},
					{
						id: "noCustomSocket",
						label: "Block connection with custom socket (private messages will not work)",
						type: "boolean",
						default: false
					},
					{
					    id: "themeEditor",
					    label: "THEME EDITOR",
					    panel: "flatChat-ThemeEditor",
					    type: "panel"
					}
				]
			});
			this.socket;
			this.settings = {
				ignoredPlayers: new Set(),
				ignoredWords: new Set(),
				watchedPlayers: new Set(),
				watchedWords: new Set(),
			}

			this.channels = {};
			this.currentChannel = "channel_local";

			//This is for messages received before the chat loads
			this.messagesWaiting = [];
			
			//This is for the up and down arrows feature
			this.chatHistory = [];
			this.historyPosition = -1;

			//This is for when the user is offline and you sent a pm, instead of telling you that they are offline every message it tells you once each 5 minutes
			this.offlineUsers = {}

			this.lastWarning = Date.now() - 60000;

			this.themes = {
				dark: {
					bgColor: "#323437",
					pickerLocal: "#C0C0C0",
					pickerGlobal: "#C0C0C0",
					pickerRoom: "#C0C0C0",
					pickerPrivate: "#C0C0C0",
					inputName: "#FA8072",
					inputColor: "#252729",
					inputText: "#C0C0C0",
					messagesColor: "#e1e1e1",
					serverMessages: "#6495ED",
					lvlMilestoneMessages: "#FF1493",
					errorMessages: "#FF0000",
					restMessages: "#00FF00",
					lvlUpMessages: "#00ad00",
					areaChangeMessages: "#00FFFF",
					privateMessages: "#FFA500",
					ownPrivateMessages: "#e88f4f",
					pingMessages: "#5F9EA0",
					contextBackground: "#323437",
					contextSection: "#252729",
					contextText: "#C0C0C0",
					linkColor: "#00FFFF",
				},
				light: {
					bgColor: "#ffffff",
					pickerLocal: "#000000",
					pickerGlobal: "#000000",
					pickerRoom: "#000000",
					pickerPrivate: "#000000",
					inputName: "#FA8072",
					inputColor: "#D3D3D3",
					inputText: "#000000",
					messagesColor: "#000000",
					serverMessages: "#6495ED",
					lvlMilestoneMessages: "#FF1493",
					errorMessages: "#FF0000",
					restMessages: "#00FF00",
					lvlUpMessages: "#008000",
					areaChangeMessages: "#00FFFF",
					privateMessages: "#FFA500",
					ownPrivateMessages: "#e88f4f",
					pingMessages: "#5F9EA0",
					contextBackground: "#323437",
					contextSection: "#252729",
					contextText: "#C0C0C0",
					linkColor: "#00FFFF",
				}
			}
		}
 
		onLogin() {
			this.removeOriginalChat();
			this.addStyle();
			this.addUI();
			this.loadChannels();
			this.switchChannel("local", false);
			this.messagesWaiting.forEach((message)=>this.showMessage(message));
			this.defineCommands();
			ding.volume = this.config.pingVolume / 100;
			this.addThemeEditor();
			this.changeThemeEditor();
			this.showWarning("Welcome to flatmmo.com", "orange");
			this.showWarning(document.querySelectorAll("#chat span")[1].innerHTML, "white");
			this.showWarning(`<span><strong style="color:cyan">FYI: </strong> Use the /help command to see information on available chat commands.</span>`, "white");
			//Just in case someone doesn't want to use it for privacy ¯\_(ツ)_/¯
			//It may break something in the chat
			if(this.getConfig("noCustomSocket")) { 
				return;
			}
			this.initCustomSocket();
		}
 
		onChat(data) {
			if (data.yell) {
				data.channel = "channel_global";
			} else {
				data.channel = "channel_local";
			}

			if (data.username === "" && data.color === "white") {
				data.color = "server"
			};

			if(FlatMMOPlus.loggedIn) {
				this.showMessage(data);
			} else {
				this.messagesWaiting.push(data);
			}
		}

		onConfigsChanged() {
			this.changedConfigs.forEach(config => {
				switch (config) {
					case "pingVolume": {
						ding.volume = this.config.pingVolume / 100;
					} break;
					case "fontSize": {
						document.getElementById("flatChat-channels").style.setProperty("--fc-size", this.config.fontSize + "rem");
					} break;
					case "theme": {
						const flatChat = document.getElementById("flatChat");
						flatChat.classList = "flatChat flatChat-" + this.config.theme;
					} break;
					case "ignoredPlayers":
					case "ignoredWords":
					case "watchedPlayers":
					case "watchedWords": {
						this.watchIgnorePlayersWords(config, this.config[config], true);
					} break;
				}
			})
		}

		saveConfig() {
			localStorage.setItem("flatmmoplus.flatChat.config", JSON.stringify(this.config));
		}

		removeOriginalChat() {
			add_to_chat = function(){};
			refresh_chat_div = function(){};
			paint_chat = function(){};
			document.getElementById("chat").style.display = "none";

			window.FlatMMOPlus.registerCustomChatCommand(["clear","clean"], (command, data='') => {
				document.querySelector(`#flatChat-channels [data-channel=${FlatMMOPlus.plugins.flatChat.currentChannel}]`).innerHTML = "";
			}, `Clears all messages in chat.`);
		}

		addStyle() {
			const style = document.createElement("style");
			style.innerHTML = `
			/*Chat box*/
			.flatChat {
				max-width: 1880px;
				background: var(--fc-bgColor);
				border: solid black 2px;
				border-radius: 5px;
				text-align: justify;
				outline: none;
			}
			.flatChat * {
    			outline: none;
			}
			.flatChat-mainArea {
				display: flex;
				height: 300px
			}
			/*channel list*/
			#flatChat-channelPicker {
				width: 10%;
				padding: 5px;
				flex: none;
				overflow-x: hidden;
				scrollbar-width: thin;
				display: block;
				transition: all 1s ease-in-out;
				transition-behavior: allow-discrete;

				@starting-style {
					width: 0px;
				}

				button {
					display: flex;
					border: 0;
					background-color: transparent;
					font-weight: bold;
					white-space: nowrap;
					&:hover {
						transform: scale(1.05);
					}
				}

				/*Current room btn*/
				[data-channel="channel_local"] {
					color: var(--fc-pickerLocal) !important;
				}
				
				/*yell chat btn*/
				[data-channel="channel_global"] {
					color: var(--fc-pickerGlobal) !important;
				}

				/*custom room btn*/
				.flatChat-channelPicker-room {
					color: var(--fc-pickerRoom);
				}

				/*direct message btn*/
				.flatChat-channelPicker-private {
					color: var(--fc-pickerPrivate);
				}
			}
			#flatChat-channelPicker[closed] {
				width: 0;
				display: none;
			}

			/*messages area*/
			#flatChat-channels {
				width: -webkit-fill-available;
				height: 300px;
				font-size: var(--fc-size);
				>div {
					height: 100%;
					overflow-y: auto;
					padding: 5px;

					div {
						overflow-wrap: anywhere;
						color: var(--fc-messagesColor);
					}

					img {
						width: var(--fc-size);
						vertical-align: bottom;
					}

					a {
						text-decoration: none;
						color: var(--fc-linkColor);

						&:visited {
							color: var(--fc-linkColor);
						}
					}
				}
			}
			.fc-serverMessages {
				color: var(--fc-serverMessages) !important;
			}
			.fc-lvlMilestoneMessages {
				color: var(--fc-lvlMilestoneMessages) !important;
			}
			.fc-errorMessages {
				color: var(--fc-errorMessages) !important;
			}
			.fc-restMessages {
				color: var(--fc-restMessages) !important;
			}
			.fc-lvlUpMessages {
				color: var(--fc-lvlUpMessages) !important;
			}
			.fc-areaChangeMessages {
				color: var(--fc-areaChangeMessages) !important;
			}
			.fc-privateMessages {
				color: var(--fc-privateMessages) !important;
			}
			.fc-ownPrivateMessages {
				color: var(--fc-ownPrivateMessages) !important;
			}
			.fc-pingMessages {
				background-color: var(--fc-pingMessages) !important;
			}
			/*player name*/
			.flatChat-player {
				cursor: pointer;
			}
			/*bottom bar*/
			#flatChat-BottomBar{
				display: flex;
				align-items: center;
				margin-top: 5px;
				padding: 2px;

				button {
					border: solid black 1px;
					border-radius: 5px;
					padding: 0;
					background-color: transparent;
					cursor: pointer;

					&:hover{
						background-color: rgba(0,0,0,0.1);
					}
					
					img {
						width: 40px;
						vertical-align: middle;
						padding: 1px;
					}
				}
			}
			/*message input*/
			#flatChat-inputDiv {
				display: flex;
				align-items: center;
				width: 100%;
				margin: 0 5px;
				background-color: var(--fc-inputColor);
				border-radius: 5px;
				padding: 2px;
				label {
					user-select: none;
					cursor: text;
					color: var(--fc-inputName);
					font-size: larger;
				}
				input {
					flex: auto;
					border: 0;
					background-color: transparent;
					color: var(--fc-inputText);
					&:focus {
						outline: transparent;
					}
				}
			}
			/*bottom bar btns*/
			.flatChat-buttons{
				flex: none;
				text-align: center;
			}
			/*Context menu*/
			#flatChat-contextMenu {
				visibility: hidden;
				position: absolute;
				list-style: none;
				padding: 0;
				background-color: var(--fc-contextBackground);
				color: var(--fc-contextText);
				cursor: pointer;
				font-size: clamp(12px, 1.2vw, 24px);
				top:0;

				li {
					padding: 5px;
				}
			}

			.flatChat-contextSection {
				background-color: var(--fc-contextSection);
				cursor: default;
			}

			#flatChat-copyUsername {
				position: absolute;
				background-color: var(--fc-inputColor);
				color: var(--fc-inputText);
				padding: 3px;
				border-radius: 5px;
				visibility: hidden;
				font-size: clamp(12px, 1.2vw, 24px); 
				top:0;
			}`
			document.head.append(style);

			if(localStorage.getItem("flatChat-themes")) {
				this.themes = JSON.parse(localStorage.getItem("flatChat-themes"));
			}
			for (let theme in this.themes) {
				this.addTheme(theme)
				this.opts.config[6].options = this.opts.config[6].options.filter(t => t.value !== theme)
				this.opts.config[6].options.push({value: theme, label: this.toTitleCase(theme)})
			}
		}

		addUI() {
			const chatDiv = document.createElement("div");
			chatDiv.innerHTML = `
				<div class="flatChat-mainArea">
					<div id="flatChat-channelPicker"></div>
					<div id="flatChat-channels" style="--fc-size:${this.config.fontSize}rem;"></div>
				</div>
				<div id="flatChat-BottomBar">
					<div class="flatChat-buttons">
						<button type="button" id="flatChat-togglePicker">
							<img src="https://cdn.idle-pixel.com/images/collection_small_circle_icon.png" alt="">
						</button>
						<button type="button" id="flatChat-closeChat">
							<img src="https://cdn.idle-pixel.com/images/x.png" alt="">
						</button>
					</div>
					<div id="flatChat-inputDiv">
						<label for="flatChat-input"></label>
						<input type="text" id="flatChat-input" autocomplete="off" maxlength="${LOCAL_CHAT_MAX_LENGTH || 100}">
					</div>
					<div class="flatChat-buttons">
						<button type="button" id="flatChat-autoScroll">
							<img src="https://cdn.idle-pixel.com/images/x.png" id="fc-autoScrollfalse" alt="" class="displaynone">
							<img src="https://cdn.idle-pixel.com/images/check.png" id="fc-autoScrolltrue" alt="">
						</button>
						<button type="button" id="flatChat-scrollToBottom">
							<img src="https://flatmmo.com/images/icons/damage.png" alt="" style="transform: rotate(180deg);">
						</button>
						<button type="button" id="flatChat-srollDown">
							<img src="https://flatmmo.com/images/icons/arrow_damage.png" alt="" style="transform: rotate(180deg);">
						</button>
						<button type="button" id="flatChat-srollUp">
							<img src="https://flatmmo.com/images/icons/arrow_damage.png" alt="">
						</button>
					</div>
				</div>
				<ul id="flatChat-contextMenu">
					<li id="flatChat-contextUser" class="flatChat-contextSection" data-user=""></li>
					<li data-action="message">Message</li>
					<li data-action="tabMessage">Message (tab)</li>
					<li data-action="profile">Profile</li>
					<li data-action="trade">Trade</li>
					<li class="flatChat-contextSection">MODERATION</li>
					<li data-action="stalk">Stalk</li>
					<li data-action="ignore">Ignore</li>
				</ul>
				<div id="flatChat-copyUsername">USERNAME COPIED</div>`
			chatDiv.id = "flatChat";
			chatDiv.tabIndex = 0;
			let currentTheme = this.config.theme
			if(this.themes[currentTheme]) {
				chatDiv.classList = "flatChat flatChat-" + this.config.theme;
			} else {
				this.config.theme = "dark";
				chatDiv.classList = "flatChat flatChat-dark";
				this.saveConfig();
			}

			document.querySelector("body center").insertAdjacentElement("beforeend",chatDiv);

			document.querySelector("#flatChat-inputDiv label").innerText = `[${Globals.local_username}]:`;

			document.querySelector("#flatChat-channelPicker").onclick = (e) => {
				const channelName = e.target.closest("[data-channel]");
				if (channelName) {
					const [type, channel] = channelName.dataset.channel.split("_");
					this.switchChannel(channel, type === "private")
				}
			}

			document.getElementById("flatChat-togglePicker").addEventListener("click", ()=>{
				const picker = document.getElementById("flatChat-channelPicker");
				picker.toggleAttribute("closed");
			})

			document.getElementById("flatChat-closeChat").addEventListener("click",()=>{this.closeChannel()})
			document.getElementById("flatChat-autoScroll").addEventListener("click",()=>{this.toggleAutoScroll()})
			document.getElementById("flatChat-scrollToBottom").addEventListener("click",()=>{this.scrollButtons("bottom")})
			document.getElementById("flatChat-srollDown").addEventListener("click",()=>{this.scrollButtons("down")})
			document.getElementById("flatChat-srollUp").addEventListener("click",()=>{this.scrollButtons("up")})

			document.getElementById("flatChat-channels").onwheel = (event)=>{this.scrollChannel(event)}

			document.querySelector("#flatChat-channels").addEventListener("click", async (e) => {
				const sender = e.target.closest("[data-sender]");
				if (sender) {
					const username = sender.dataset.sender;
					await navigator.clipboard.writeText(username);

					const copyMessage = document.getElementById("flatChat-copyUsername");
					copyMessage.style.top = e.clientY + "px"
					copyMessage.style.left = e.clientX + "px"
					copyMessage.style.visibility = "visible"
					setTimeout(()=>{copyMessage.style.visibility = "hidden"}, 1000);
				}
			});

			//Shows custom context menu on right click
			document.querySelector("#flatChat-channels").addEventListener("contextmenu", (e) => {
				const sender = e.target.closest("[data-sender]");
				if (sender) {
					e.preventDefault()
					const contextMenu = document.getElementById("flatChat-contextMenu");
					const username = sender.dataset.sender;
					document.getElementById("flatChat-contextUser").setAttribute("data-user", username);
					document.getElementById("flatChat-contextUser").innerText = username;

					const menuRect = contextMenu.getBoundingClientRect();
					const menuWidth = menuRect.width;
					const menuHeight = menuRect.height;

					const mouseX = e.pageX;
					const mouseY = e.pageY;

					if (mouseY + menuHeight > window.innerHeight) {
						contextMenu.style.top = (mouseY - menuHeight) + "px";
					} else {
						contextMenu.style.top = mouseY + "px";
					}

					if (mouseX + menuWidth > window.innerWidth) {
						contextMenu.style.left = (mouseX - menuWidth) + "px";
					} else {
						contextMenu.style.left = mouseX + "px";
					}

					contextMenu.style.visibility = "visible";
				}
			});

			document.getElementById("flatChat-contextMenu").addEventListener("click", (e) => {this.contextMenu(e)})

			//Context menu should close if you click outside
			document.addEventListener("click", function (e) {
				const contextMenu = document.getElementById("flatChat-contextMenu");
				if (!contextMenu.contains(e.target)) {
					contextMenu.style.visibility = "hidden";
				}
			});

			document.addEventListener("keydown", (e) => {
				if (e.key === "Tab" && e.target.closest('#flatChat')) {
					e.preventDefault();
					if(document.querySelector(`#flatChat-channelPicker [data-channel=${this.currentChannel}]`).nextElementSibling) {
						const channel = document.querySelector(`#flatChat-channelPicker [data-channel=${this.currentChannel}]`).nextElementSibling.dataset.channel
						let [isPrivate, name] = channel.split("_")
						this.switchChannel(name, isPrivate === "private")
						return;
					} else {
						this.switchChannel("local", false)
						return;
					}
				}
				if(document.activeElement === document.getElementById("flatChat-input")) {
					if(e.key === "Enter") {
						if(has_modal_open()) return;
						this.sendMessage();
					}

					const input = document.getElementById("flatChat-input");

					if (e.key === "ArrowUp" && input.selectionStart === 0) {
						if(this.historyPosition + 1 === this.chatHistory.length) {return}
						input.value = this.chatHistory[++this.historyPosition] || "";
						input.selectionStart = input.value.length
					} else if (e.key === "ArrowDown" && input.selectionStart === input.value.length) {
						if(this.historyPosition - 1 < -1) {return}
						input.value = this.chatHistory[--this.historyPosition] || "";
						input.selectionStart = input.value.length
					}
				}
			}, true)
		}

		addTheme(theme) {
			if(!this.themes[theme]) {return};
			let themeSyle;
			if(document.getElementById("fc-themeStyle-" + theme)) {
				themeSyle = document.getElementById("fc-themeStyle-" + theme)
				themeSyle.innerHTML = "";
			} else {
				themeSyle = document.createElement("style");
				themeSyle.id = "fc-themeStyle-" + theme;
				document.head.appendChild(themeSyle);
			}
			themeSyle.innerHTML = `.flatChat-${theme} {`
			for (let option in this.themes[theme]) {
				themeSyle.innerHTML += `\n\t--fc-${option}: ${this.themes[theme][option]};`
			}
			themeSyle.innerHTML += "\n}"
		}

		addThemeEditor() {
			FlatMMOPlus.addPanel("flatChat-ThemeEditor", "Theme Editor", ()=>{
				let content = `
				<style>
					#ui-panel-flatChat-ThemeEditor-content {
						display: grid;
						grid-template-columns: auto auto;
						font-size: larger;
						height: 550px;
						overflow-y: scroll;

						* {
							height: auto;
							border-top: solid 1px black;
							margin-bottom: 5px;
							padding: 5px;
						}

						select {
							grid-column: 1 / -1;
							text-align: center;
							font-size: large;
						}
					}
				</style>
				<select id="flatChat-ThemeEditor-theme" onchange="FlatMMOPlus.plugins.flatChat.changeThemeEditor()">`
				FlatMMOPlus.plugins.flatChat.opts.config[6].options.forEach(theme=>{
					content += `<option value="${theme.value}">${theme.label}</option>`
				})
				content += `</select>
				<label for="fc-bgColor-editor">Chat Background</label>
				<input type="color" id="fc-bgColor-editor">

				<label for="fc-pickerLocal-editor">Picker Local Channel</label>
				<input type="color" id="fc-pickerLocal-editor">
				
				<label for="fc-pickerGlobal-editor">Picker Global Channel</label>
				<input type="color" id="fc-pickerGlobal-editor">
				
				<label for="fc-pickerRoom-editor">Picker Room Channel (not available)</label>
				<input type="color" id="fc-pickerRoom-editor">
				
				<label for="fc-pickerPrivate-editor">Picker Private Channel</label>
				<input type="color" id="fc-pickerPrivate-editor">
				
				<label for="fc-inputName-editor">Username on Chat Bar</label>
				<input type="color" id="fc-inputName-editor">
				
				<label for="fc-inputColor-editor">Background of Chat Bar</label>
				<input type="color" id="fc-inputColor-editor">
				
				<label for="fc-inputText-editor">Chat Bar Text Color</label>
				<input type="color" id="fc-inputText-editor">
				
				<label for="fc-messagesColor-editor">Regular Message Color</label>
				<input type="color" id="fc-messagesColor-editor">
				
				<label for="fc-serverMessages-editor">Server Messages</label>
				<input type="color" id="fc-serverMessages-editor">
				
				<label for="fc-lvlMilestoneMessages-editor">Lvl Up Milestone (each 10 lvls)</label>
				<input type="color" id="fc-lvlMilestoneMessages-editor">
				
				<label for="fc-errorMessages-editor">Error/Warning Messages</label>
				<input type="color" id="fc-errorMessages-editor">
				
				<label for="fc-restMessages-editor">Rest Messages</label>
				<input type="color" id="fc-restMessages-editor">
				
				<label for="fc-lvlUpMessages-editor">Lvl Up Messages</label>
				<input type="color" id="fc-lvlUpMessages-editor">
				
				<label for="fc-areaChangeMessages-editor">Entering/Leaving Town</label>
				<input type="color" id="fc-areaChangeMessages-editor">
				
				<label for="fc-privateMessages-editor">Private Messages Received</label>
				<input type="color" id="fc-privateMessages-editor">
				
				<label for="fc-ownPrivateMessages-editor">Private Messages Sent</label>
				<input type="color" id="fc-ownPrivateMessages-editor">
				
				<label for="fc-pingMessages-editor">Ping/Watched Messages</label>
				<input type="color" id="fc-pingMessages-editor">
				
				<label for="fc-contextBackground-editor">Context Menu Background Color</label>
				<input type="color" id="fc-contextBackground-editor">
				
				<label for="fc-contextSection-editor">Context Menu Section Background (MODERATION)</label>
				<input type="color" id="fc-contextSection-editor">
				
				<label for="fc-contextText-editor">Context Menu Text Color</label>
				<input type="color" id="fc-contextText-editor">
				
				<label for="fc-linkColor-editor">Hyperlink Text Color</label>
				<input type="color" id="fc-linkColor-editor">

				<input type="text" id="fc-themeName-editor" default="Theme Name">
				<button type="button" onclick="FlatMMOPlus.plugins.flatChat.saveTheme()">Save</button>
				<button type="button" onclick="FlatMMOPlus.plugins.flatChat.deleteTheme()">Delete Theme</button>
				
				<input type="text" id="fc-import-editor" default="Import/Export">
				<button type="button" onclick="FlatMMOPlus.plugins.flatChat.importTheme()">Import</button>
				<button type="button" onclick="FlatMMOPlus.plugins.flatChat.exportTheme()">Export</button>
				
				`
				return content;
			}) 
			
		}

		changeThemeEditor() {
			const theme = document.getElementById("flatChat-ThemeEditor-theme").value;
			document.getElementById("fc-themeName-editor").value = document.querySelector(`#flatChat-ThemeEditor-theme option[value=${theme}]`).innerText;
			for (let option in this.themes[theme]) {
				document.getElementById("fc-" + option + "-editor").value = this.themes[theme][option]
			}
		}

		saveTheme() {
			const theme = document.getElementById("fc-themeName-editor").value;
			const themeName = this.toCamelCase(theme);

			//Make sure it doesn't duplicate
			if(this.themes[themeName]) {
				this.opts.config[6].options = this.opts.config[6].options.filter(t => t.value !== themeName)
				document.querySelector(`#flatChat-ThemeEditor-theme option[value=${themeName}]`).remove();
			} else {
				this.themes[themeName] = {};
			}

			for (let option in this.themes.dark) {
				this.themes[themeName][option] = document.getElementById("fc-" + option + "-editor").value
			}

			
			this.opts.config[6].options.push({value: themeName, label: theme})

			document.getElementById("flatChat-ThemeEditor-theme").innerHTML += `<option value="${themeName}">${theme}</option>`
			document.getElementById("flatChat-ThemeEditor-theme").value = themeName;
			
			//Change to new theme
			this.config.theme =  themeName;
			const flatChat = document.getElementById("flatChat");
			flatChat.classList = "flatChat flatChat-" + this.config.theme;
			this.saveConfig();
			
			localStorage.setItem("flatChat-themes", JSON.stringify(this.themes));
			
			this.addTheme(themeName);
		}

		deleteTheme() {
			const theme = document.getElementById("flatChat-ThemeEditor-theme").value;
			console.log(theme)

			//Return if it doesn't exist
			if(!this.themes[theme]) {return};

			//Default themes can't be removed, they will be go back to default instead
			if(theme === "light" || theme === "dark")  {
				this.themes[theme] = structuredClone(defaultThemes[theme]);
				this.changeThemeEditor();
				this.saveTheme();
				return;
			};

			//remove from themes
			delete this.themes[theme];

			//remove from fm+ config
			this.opts.config[6].options = this.opts.config[6].options.filter(t => t.value !== theme);

			//Remove the option on theme editor
			document.querySelector(`#flatChat-ThemeEditor-theme option[value=${theme}]`).remove();

			//save themes on localstorage
			localStorage.setItem("flatChat-themes", JSON.stringify(this.themes));
			
			//If there is a theme style (it should exist) remove it
			if (document.getElementById("fc-themeStyle-" + theme)) {
				document.getElementById("fc-themeStyle-" + theme).remove();
			}

			this.config.theme =  "dark";
			const flatChat = document.getElementById("flatChat");
			flatChat.classList = "flatChat flatChat-dark";
		}

		importTheme() {
			const themeString = document.getElementById("fc-import-editor").value;
			try {
				const themeObj = JSON.parse(themeString);
				document.getElementById("fc-themeName-editor").value = themeObj.name;
				for (let option in themeObj.theme) {
					document.getElementById("fc-" + option + "-editor").value = themeObj.theme[option]
				}
				this.saveTheme()
			} catch (error) {
				console.error("What you are trying to import is not a valid theme");
			}
		}

		exportTheme() {
			const theme = document.getElementById("fc-themeName-editor").value;
			const themeString = JSON.stringify({name: theme, theme: this.themes[theme]});
			document.getElementById("fc-import-editor").value = themeString;
		}

		defineCommands() {
			window.FlatMMOPlus.registerCustomChatCommand(["players","who"], (command, data='') => {
				if (this.currentChannel === "channel_global") {
					Globals.websocket.send('CHAT=/players');
				} else if (this.currentChannel === "channel_local") {
					this.showWarning(Object.keys(players).join(", "), "white");
				} else if (this.currentChannel.startsWith("private_")) {
					this.showWarning(`${this.currentChannel.slice(8)} & ${Globals.local_username}`, "white");
				} else {
					if(this.getConfig("noCustomSocket")) {return};
					const message = {
						type: "WHO",
						data: {
							channel: this.currentChannel
						}
					}
					this.socket.send(JSON.stringify(message));
				}
			}, `Show all players in room or global.`);

			window.FlatMMOPlus.registerCustomChatCommand("unread", (command, data='') => {
				if(this.getConfig("noCustomSocket")) {return};
				this.socket.send(JSON.stringify({
					type: "SHOW_OFFLINE",
					data: {}
				}));
			}, `Shows all private messages received when you were offline.`);
			
			//Pm will only open a tab if a message is not specified
			window.FlatMMOPlus.registerCustomChatCommand("pm", (command, data='') => {
				if(this.getConfig("noCustomSocket")) {return};
				if (data === "") {
					this.showWarning("You need to specify the username", "red");
					return;
				}
				const space = data.indexOf(" ");
				if (space <= 0) {
					this.newChannel(data, true);
					this.switchChannel(data, true);
				} else {
					const receiver = data.substring(0, space);
					const message = data.substring(space + 1);
					const socketMessage = {
						type: "PRIVATE",
						data: {
							receiver,
							message
						}
					}
					this.socket.send(JSON.stringify(socketMessage));
					this.switchChannel("local", false);
					this.showOwnMessage(message, "channel_local","ownPrivate");
				}
			}, `Send a private message to someone.`);

			//pm* will always open a new tab
			window.FlatMMOPlus.registerCustomChatCommand("pm*", (command, data='') => {
				if(this.getConfig("noCustomSocket")) {return};
				if (data === "") {
					this.showWarning("You need to specify the username", "red");
					return;
				}
				const space = data.indexOf(" ");
				if (space <= 0) {
					this.newChannel(data, true);
					this.switchChannel(data, true);
				} else {
					const receiver = data.substring(0, space);
					const message = data.substring(space + 1);
					this.newChannel(receiver, true);
					this.switchChannel(receiver, true);
					const socketMessage = {
						type: "PRIVATE",
						data: {
							receiver,
							message
						}
					}
					this.socket.send(JSON.stringify(socketMessage));
					this.showOwnMessage(message, "private_" + receiver, "ownPrivate");
				}
			}, `Opens a private channel in a new tab.<br><b>Usage:</b>/pm* [username] <message (optional)>`);

			window.FlatMMOPlus.registerCustomChatCommand("profile", (command, data='') => {
				if (data === "") {
					this.showWarning("You need to specify the username", "red");
					return;
				}
				Globals.websocket.send("RIGHT_CLICKED_PLAYER=" + data);
			}, `Opens the player profile.<br><b>Usage:</b>/profile [username]`);

			window.FlatMMOPlus.registerCustomChatCommand("trade", (command, data='') => {
				if (data === "") {
					this.showWarning("You need to specify the username", "red");
					return;
				}
				Globals.websocket.send("SEND_TRADE_REQUEST=" + data);
			}, `Send a trade request if the player is in the same map.<br><b>Usage:</b>/trade [username]`);

			window.FlatMMOPlus.registerCustomChatCommand("leave", (command, data='') => {
				if (data === "") {
					this.closeChannel();
					return;
				};
				if(data in this.channels) {
					this.closeChannel(data);
				};
			}, `Closes a chat tab.<br><b>Usage:</b>/leave <channel (optional)>`);

			window.FlatMMOPlus.registerCustomChatCommand("ignore", (command, data='') => {
				if (data === "") {
					this.showWarning("You need to specify the username", "red");
					return;
				}
				this.watchIgnorePlayersWords("ignoredPlayers", data)
				this.showWarning("Player added to ignored list");
			}, `Ignores all messages from user.<br><b>Usage:</b>/ignore [username] (use _ for names with space)`);

			window.FlatMMOPlus.registerCustomChatCommand("watch", (command, data='') => {
				if (data === "") {
					this.showWarning("You need to specify the username", "red");
					return;
				}
				this.watchIgnorePlayersWords("watchedPlayers",data);
				this.showWarning("Player added to watched list");
			}, `Highlights all messages from user.<br><b>Usage:</b>/watch [username] (use _ for names with space)`);

			window.FlatMMOPlus.registerCustomChatCommand("ignoreword", (command, data='') => {
				if (data === "") {
					this.showWarning("You need to specify at least one word", "red");
					return;
				}
				this.watchIgnorePlayersWords("ignoredWords",data);
				this.showWarning("Word added to ignored list");
			}, `Ignores all messages that contains this word.<br><b>Usage:</b>/ignoreword [word] (use _ for words with space)`);

			window.FlatMMOPlus.registerCustomChatCommand("watchword", (command, data='') => {
				if (data === "") {
					this.showWarning("You need to specify at least one word", "red");
					return;
				}
				this.watchIgnorePlayersWords("watchedWords",data);
				this.showWarning("Word added to watched list");
			}, `Ping you every time this word is sent.<br><b>Usage:</b>/watchword [word] (use _ for words with space)`);

		}

		initCustomSocket() {
			this.socket = new WebSocket("wss://pm.dounford.tech");
			this.socket.onopen = () => {
				const connectMessage = {
					type: "CONNECT",
					data: {
						username: Globals.local_username
					}
				}
				this.socket.send(JSON.stringify(connectMessage));
			}
			this.socket.onmessage = (event) => {
				let message;
				try {
					message = JSON.parse(event.data);
					if (!("type" in message) || !("data" in message)) {
						return;
					}
				} catch (error) {
					console.error("The last message was not a valid JSON", error.message);
					return;
				}

				this.handleMessage(message.type, message.data);
			}
			this.socket.onclose = (event) => {
				console.log("WebSocket connection closed. Code: " + event.code + ", Reason: " + event.reason);
				setTimeout(async function() {
					await FlatMMOPlus.plugins.flatChat.initCustomSocket();
				}, 20000);
			};
		}

		newChannel(channel, isPrivate) {
			const channelName = (isPrivate ? "private_" : "channel_") + channel;
			if(this.channels[channelName]) {return};
			this.channels[channelName] = {
				name: channel,
				isPrivate: isPrivate,
				autoScroll: true,
				unreadMessages: 0,
				inputText: "",
				lastMessage: "",
				lastSender: "",
			}
			document.getElementById("flatChat-channelPicker").insertAdjacentHTML("beforeend",`<button data-channel="${channelName}" class="flatChat-channelPicker-${isPrivate ? "private" : "room"}">
				<span id="unreadMessages-${channelName}" style="display: none;"></span><span id="activeChat-${channelName}" style="display:none">></span><span>${isPrivate ? "@" : "#"}${channel}</span>
			</button>`)
			document.getElementById("flatChat-channels").insertAdjacentHTML("beforeend",`<div data-channel="${channelName}" style="display:none"></div>`);
			if(isPrivate) {
				document.querySelector(`#flatChat-channels [data-channel=${channelName}]`).insertAdjacentHTML("beforeend",`
				<div style="color: var(--fc-lvlUpMessages);"><strong>${this.getDateStr()}</strong><span>New chat with ${channel}</span></div>`)
			}
			this.saveChannels();
		}

		closeChannel(channel) {
			const oldChannel = channel || this.currentChannel;
			if (oldChannel === "channel_local" || oldChannel === "channel_global") {
				return;
			}
			this.switchChannel("local", false);

			delete this.channels[oldChannel];
			document.querySelector(`#flatChat-channelPicker [data-channel=${oldChannel}]`).remove();
			document.querySelector(`#flatChat-channels [data-channel=${oldChannel}]`).remove();

			this.saveChannels();
		}

		saveChannels() {
			const channels = Object.keys(this.channels);
			localStorage.setItem("flatChat-channels",JSON.stringify(channels))
		}

		loadChannels() {
			const channels = JSON.parse(localStorage.getItem("flatChat-channels") || '["channel_local","channel_global"]');
			channels.forEach(channel => {
				const [type, name] = channel.split("_");
				this.newChannel(name, type === "private");
			})
		}

		switchChannel(channel, isPrivate) {
			const input = document.getElementById("flatChat-input");
			//remove old
			document.getElementById("activeChat-" + this.currentChannel).style.display = "none";
			document.querySelector(`#flatChat-channels [data-channel=${this.currentChannel}]`).style.display = "none";
			this.channels[this.currentChannel].inputText = input.value;

			//show  new
			const newChannel = (isPrivate ? "private_" : "channel_") + channel
			//Makes sure the channel exists
			if (!newChannel in this.channels) {
				newChannel = "channel_local"
			};
			this.currentChannel = newChannel;

			//Removes unreadMessages number
			this.channels[this.currentChannel].unreadMessages = 0;
			const unreadSpan = document.getElementById("unreadMessages-" + this.currentChannel);
			unreadSpan.style.display = "none";

			//Change auto scroll icon
			const autoScroll = this.channels[this.currentChannel].autoScroll;
			document.getElementById("fc-autoScroll" + autoScroll).className = "";
			document.getElementById("fc-autoScroll" + !autoScroll).className = "displaynone";

			//shows the new chat
			document.getElementById("activeChat-" + this.currentChannel).style.display = "block";
			document.querySelector(`#flatChat-channels [data-channel=${this.currentChannel}]`).style.display = "block";
			input.value = this.channels[this.currentChannel].inputText;

			//Auto scrolls if needed
			if (autoScroll) {
				const messageArea = document.querySelector(`#flatChat-channels [data-channel=${this.currentChannel}]`);
				messageArea.scrollTop = messageArea.scrollHeight;
			}
		}

		toggleAutoScroll() {
			this.channels[this.currentChannel].autoScroll = !this.channels[this.currentChannel].autoScroll;
			document.getElementById("fc-autoScrolltrue").classList.toggle("displaynone");
			document.getElementById("fc-autoScrollfalse").classList.toggle("displaynone");
		}

		scrollButtons(btn) {
			const messageArea = document.querySelector(`#flatChat-channels [data-channel=${this.currentChannel}]`);
			if (btn === "up") {
				messageArea.scrollTop -= 100;
			} else if (btn === "down") {
				messageArea.scrollTop += 100
			} else { //btn === bottom
				messageArea.scrollTop = messageArea.scrollHeight;
			}
		}

		scrollChannel(e) {
			//Zoom in/out chat messages
			if (e.shiftKey) {
				let channels = document.getElementById("flatChat-channels");
				let size = this.config.fontSize || 1
				if (e.deltaY < 0) {
					size = parseFloat((size + 0.1).toFixed(1));
				} else {
					size = parseFloat((size - 0.1).toFixed(1));
				}
				channels.style.setProperty("--fc-size", size + "rem")
				this.config.fontSize = size;
				this.saveConfig();
				return;
			}
		}

		watchIgnorePlayersWords(type, words, replace) {
			//type can be watchedWords, ignoredWords, watchedPlayers, ignoredPlayers
			if(!replace) {
				words += "," + this.config[type];
			};
			words = words.split(",") //split by ,
			.flatMap((word)=>word.split(" ")) //split by spaces
			.map(word=>word.replaceAll("_"," ")) //replace underscore to space
			.filter(word=>word); //remove empty
			this.settings[type] = new Set([...words]);//This is the variable I use to check
			this.config[type] = words.join(",").replaceAll(" ", "_");//Config is saved as string
			this.saveConfig();
		}

		contextMenu(e) {
			const data = e.target.closest("[data-action]");
			if (data) {
				const username = document.getElementById("flatChat-contextUser").dataset.user;
				const action = data.dataset.action;
				const input = document.getElementById("flatChat-input");
				switch (action) {
					case "message": {
						input.value = "/pm " + username + " ";
						input.focus();
					} break;
					case "tabMessage": {
						this.newChannel(username, true);
						this.switchChannel(username, true);
					} break;
					case "profile": {
						Globals.websocket.send("RIGHT_CLICKED_PLAYER=" + username);
					} break;
					case "trade": {
						Globals.websocket.send("SEND_TRADE_REQUEST=" + username);
					} break;
					case "watch": {
						this.watchIgnorePlayersWords("watchedPlayers", username);
					} break;
					case "ignore": {
						this.watchIgnorePlayersWords("ignoredPlayers", username);
					} break;
				}

				const contextMenu = document.getElementById("flatChat-contextMenu");
				contextMenu.style.visibility = "hidden";
			}
		}

		showMessage(data, html = false) {
			// data = {
			//     username: "dounford",
			//     tag: "none",
			//     sigil: "none",
			//     color: "white",
			//     message: "oi gente",
			//     yell: false,
			//     channel: "channel_local"
			//     channel: "private_dounford"
			// }
			if(!data.channel in this.channels) {
				data.channel = "channel_local"
			}
			let message = data.message;

			//This should prevent some spam to show
			if (this.channels[data.channel].lastSender === data.username && this.channels[data.channel].lastMessage === data.message && !this.getConfig("showSpam")) {
				return;
			}

			//If the message contains any ignored word it will ignore the message
			if(this.settings.ignoredWords.some(word => message.includes(word))) {
				return;
			}
			//If the message sender is blocked the message will be ignored
			if(this.settings.ignoredPlayers.has(data.username)) {
				return;
			}

			let messageContainer = document.createElement('div');

			//Ping if any watched word is present or if the message contains the username
			if (!this.getConfig("ignorePings") && (message.includes("@" + Globals.local_username) || this.settings.watchedWords.some(word => message.includes(word)))) {
				messageContainer.className = "fc-pingMessages";
				ding.play();
			}

			if (data.color && data.color !== "white" && data.color !== "grey") {
				if (messageColors[data.color]) {
					messageContainer.className += " fc-" + messageColors[data.color]
					if (data.color === "ownPrivate") {
						const ownPrivateSpan = document.createElement("span");
						ownPrivateSpan.innerText = "< "
						messageContainer.appendChild(ownPrivateSpan);
					} else if (data.color === "private") {
						const privateSpan = document.createElement("span");
						privateSpan.innerText = "> "
						messageContainer.appendChild(privateSpan);
					}
				} else {
					//In case a color that doesn't has a variable yet is used
					messageContainer.style.color = data.color;
				}
			}

			//Some of the private messages sent when someone is offline are received (max 10 per player)
			if (data.offlineMessage) {
				const timeStrong = document.createElement("strong");
				timeStrong.innerHTML = this.getDateStr(data.offlineMessage);
				messageContainer.appendChild(timeStrong);
			//only show current time if the setting is true, false by default
			} else if (this.config.showTime) {
				const timeStrong = document.createElement("strong");
				timeStrong.innerHTML = this.getDateStr();
				messageContainer.appendChild(timeStrong);
			}

			if (data.sigil && data.sigil !== "none") {
				const sigilImg = new Image();
				sigilImg.className = "chatSigil"

				if (IPSigils.has(data.sigil)) {
					//I'm using IP sigils for now, FMMO sigils have terrible resolution
					sigilImg.src = "https://cdn.idle-pixel.com/images/" + data.sigil.slice(10);
				} else {
					sigilImg.src = "https://flatmmo.com/" + data.sigil;
				}

				messageContainer.appendChild(sigilImg);
			}

			if (data.tag && data.tag !== "none") {
				let tag = document.createElement("span");
			
				tag.innerText = data.tag === "investor-plus" ? "INVESTOR" : data.tag.toUpperCase();
				tag.classList.add("chat-tag-" + data.tag);
			}

			if (data.username) {
				const senderStrong = document.createElement("strong");
				senderStrong.innerText = data.username + ":";
				senderStrong.className = "flatChat-player";
				senderStrong.setAttribute("data-sender", data.username);
				messageContainer.appendChild(senderStrong);

				if(this.settings.watchedPlayers.has(data.username)) {
					messageContainer.className = "fc-pingMessages";
				}
			} else if(this.getConfig("lessEnergyWarning") && message.startsWith("You are too tired to gain xp")) {//TBD
				const now = Date.now()
				if (this.lastWarning > now - 300000) {
					return
				} else {
					this.lastWarning = now;
				}
			}

			const messageSpan = document.createElement('span');
			if (html) {
				messageSpan.innerHTML = message;
			} else {
				messageSpan.innerText = " " + message;
			}

			messageSpan.innerHTML = anchorme({
				input: messageSpan.innerHTML,
				options: {
					attributes: {
						target: "_blank",
						class: "detected"
					}
				},
			});
			messageContainer.appendChild(messageSpan);

			const messageArea = document.querySelector(`#flatChat-channels [data-channel=${data.channel}]`);
			messageArea.appendChild(messageContainer);

			if(data.channel !== this.currentChannel) {
				const unreadMessages = ++this.channels[data.channel].unreadMessages;
				const unreadSpan = document.getElementById("unreadMessages-" + data.channel);
				unreadSpan.innerText = `[${unreadMessages}]`
				unreadSpan.style.display = "block";
			}

			if (this.channels[data.channel].autoScroll) {
				messageArea.scrollTop = messageArea.scrollHeight;
			}

			this.channels[data.channel].lastSender = data.username;
			this.channels[data.channel].lastMessage = data.message;
		}

		showWarning(message, color = "aquamarine") {
			const data = {
				username: "",
				tag: "none",
				sigil: "none",
				color: color,
				message: message,
				yell: false,
				channel: this.currentChannel
			}
			this.showMessage(data, true);
		}

		showOwnMessage(message, channel, color = "white") {
			//I'm getting the sigil in a hacky way, I don't know how to get the tag, so unless Smitty adds a variable for it I can't do much
			const data = {
				username: Globals.local_username,
				tag: "none",
				color,
				message,
				channel
			}
			data.sigil = document.querySelector("#equipment-slot-sigil img").src.slice(33,-4) == "none" ? "none" : "images/ui" + document.querySelector("#equipment-slot-sigil img").src.slice(32);
			this.showMessage(data, false);
		}

		sendMessage() {
			let message = document.getElementById("flatChat-input").value.slice(-LOCAL_CHAT_MAX_LENGTH).trim();
			if (!message) {return};

			document.getElementById("flatChat-input").value = "";
			this.channels[this.currentChannel].inputText = "";

			if(message !== this.chatHistory[0]) {
				this.chatHistory.unshift(message);
			}
			this.historyPosition = -1;


			if(message.startsWith("/")) {
				const space = message.indexOf(" ");
				let command;
				let data;
				if (space <= 0) {
					command = message.substring(1);
					data = "";
				} else {
					command = message.substring(1, space);
					data = message.substring(space + 1);
				}

				if (window.FlatMMOPlus.handleCustomChatCommand(command, data)) {
					return
				} else {
					Globals.websocket.send('CHAT=' + message);
					return;
				}
			}

			if(this.currentChannel === "channel_local") {
				Globals.websocket.send('CHAT=' + message);
			} else if(this.currentChannel === "channel_global") {
				Globals.websocket.send('CHAT=/yell ' + message);
			} else if (this.currentChannel.startsWith("private_")) {
				const username = this.currentChannel.slice(8);
				const socketMessage = {
					type: "PRIVATE",
					data: {
						receiver: username,
						message
					}
				}
				this.socket.send(JSON.stringify(socketMessage));
				this.showOwnMessage(message, this.currentChannel, "ownPrivate");
			} else {
				const channel = this.currentChannel.slice(8);
				const socketMessage = {
					type: "CHAT",
					data: {
						channel,
						message
					}
				}
				this.socket.send(JSON.stringify(socketMessage));
				this.showOwnMessage(message, this.currentChannel);
			}
		}

		//Messages from custom websocket
		handleMessage(type, data) {
			switch(type) {
				case "PRIVATE": {
					// {
					//     type: "PRIVATE",
					//     data: {
					//         username: "dounbot",
					//         message: "ping pong"
					//     }
					// }
					const messageData = {
						username: data.username,
						tag: "none",
						sigil: "none",
						color: "private",
						message: data.message,
					}
					//If the private tab is open sent there, if not send in the local channel
					messageData.channel = this.channels["private_" + data.username] ? "private_" + data.username : "channel_local";
					this.showMessage(messageData);
				} break;
				case "RECEIVER_OFFLINE": {
					// {
					//     type: "RECEIVER_OFFLINE",
					//     data: {
					//         username: "dounbot",
					//     }
					// }
					const now = Date.now();
					//This message will not show again before 5 minutes have passed
					if(this.offlineUsers[data.username] && this.offlineUsers[data.username] > now - 300000) {return};
					const messageData = {
						username: "",
						tag: "none",
						sigil: "none",
						color: "private",
						message: `${data.username} is currently offline, if their inbox isn't full they will receive it when they log in again`
					}
					//If the private tab is open sent there, if not send in the local channel
					messageData.channel = this.channels["private_" + data.username] ? "private_" + data.username : "channel_local";
					this.showMessage(messageData);
					this.offlineUsers[data.username] = now;
				} break;
				case "OFFLINE_MESSAGE": {
					// {
					//     type: "OFFLINE_MESSAGE",
					//     data: {
					//         timestamp: 1754047996955,
					//         username: "dounbot",
					//         message: "oi tudo bem?"
					//     }
					// }
					const messageData = {
						username: data.username,
						tag: "none",
						sigil: "none",
						color: "private",
						message: data.message,
						offlineMessage: parseInt(data.timestamp)
					}
					//If the private tab is open sent there, if not send in the local channel
					messageData.channel = this.channels["private_" + data.username] ? "private_" + data.username : "channel_local";
					this.showMessage(messageData);

				} break;
				case "WARNING": {
					// {
					//     type: "WARNING",
					//     data: {
					//         message: "You can't log in more than once"
					//     }
					// }
					this.showWarning(data.message, "red");
				} break;
			}
		}

		//Utilities functions
		getDateStr(timestamp) {
			const date = timestamp ? new Date(timestamp) : new Date();
			const hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
			const min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
			const dataStr = '[' + hour + ':' + min + ']'
			return dataStr;
		}

		toCamelCase(str) {
			if (!str || typeof str !== 'string') {
				return '';
			}

			const words = str.split(/[\s_-]+/);

			const camelCaseWords = words.map((word, index) => {
				if (index === 0) {
					return word.toLowerCase();
				} else {
					return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
				}
			});

			return camelCaseWords.join('');
		}

		toTitleCase(str) {
			const result = str.replace(/([A-Z])/g, " $1");
			return result.charAt(0).toUpperCase() + result.slice(1)
		}
	}
 
	const plugin = new flatChatPlugin();
	FlatMMOPlus.registerPlugin(plugin);

})();