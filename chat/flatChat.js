// ==UserScript==
// @name         FlatChat+
// @namespace    com.dounford.flatmmo.flatChat
// @version      1.1.4
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
			oddMessageBg: "#323437",
			evenMessageBg: "#323437",
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
			oddMessageBg: "#ffffff",
			evenMessageBg: "#ffffff",
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
		},
		catppuccinMochaByMae: {
			"bgColor": "#201c2c",
			"pickerLocal": "#54576c",
			"pickerGlobal": "#54576c",
			"pickerRoom": "#54576c",
			"pickerPrivate": "#54576c",
			"inputName": "#53566a",
			"inputColor": "#181825",
			"inputText": "#c0c0c0",
			"messagesColor": "#b4befe",
			"serverMessages": "#89b4fa",
			"lvlMilestoneMessages": "#cba6f7",
			"errorMessages": "#f38ba8",
			"restMessages": "#99d5a4",
			"lvlUpMessages": "#99d5a4",
			"areaChangeMessages": "#89dceb",
			"privateMessages": "#f9e2af",
			"ownPrivateMessages": "#f9c8aa",
			"pingMessages": "#74c7ec",
			"contextBackground": "#323437",
			"contextSection": "#252729",
			"contextText": "#c0c0c0",
			"linkColor": "#ceb4ee",
			"oddMessageBg": "#201c2c",
			"evenMessageBg": "#201c2c"
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
						id: "sideChat",
						label: "Chat on the right side",
						type: "boolean",
						default: false
					},
					{
						id: "sideChatWidth",
						label: "Side Chat Width (px)",
						type: "number",
						min: 720,
						max: 1500,
						step: 10,
						default: 1000,
					},
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
						id: "hideUnwanted",
						label: "Mark unwanted words as spoiler instead of ignoring the message",
						type: "boolean",
						default: true
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
						id: "themeEditor",
						label: "THEME EDITOR",
						panel: "flatChat-ThemeEditor",
						type: "panel"
					}
				]
			});
			this.settings = {
				ignoredPlayers: [],
				ignoredWords: [],
				watchedPlayers: [],
				watchedWords: [],
			}

			this.channels = {};
			this.currentChannel = "channel_local";

			//This is for messages received before the chat loads
			this.messagesWaiting = [];

			//This is for the up and down arrows feature
			this.chatHistory = [];
			this.historyPosition = -1;

			this.lastWarning = Date.now() - 60000;

			this.lastPM = "";

			this.themes = {
				dark: {
					bgColor: "#323437",
					oddMessageBg: "#323437",
					evenMessageBg: "#323437",
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
					oddMessageBg: "#ffffff",
					evenMessageBg: "#ffffff",
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
				},
				catppuccinMochaByMae: {
					"bgColor": "#201c2c",
					"pickerLocal": "#54576c",
					"pickerGlobal": "#54576c",
					"pickerRoom": "#54576c",
					"pickerPrivate": "#54576c",
					"inputName": "#53566a",
					"inputColor": "#181825",
					"inputText": "#c0c0c0",
					"messagesColor": "#b4befe",
					"serverMessages": "#89b4fa",
					"lvlMilestoneMessages": "#cba6f7",
					"errorMessages": "#f38ba8",
					"restMessages": "#99d5a4",
					"lvlUpMessages": "#99d5a4",
					"areaChangeMessages": "#89dceb",
					"privateMessages": "#f9e2af",
					"ownPrivateMessages": "#f9c8aa",
					"pingMessages": "#74c7ec",
					"contextBackground": "#323437",
					"contextSection": "#252729",
					"contextText": "#c0c0c0",
					"linkColor": "#ceb4ee",
					"oddMessageBg": "#201c2c",
					"evenMessageBg": "#201c2c"
				}
			}
		}

		onLogin() {
			this.removeOriginalChat();
			this.addStyle();
			this.addUI();
			this.changeChatPosition(this.config["sideChat"]);
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

			this.watchIgnorePlayersWords("ignoredPlayers", this.config["ignoredPlayers"], true);
			this.watchIgnorePlayersWords("ignoredWords", this.config["ignoredWords"], true);
			this.watchIgnorePlayersWords("watchedPlayers", this.config["watchedPlayers"], true);
			this.watchIgnorePlayersWords("watchedWords", this.config["watchedWords"], true);

			if(FlatMMOPlus.version <= "0.0.6") {
				this.onMessageReceived = function(data) {
					if (data.startsWith("YELL")) {
						const split = data.substring("YELL=".length).split("~");

						const chatData = {
							username: split[0].split("yelled:")[0].trim(),
							tag: split[1],
							sigil: split[2],
							color: split[3],
							message: split[4],
							yell: true
						}
						this.onChat(chatData);
                	}
				}
			}
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

			if (data.color === "pink" && data.message.startsWith("[PM")) {
				let match = data.message.match(/\[PM (?:to|from) (.*?)\](.*)/);
				if(match) {
					if(data.message.startsWith("[PM to")) {
						data.color = "ownPrivate";
					} else {
						data.color = "private";
					}
					data.username = match[1].trim().replaceAll(" ", "_");
					data.message = match[2].trim();
					data.channel = this.channels["private_" + data.username] ? "private_" + data.username : "channel_global";
					this.lastPM = data.username;
				} else {
					console.warn("There was something wrong with this pm:", data.message)
				}
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
					case "sideChat": {
						this.changeChatPosition(this.config["sideChat"]);
					} break;
					case "sideChatWidth": {
						const flatChat = document.getElementById("flatChat");
						if (flatChat.classList.contains("flatChatSide")) {
							flatChat.style.setProperty("--side-chat-width", this.config.sideChatWidth + "px");
							if(this.config.sideChatWidth < 720) {
								flatChat.classList.add("flatChat-small")
							} else {
								flatChat.classList.remove("flatChat-small")
							}
						}
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
				text-align: left;
				outline: none;
			}
			.flatChat * {
				outline: none;
			}
			.flatChat-mainArea {
				display: flex;
				height: 300px
			}

			/* Side chat positioning */
			.flatChatSide {
				width: var(--side-chat-width, 300px);
				height: 100%;
				position: relative;
			}

			.flatChatSide .flatChat-mainArea {
				height: calc(100% - 50px);
			}

			.flatChatSide #flatChat-channelPicker {
				width: 150px;
			}

			.flatChatSide #flatChat-channels {
				height: calc(100% - 8px);
			}

			#flatChat-resizer {
				position: absolute;
				right: 0;
				top: 0;
				width: 5px;
				height: 100%;
				background: rgba(0, 0, 0, 0.3);
				cursor: ew-resize;
				transition: background 0.2s;
			}

			#flatChat-resizer:hover {
				background: rgba(0, 0, 0, 0.5);
			}

			#flatChat-resizer.dragging {
				background: rgba(0, 0, 0, 0.7);
			}

			.flatChat-small .flatChat-buttons {
				flex: auto !important;
			}
			
			.flatChat-small .flatChat-mainArea {
				height: calc(100% - 100px) !important;
			}

			/* Adjust game table for side chat */
			#game-container-td {
				vertical-align: top;
			}

			#chat-container-td {
				vertical-align: top;
				padding-left: 5px;
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
				width: 0 !important;
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

						span {
							margin-left: 5px;
						}
					}

					div:nth-child(even) {
						background-color: var(--fc-evenMessageBg, var(--fc-bgColor));
					}

					div:nth-child(odd) {
						background-color: var(--fc-oddMessageBg, var(--fc-bgColor));
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
			.flatChatHidden {
				background-color: black;
				color: transparent;
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
					padding-top: 0;
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
			}

			#ui-panel-flatmmoplus-content {
				input[type=checkbox] {
					-webkit-appearance: none;
					appearance: none;
					position: relative;
					width: 20px;
					height: 10px;
					border-radius: 15px;
					background-color: #ccc;
					outline: none;
					cursor: pointer;
					transition: background-color 0.3s;
					top: 0.5rem
				}

				input[type=checkbox]::before {
					content: '';
					position: absolute;
					top: 1px;
					left: 1px;
					width: 8px;
					height: 8px;
					background-color: #fff;
					border-radius: 50%;
					transition: transform 0.3s;
				}

				input[type=checkbox]:checked {
					background-color: #4CAF50;
				}

				input[type=checkbox]:checked::before {
					transform: translateX(10px);
				}
			}
			`
			document.head.append(style);

			if(localStorage.getItem("flatChat-themes")) {
				this.themes = JSON.parse(localStorage.getItem("flatChat-themes"));
			}
			for (let theme in this.themes) {
				if (!this.themes[theme].oddMessageBg) {
					this.themes[theme].oddMessageBg = this.themes[theme].bgColor;
					this.themes[theme].evenMessageBg = this.themes[theme].bgColor;
				}
				this.addTheme(theme)
				this.opts.config[9].options = this.opts.config[9].options.filter(t => t.value !== theme)
				this.opts.config[9].options.push({value: theme, label: this.toTitleCase(theme)})
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
					const match = channelName.dataset.channel.match(/(.*?)_(.*)/);
					if (match) {
						const type = match[1];
						const channel = match[2];
						this.switchChannel(channel, type === "private")
					}
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
						const match = channel.match(/(.*?)_(.*)/);
						if (match) {
							const type = match[1];
							const channel = match[2];
							this.switchChannel(channel, type === "private")
						}
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

		changeChatPosition(sideChat) {
			const flatChat = document.getElementById("flatChat");
			const gameElement = document.getElementById("game");

			if (sideChat) {
				// Create container structure if it doesn't exist
				if (!document.getElementById("game-chat-container")) {
					const container = document.createElement("table");
					container.id = "game-chat-container";
					container.style.display = "inline-table";
					container.innerHTML = `
				<tr>
					<td id="game-container-td"></td>
					<td id="chat-container-td"></td>
				</tr>
			`;

					// Replace game with container
					gameElement.parentNode.replaceChild(container, gameElement);
					document.getElementById("game-container-td").appendChild(gameElement);
				}

				// Add side chat class and move to side
				flatChat.classList.add("flatChatSide");
				document.getElementById("chat-container-td").appendChild(flatChat);

				// Set initial width
				const width = this.config.sideChatWidth || 600;  /* Changed from 300 */
				flatChat.style.setProperty("--side-chat-width", width + "px");
				if(width < 720) {
					flatChat.classList.add("flatChat-small")
				} else {
					flatChat.classList.remove("flatChat-small")
				}

				// Match canvas height
				const gameCanvas = document.querySelector("#game canvas");
				if (gameCanvas) {
					flatChat.style.height = gameCanvas.offsetHeight + "px";
				}

				// Add resizer if it doesn't exist
				if (!document.getElementById("flatChat-resizer")) {
					const resizer = document.createElement("div");
					resizer.id = "flatChat-resizer";
					flatChat.insertBefore(resizer, flatChat.firstChild);
					this.addResizeHandler(resizer);
				}
			} else {
				// Remove side chat positioning
				flatChat.classList.remove("flatChatSide");
				flatChat.classList.remove("flatChat-small");

				// Remove resizer
				const resizer = document.getElementById("flatChat-resizer");
				if (resizer) {
					resizer.remove();
				}

				// Move chat back to original position
				const container = document.getElementById("game-chat-container");
				if (container) {
					const gameElement = document.getElementById("game");
					container.parentNode.replaceChild(gameElement, container);
				}
				flatChat.style.height = ""
				document.querySelector("body center").appendChild(flatChat);
			}
		}

		addResizeHandler(resizer) {
			let isResizing = false;
			let startX = 0;
			let startWidth = 0;

			const startResize = (e) => {
				isResizing = true;
				startX = e.pageX;
				const flatChat = document.getElementById("flatChat");
				startWidth = flatChat.offsetWidth;

				resizer.classList.add("dragging");
				document.body.style.cursor = "ew-resize";

				// Prevent text selection while dragging
				e.preventDefault();
			};

			const doResize = (e) => {
				if (!isResizing) return;

				const flatChat = document.getElementById("flatChat");
				const width = startWidth + (e.pageX - startX);  /* Changed from - to + */

				// Constrain width between min and max
				const constrainedWidth = Math.min(Math.max(width, 720), 1500);

				flatChat.style.setProperty("--side-chat-width", constrainedWidth + "px");

				window.scrollTo(window.innerWidth,window.screenY)

				// Save the width to config
				this.config.sideChatWidth = constrainedWidth;

				if(constrainedWidth < 720) {
					flatChat.classList.add("flatChat-small")
				} else {
					flatChat.classList.remove("flatChat-small")
				}

				this.saveConfig();
			};

			const stopResize = () => {
				if (!isResizing) return;

				isResizing = false;
				resizer.classList.remove("dragging");
				document.body.style.cursor = "";

				// Save config after resize
				this.saveConfig();
			};

			resizer.addEventListener("mousedown", startResize);
			document.addEventListener("mousemove", doResize);
			document.addEventListener("mouseup", stopResize);
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
							grid-column: 1 / span 2;
							text-align: center;
							font-size: large;
						}
					}
				</style>
				<select id="flatChat-ThemeEditor-theme" onchange="FlatMMOPlus.plugins.flatChat.changeThemeEditor()">`
				FlatMMOPlus.plugins.flatChat.opts.config[9].options.forEach(theme=>{
					content += `<option value="${theme.value}">${theme.label}</option>`
				})
				content += `</select>
				<label for="fc-bgColor-editor">Chat Background</label>
				<input type="color" id="fc-bgColor-editor">

				<label for="fc-oddMessageBg-editor">Odd Messages Background</label>
				<input type="color" id="fc-oddMessageBg-editor">

				<label for="fc-evenMessageBg-editor">Even Messages Background</label>
				<input type="color" id="fc-evenMessageBg-editor">

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

				<div style="display: grid;grid-template-columns: auto auto;grid-column: 1 / span 2;">
					<input type="text" id="fc-themeName-editor" placeholder="Theme Name" style="grid-column: 1 / span 2;">
					<button type="button" onclick="FlatMMOPlus.plugins.flatChat.saveTheme()">Save</button>
					<button type="button" onclick="FlatMMOPlus.plugins.flatChat.deleteTheme()">Delete Theme</button>

					<input type="text" id="fc-import-editor" placeholder="Import/Export" style="grid-column: 1 / span 2;">
					<button type="button" onclick="FlatMMOPlus.plugins.flatChat.importTheme()">Import</button>
					<button type="button" onclick="FlatMMOPlus.plugins.flatChat.exportTheme()">Export</button>
				</div>
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
			if(!theme) {return};
			const themeName = this.toCamelCase(theme);

			//Make sure it doesn't duplicate
			if(this.themes[themeName]) {
				this.opts.config[9].options = this.opts.config[9].options.filter(t => t.value !== themeName)
				document.querySelector(`#flatChat-ThemeEditor-theme option[value=${themeName}]`).remove();
			} else {
				this.themes[themeName] = {};
			}

			for (let option in this.themes.dark) {
				this.themes[themeName][option] = document.getElementById("fc-" + option + "-editor").value
			}


			this.opts.config[9].options.push({value: themeName, label: theme})

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
			this.opts.config[9].options = this.opts.config[9].options.filter(t => t.value !== theme);

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
				if(!themeObj.name) {return};
				document.getElementById("fc-themeName-editor").value = this.toTitleCase(themeObj.name);
				for (let option in themeObj.theme) {
					document.getElementById("fc-" + option + "-editor").value = themeObj.theme[option]
				}
				this.saveTheme()
			} catch (error) {
				console.error("What you are trying to import is not a valid theme");
			}
		}

		exportTheme() {
			const theme = document.getElementById("flatChat-ThemeEditor-theme").value;
			const themeString = JSON.stringify({name: theme, "theme": this.themes[theme]});
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
				}
			}, `Show all players in room or global.`);

			//Pm will only open a tab if a message is not specified
			window.FlatMMOPlus.registerCustomChatCommand("pm", (command, data='') => {
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
					if (this.channels["private_" + receiver]) {
						this.switchChannel(receiver, true);
					} else {
						this.switchChannel("global", false);
					}
					Globals.websocket.send(`CHAT=/pm ${receiver} ${message}`);
				}
			}, `Send a private message to someone.`);

			window.FlatMMOPlus.registerCustomChatCommand("r", (command, data='') => {
				if (this.lastPM === "") {
					return
				}
				if (data === "") {
					this.newChannel(this.lastPM, true);
					this.switchChannel(this.lastPM, true);
					return;
				}
				const receiver = this.lastPM;
				const message = data;
				if (this.channels["private_" + receiver]) {
					this.switchChannel(receiver, true);
				} else {
					this.switchChannel("global", false);
				}
				Globals.websocket.send(`CHAT=/pm ${receiver} ${message}`);
			}, `Auto respond the last pm.`);

			//pm* will always open a new tab
			window.FlatMMOPlus.registerCustomChatCommand("pm*", (command, data='') => {
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
					Globals.websocket.send(`CHAT=/pm ${receiver} ${message}`);
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

		newChannel(channel, isPrivate) {
			console.log(channel, isPrivate)
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
				<span id="unreadMessages-${channelName}" style="display: none;"></span><span id="activeChat-${channelName}" style="display:none">></span><span>${isPrivate ? "@" : "#"}${channel.replace("_"," ")}</span>
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
				const match = channel.match(/(.*?)_(.*)/);
				if (match) {
					const type = match[1];
					const name = match[2];
					this.newChannel(name, type === "private");
				}
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
			this.settings[type] = words; //This is the variable I use to check
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

			//If the message sender is blocked the message will be ignored
			if(this.settings.ignoredPlayers.includes(data.username)) {
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

			if (this.config.showTime) {
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
				senderStrong.innerText = data.username.replaceAll("_", " ") + ":";
				senderStrong.className = "flatChat-player";
				senderStrong.setAttribute("data-sender", data.username.replaceAll(" ", "_"));
				messageContainer.appendChild(senderStrong);

				if(this.settings.watchedPlayers.includes(data.username) && !data.channel.startsWith("private_")) {
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
				messageSpan.innerText = message;
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

			//If the message contains any ignored word it will ignore the message or mark as spoiler
			if(this.settings.ignoredWords.some(word => message.includes(word))) {
				if(this.config["hideUnwanted"]) {
					messageSpan.style.cursor = "pointer";
					messageSpan.classList.add("flatChatHidden");
					messageSpan.onclick = ()=>{
						messageSpan.classList.toggle("flatChatHidden")
					}
				} else {
					return;
				}
			}
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
				Globals.websocket.send(`CHAT=/pm ${username} ${message}`);
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