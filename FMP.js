// ==UserScript==
// @name         FlatMMOPlus
// @namespace    com.dounford.flatmmo
// @version      0.0.5
// @description  FlatMMO plugin framework
// @author       Anwinity ported by Dounford
// @match        *://flatmmo.com/play.php*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

    Set.prototype.some = function(predicate) {
        for (const item of this) {
            if (predicate(item)) {
                return true;
            }
        }
        return false;
    };

    Set.prototype.toggle = function(item) {
        if (this.has(item)) {
            this.delete(item)
        } else {
            this.add(item)
        }
    };

	const VERSION = "0.0.4"

	if (window.FlatMMOPlus) {
		//already loaded
		return;
	}

	const LOCAL_STORAGE_KEY_DEBUG = "FlatMMOPlus:debug";
 
    const CONFIG_TYPES_LABEL = ["label"];
    const CONFIG_TYPES_PANEL = ["panel"];
    const CONFIG_TYPES_BOOLEAN = ["boolean", "bool", "checkbox"];
    const CONFIG_TYPES_INTEGER = ["integer", "int"];
    const CONFIG_TYPES_FLOAT = ["number", "num", "float"];
    const CONFIG_TYPES_RANGE = ["range"];
    const CONFIG_TYPES_STRING = ["string", "text"];
    const CONFIG_TYPES_SELECT = ["select"];
    const CONFIG_TYPES_COLOR = ["color"];

	const CHAT_COMMAND_NO_OVERRIDE = ["help"];

	function logFancy(s, color="#00f7ff") {
		console.log("%cFlatMMOPlus: %c"+s, `color: ${color}; font-weight: bold; font-size: 12pt;`, "color: silver; font-weight: normal; font-size: 10pt;");
	}

	class FlatMMOPlusPlugin {

		constructor(id, opts) {
			if(typeof id !== "string") {
				throw new TypeError("FlatMMOPlusPlugin constructor takes the following arguments: (id:string, opts?:object)");
			}
			this.id = id;
			this.opts = opts || {};
			this.config = null;
			this.changedConfigs = new Set();
		}

		getConfig(name) {
			if(!this.config) {
				FlatMMOPlus.loadPluginConfigs(this.id);
			}
			if(this.config) {
				return this.config[name];
			}
		}

		/*
        onConfigsChanged() { }
        onLogin() { }
        onMessageReceived(data) { }
        onChat(data) { }
		onPanelChanged(panelBefore, panelAfter)
        onMapChanged(mapBefore, mapAfter) { }
        onInventoryChanged(inventoryBefore, inventoryAfter) { }
        */
	}

	const internal = {
		init() {
			const self = this;

			document.head.insertAdjacentHTML("beforeend", `<style>
				.displaynone {
					display: none !important;
				}
			</style>`)

			//Tries to hook into the websocket messages
			const hookIntoOnMessage = () => {
				try {
					const original_onmessage = Globals.websocket.onmessage;
					if (typeof original_onmessage === "function") {
						Globals.websocket.onmessage = function(event) {
							if(event.data.startsWith("SET_MAP")) {
								const mapBefore = current_map;
								original_onmessage(event);
								const mapAfter = current_map;
								self.onMapChanged(mapBefore, mapAfter);
								return;
							} else if (event.data.startsWith("SET_INVENTORY_ITEMS")) {
								const inventoryBefore = items;
								original_onmessage(event);
								const inventoryAfter = items;
								self.onInventoryChanged(inventoryBefore, inventoryAfter);
								return;
							}
							original_onmessage(event);
							self.onMessageReceived(event.data);
						}
					}
					return true;
				} catch (err) {
					console.error("Had trouble hooking into websocket...");
                    return false;
				}
			}
			//This will call itself
			(function(){
				if(!hookIntoOnMessage()) {
                    // try once more
                    setTimeout(hookIntoOnMessage, 40);
                }
			})()


			//For some reason I was unable to change the original function, so I just deleted and added a new one
			window.removeEventListener("keypress", keypress_listener, false);
			function fmpKeyPress(e) {
				//flatChat handles messages in another way, but checks for custom commands inside itself
				if (self.plugins.flatChat) {
					return;
				}
				//If typing on panels it should not type on the chat
				if(document.querySelector(".td-ui").contains(document.activeElement)) {
					return;
				}
				if(Globals.local_username == null) return;
				if(has_modal_open()) return;

				let keyCode = e.keyCode;
				let char = String.fromCharCode(keyCode);


				//firefox fix
				if(keyCode == "47" || keyCode == "39") {
					e.preventDefault(); 
				}
				//13 is Enter
				if(keyCode == "13") {
					const message = local_chat_message.trim()
					if(message.length == 0) return; //if empty do nothing

					//if command
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
							local_chat_message = "";
							return
						} 
					}
					Globals.websocket.send('CHAT=' + message);
					local_chat_message = "";
					return;
				}

				//if any normal key then checks if the message is too big
				if(LOCAL_CHAT_MAX_LENGTH <= local_chat_message.length) {
					return;
				}
				//if not then add the key pressed to the message
				local_chat_message += char;
			}

			window.addEventListener("keypress", fmpKeyPress, false);

			// hook into switch_panels, which is called when the main panel is changed. This is used for custom panels.
            const original_switch_panels = window.switch_panels;
            window.switch_panels = function(id) {
				let panelBefore = self.currentPanel;
                self.hideCustomPanels();
                original_switch_panels(id);
				self.currentPanel = id;
				let panelAfter = id;
				self.onPanelChanged(panelBefore, panelAfter);
            }

            const original_paint = window.paint;

            window.paint = function() {
                original_paint();

                try {
                    self.onPaint();
                } catch (error) {
                    console.warn("Error on FlatMMO+ onPaint", error.message)
                }
            };

            // create plugin menu item and panel
			const settingsBody = document.querySelector(".settings-ui tbody")
			settingsBody.insertAdjacentHTML("beforeend",`<tr onclick="FlatMMOPlus.setPanel('flatmmoplus')">
				<td colspan="2" style="cursor: pointer;text-align: center;font-size: 2rem;font-weight: bold;">PLUGINS</td>
			</tr>`)

			self.addPanel("flatmmoplus", "FlatMMO+ Plugins", function() {
                let content = `<style>
                    #ui-panel-flatmmoplus {
                        height: 550px;
                        overflow-y: scroll;
                        scrollbar-width: thin;
                        text-align: justify;

                        textarea {
                            width: -webkit-fill-available;
                            width: -moz-available;
                            width: stretch;
                            resize: none;
                        }
                    }
                </style>`;
                self.forEachPlugin(plugin => {
                    let id = plugin.id;
                    let name = "An FlatMMO+ Plugin!";
                    let description = "";
                    let author = "unknown";
                    if(plugin.opts.about) {
                        let about = plugin.opts.about;
                        name = about.name || name;
                        description = about.description || description;
                        author = about.author || author;
                    }
                    content += `
                    <div id="flatmmoplus-plugin-box-${id}" class="flatmmoplus-plugin-box">
                        <div style="display:flex" align-items:center;>
                            <div>
                                <strong><u>${name||id}</u></strong><br>(by ${author})<br />
                                <span>${description}</span><br />
                            </div>
                            ${plugin.opts.config ? `<div class="flatmmoplus-plugin-settings-button">
                            <button onclick="document.querySelector('#flatmmoplus-plugin-box-${id} .flatmmoplus-plugin-config-section').classList.toggle('displaynone')">Settings</button>
                        </div>` : ""}
                        </div>
                        <div class="flatmmoplus-plugin-config-section displaynone">
                            <hr style="grid-column: span 2">
                    `;
                    if(plugin.opts.config && Array.isArray(plugin.opts.config)) {
                        plugin.opts.config.forEach(cfg => {
                            if(CONFIG_TYPES_LABEL.includes(cfg.type)) {
                                content += `<h5 style="grid-column: span 2; margin-bottom: 0; font-weight: 600">${cfg.label}</h5>`;
                            } else if (CONFIG_TYPES_PANEL.includes(cfg.type)) {
                                content += `<div onclick="FlatMMOPlus.setPanel('${cfg.panel}')">
                                    <h2 style="text-align: center;">${cfg.label}</h2>
                                </div>`
                            } else if(CONFIG_TYPES_BOOLEAN.includes(cfg.type)) {
                                content += `
                                    <div>
                                        <label for="flatmmoplus-config-${plugin.id}-${cfg.id}">${cfg.label || cfg.id}</label>
                                        <input id="flatmmoplus-config-${plugin.id}-${cfg.id}" type="checkbox" onchange="FlatMMOPlus.setPluginConfigUIDirty('${id}', true, '${cfg.id}')" />
                                    </div>
                                    `;
                            }
                            else if(CONFIG_TYPES_INTEGER.includes(cfg.type)) {
                                content += `
                                    <div>
                                        <label for="flatmmoplus-config-${plugin.id}-${cfg.id}">${cfg.label || cfg.id}</label>
                                    </div>
                                    <div>
                                        <input id="flatmmoplus-config-${plugin.id}-${cfg.id}" type="number" step="1" min="${cfg.min || ''}" max="${cfg.max || ''}" onchange="FlatMMOPlus.setPluginConfigUIDirty('${id}', true, '${cfg.id}')" />
                                    </div>
                                    `;
                            }
                            else if(CONFIG_TYPES_FLOAT.includes(cfg.type)) {
                                content += `
                                    <div>
                                        <label for="flatmmoplus-config-${plugin.id}-${cfg.id}">${cfg.label || cfg.id}</label>
                                    </div>
                                    <div>
                                        <input id="flatmmoplus-config-${plugin.id}-${cfg.id}" type="number" step="${cfg.step || ''}" min="${cfg.min || ''}" max="${cfg.max || ''}" onchange="FlatMMOPlus.setPluginConfigUIDirty('${id}', true, '${cfg.id}');" />
                                    </div>
                                    `;
                            } else if (CONFIG_TYPES_RANGE.includes(cfg.type)) {
                                content += `<div>
                                    <label for="flatmmoplus-config-${plugin.id}-${cfg.id}">${cfg.label || cfg.id}</label>
                                </div>
                                <div>
                                    <input id="flatmmoplus-config-${plugin.id}-${cfg.id}" type="range" step="${cfg.step || ''}" min="${cfg.min || ''}" max="${cfg.max || ''}" onchange="FlatMMOPlus.setPluginConfigUIDirty('${id}', true, '${cfg.id}');" oninput="document.getElementById('flatmmoplus-config-${plugin.id}-${cfg.id}-value').innerText = this.value" />
                                    <span id="flatmmoplus-config-${plugin.id}-${cfg.id}-value"></span>
                                </div>`;
                            }
                            else if(CONFIG_TYPES_STRING.includes(cfg.type)) {
                                content += `
                                    <div>
                                        <label for="flatmmoplus-config-${plugin.id}-${cfg.id}">${cfg.label || cfg.id}</label>
                                    </div>
                                    <div>
                                        <textarea id="flatmmoplus-config-${plugin.id}-${cfg.id}" type="text" maxlength="${cfg.max || ''}" onchange="FlatMMOPlus.setPluginConfigUIDirty('${id}', true, '${cfg.id}')" rows="5" autocomplete="off" spellcheck="false"></textarea>
                                    </div>
                                    `;
                            }
                            else if(CONFIG_TYPES_COLOR.includes(cfg.type)) {
                                content += `
                                    <div>
                                        <label for="flatmmoplus-config-${plugin.id}-${cfg.id}">${cfg.label || cfg.id}</label>
                                    </div>
                                    <div>
                                        <input id="flatmmoplus-config-${plugin.id}-${cfg.id}" type="color" onchange="FlatMMOPlus.setPluginConfigUIDirty('${id}', true, '${cfg.id}')" />
                                    </div>
                                    `;
                            }
                            else if(CONFIG_TYPES_SELECT.includes(cfg.type)) {
                                content += `
                                    <div>
                                        <label for="flatmmoplus-config-${plugin.id}-${cfg.id}">${cfg.label || cfg.id}</label>
                                    </div>
                                    <div>
                                        <select id="flatmmoplus-config-${plugin.id}-${cfg.id}" onchange="FlatMMOPlus.setPluginConfigUIDirty('${id}', true,'${cfg.id}')">
                                    `;
                                if(cfg.options && Array.isArray(cfg.options)) {
                                    cfg.options.forEach(option => {
                                        if(typeof option === "string") {
                                            content += `<option value="${option}">${option}</option>`;
                                        }
                                        else {
                                            content += `<option value="${option.value}">${option.label || option.value}</option>`;
                                        }
 
                                    });
                                }
                                content += `
                                        </select>
                                    </div>
                                    `;
                            }
                        });
                        content += `
                        <div style="grid-column: span 2">
                            <button id="flatmmoplus-configbutton-${plugin.id}-reload" onclick="FlatMMOPlus.loadPluginConfigs('${id}')">Reload</button>
                            <button id="flatmmoplus-configbutton-${plugin.id}-apply" onclick="FlatMMOPlus.savePluginConfigs('${id}')">Apply</button>
                        </div>
                        `;
                    }
                    content += "</div>";
                    content += "</div>";
                });
 
                return content;
            });

			logFancy(`(v${self.version}) initialized.`);
		}
	}

	class FlatMMOPlus {

		constructor() {
			this.version = VERSION;
			this.plugins = {};
			this.panels = {};
			this.debug = false;
			this.nextUniqueId = 1;
			this.customChatCommands = {
				help: (command, data) => {
					console.log("help", command, data);
				}
			}
			this.customChatHelp = {};
			this.customDialogOptions = {};
			this.currentPanel = "inventory";
			this.loggedIn = false;

			if(localStorage.getItem(LOCAL_STORAGE_KEY_DEBUG) == "1") {
                this.debug = true;
            }
		}

		registerCustomChatCommand(command, f, help) {
			if (Array.isArray(command)) {
				command.forEach(cmd => this.registerCustomChatCommand(cmd, f, help))
				return;
			}
			if(typeof command !== "string" || typeof f !== "function") {
                throw new TypeError("FlatMMOPlus.registerCustomChatCommand takes the following arguments: (command:string, f:function)");
            }
            if(CHAT_COMMAND_NO_OVERRIDE.includes(command)) {
                throw new Error(`Cannot override the following chat commands: ${CHAT_COMMAND_NO_OVERRIDE.join(", ")}`);
            }
            if(command in this.customChatCommands) {
                console.warn(`FlatMMOPlus: re-registering custom chat command "${command}" which already exists.`);
            }
            this.customChatCommands[command] = f;
            if(help && typeof help === "string") {
                this.customChatHelp[command] = help.replace(/%COMMAND%/g, command);
            } else {
                delete this.customChatHelp[command];
            }
		}

		handleCustomChatCommand(command, message) {
			// return true if command handler exists, false otherwise
            const f = this.customChatCommands[command];
            if(typeof f === "function") {
                try {
                    f(command, message);
                }
                catch(err) {
                    console.error(`Error executing custom command "${command}"`, err);
                }
                return true;
            }
            return false;
		}

		uniqueId() {
			return this.nextUniqueId++;
		}

		setDebug(debug) {
            if(debug) {
                this.debug = true;
                localStorage.setItem(LOCAL_STORAGE_KEY_DEBUG, "1");
            }
            else {
                this.debug = false;
                localStorage.removeItem(LOCAL_STORAGE_KEY_DEBUG);
            }
        }

		setPluginConfigUIDirty(id, dirty, configId) {
            if(typeof id !== "string" || typeof dirty !== "boolean") {
                throw new TypeError("FlatMMOPlus.setPluginConfigUIDirty takes the following arguments: (id:string, dirty:boolean)");
            }
            const plugin = this.plugins[id];
            if(configId) {
                plugin.changedConfigs.add(configId);
            }
            const button = document.getElementById(`flatmmoplus-configbutton-${plugin.id}-apply`);
            if(button) {
                button.disabled = !dirty;
            }
        }

		loadPluginConfigs(id) {
            if (typeof id !== "string") {
                throw new TypeError("FlatMMOPlus.reloadPluginConfigs takes the following arguments: (id:string)");
            }
            const plugin = this.plugins[id];
            const config = {};
            let stored;
            try {
                stored = JSON.parse(localStorage.getItem(`flatmmoplus.${id}.config`) || "{}");
            } catch(err) {
                console.error(`Failed to load configs for plugin with id "${id} - will use defaults instead."`);
                stored = {};
            }
            if (plugin.opts.config && Array.isArray(plugin.opts.config)) {
                plugin.opts.config.forEach(cfg => {
                    const el = document.getElementById(`flatmmoplus-config-${plugin.id}-${cfg.id}`);
                    let value = stored[cfg.id];
                    if (value == null || typeof value === "undefined") {
                        value = cfg.default;
                    }
                    config[cfg.id] = value;
 
                    if (el) {
                        if (CONFIG_TYPES_BOOLEAN.includes(cfg.type) && typeof value === "boolean") {
                            el.checked = value;
                        } else if (CONFIG_TYPES_INTEGER.includes(cfg.type) && typeof value === "number") {
                            el.value = value;
                        } else if (CONFIG_TYPES_FLOAT.includes(cfg.type) && typeof value === "number") {
                            el.value = value;
                        } else if (CONFIG_TYPES_RANGE.includes(cfg.type) && typeof value === "number") {
                            el.value = value;
                            document.getElementById(`flatmmoplus-config-${plugin.id}-${cfg.id}-value`).innerText = value
                        } else if (CONFIG_TYPES_STRING.includes(cfg.type) && typeof value === "string") {
                            el.value = value;
                        } else if (CONFIG_TYPES_SELECT.includes(cfg.type) && typeof value === "string") {
                            el.value = value;
                        } else if (CONFIG_TYPES_COLOR.includes(cfg.type) && typeof value === "string") {
                            el.value = value;
                        }
                    }
                });
            }
            plugin.config = config;
			plugin.changedConfigs.clear();
            this.setPluginConfigUIDirty(id, false);
            if (typeof plugin.onConfigsChanged === "function") {
                plugin.onConfigsChanged();
            }
        }

		savePluginConfigs(id) {
            if (typeof id !== "string") {
                throw new TypeError("FlatMMOPlus.savePluginConfigs takes the following arguments: (id:string)");
            }
            const plugin = this.plugins[id];
            const config = {};
            if (plugin.opts.config && Array.isArray(plugin.opts.config)) {
                plugin.opts.config.forEach(cfg => {
                    const el = document.getElementById(`flatmmoplus-config-${plugin.id}-${cfg.id}`);
                    if (CONFIG_TYPES_BOOLEAN.includes(cfg.type)) {
                        config[cfg.id] = el.checked;
                    } else if (CONFIG_TYPES_INTEGER.includes(cfg.type)) {
                        config[cfg.id] = parseInt(el.value);
                    } else if (CONFIG_TYPES_FLOAT.includes(cfg.type)) {
                        config[cfg.id] = parseFloat(el.value);
                    } else if (CONFIG_TYPES_RANGE.includes(cfg.type)) {
                        config[cfg.id] = parseInt(el.value);
                    } else if (CONFIG_TYPES_STRING.includes(cfg.type)) {
                        config[cfg.id] = el.value;
                    } else if (CONFIG_TYPES_SELECT.includes(cfg.type)) {
                        config[cfg.id] = el.value;
                    } else if (CONFIG_TYPES_COLOR.includes(cfg.type)) {
                        config[cfg.id] = el.value;
                    }
                });
            }
            plugin.config = config;
            localStorage.setItem(`flatmmoplus.${id}.config`, JSON.stringify(config));
            this.setPluginConfigUIDirty(id, false);
            if (typeof plugin.onConfigsChanged === "function") {
                plugin.onConfigsChanged();
            }
			plugin.changedConfigs.clear();
        }

		addPanel(id, title, content) {
            if(typeof id !== "string" || typeof title !== "string" || (typeof content !== "string" && typeof content !== "function") ) {
                throw new TypeError("FlatMMOPlus.addPanel takes the following arguments: (id:string, title:string, content:string|function)");
            }
            const lastPanel = document.querySelector("#ui-panel-worship");
            lastPanel.insertAdjacentHTML("afterend",`
            <div id="ui-panel-${id}" style="display: none" class="ui-panel">
				<div class="ui-panel-title">${title}</div>
                <hr>
                <div id="ui-panel-${id}-content"></div>
            </div>
            `);
            this.panels[id] = {
                id: id,
                title: title,
                content: content
            };
            this.refreshPanel(id);
        }

		refreshPanel(id) {
            if(typeof id !== "string") {
                throw new TypeError("FlatMMOPlus.refreshPanel takes the following arguments: (id:string)");
            }
            const panel = this.panels[id];
            if(!panel) {
                throw new TypeError(`Error rendering panel with id="${id}" - panel has not be added.`);
            }
            let content = panel.content;
            if(!["string", "function"].includes(typeof content)) {
                throw new TypeError(`Error rendering panel with id="${id}" - panel.content must be a string or a function returning a string.`);
            }
            if(typeof content === "function") {
                content = content();
                if(typeof content !== "string") {
                    throw new TypeError(`Error rendering panel with id="${id}" - panel.content must be a string or a function returning a string.`);
                }
            }
            const panelContent = document.getElementById(`ui-panel-${id}-content`);
            panelContent.innerHTML = content;
            if(id === "flatmmoplus") {
                this.forEachPlugin(plugin => {
                    this.loadPluginConfigs(plugin.id);
                });
            }
        }

		registerPlugin(plugin) {
            if(!(plugin instanceof FlatMMOPlusPlugin)) {
                throw new TypeError("FlatMMOPlus.registerPlugin takes the following arguments: (plugin:FlatMMOPlusPlugin)");
            }
            if(plugin.id in this.plugins) {
                throw new Error(`FlatMMOPlusPlugin with id "${plugin.id}" is already registered. Make sure your plugin id is unique!`);
            }
 
            this.plugins[plugin.id] = plugin;
            this.loadPluginConfigs(plugin.id);
            let versionString = plugin.opts&&plugin.opts.about&&plugin.opts.about.version ? ` (v${plugin.opts.about.version})` : "";
            logFancy(`registered plugin "${plugin.id}"${versionString}`);
        }

		forEachPlugin(f) {
            if(typeof f !== "function") {
                throw new TypeError("FlatMMOPlus.forEachPlugin takes the following arguments: (f:function)");
            }
            Object.values(this.plugins).forEach(plugin => {
                try {
                    f(plugin);
                }
                catch(err) {
                    console.error(`Error occurred while executing function for plugin "${plugin.id}."`);
                    console.error(err);
                }
            });
        }

		setPanel(panel) {
            if(typeof panel !== "string") {
                throw new TypeError("FlatMMOPlus.setPanel takes the following arguments: (panel:string)");
            }
            window.switch_panels(panel);
        }

		sendMessage(message) {
            if(typeof message !== "string") {
                throw new TypeError("FlatMMOPlus.sendMessage takes the following arguments: (message:string)");
            }
            if(Globals.websocket && Globals.websocket.readyState == 1) {
                Globals.websocket.send(message);
            }
        }

		hideCustomPanels() {
            Object.values(this.panels).forEach((panel) => {
                const el = document.getElementById(`ui-panel-${panel.id}`);
                if(el) {
                    el.style.display = "none";
                }
            });
        }

		onMessageReceived(data) {
			if(this.debug) {
                console.log(`FM+ onMessageReceived: ${data}`);
            }
            if(data) {
                this.forEachPlugin((plugin) => {
                    if(typeof plugin.onMessageReceived === "function") {
                        plugin.onMessageReceived(data);
                    }
                });
                if(data.startsWith("LOGGED_IN")) {
                    this.onLogin();

                } else if (data.startsWith("CHAT_LOCAL_MESSAGE=")) {
					const split = data.substring("CHAT_LOCAL_MESSAGE=".length).split("~");
					let [sender, message] = split[1].split(" yelled: ");
					//Server messages don't have the "yelled"
					if (!message) {
						message = sender;
						sender = "";
					}
					const chatData = {
						username: sender,
						tag: "none",
						sigil: "none",
						color: split[0],
						message: message,
						yell: true
					}
					this.onChat(chatData);

				} else if (data.startsWith("CHAT=")) {
                    const split = data.substring("CHAT=".length).split("~");

					const chatData = {
						username: split[0],
						tag: split[1],
						sigil: split[2],
						color: split[3],
						message: split[4],
						yell: false
					}
					this.onChat(chatData);
				}
			}
        }

		onLogin() {
			if(this.debug) {
                console.log(`FM+ onLogin`);
            }
            logFancy("login detected");
			
			document.getElementById("chat").insertAdjacentHTML("beforeend",`<div style="color: white;">
				<span><strong style="color:cyan">FYI: </strong> Use the /help command to see information on available chat commands.</span>
				<br>
			</div>`)

            this.forEachPlugin((plugin) => {
                if(typeof plugin.onLogin === "function") {
                    plugin.onLogin();
                }
            });
			this.loggedIn = true;

            //Chat auto scroll is always true for now
            chat_div_element.scrollTop = chat_div_element.scrollHeight;
        }

		onChat(data) {
			if(this.debug) {
                console.log(`FM+ onChat`, data);
            }
            this.forEachPlugin((plugin) => {
                if(typeof plugin.onChat === "function") {
                    plugin.onChat(data);
                }
            });
        }

		onPaint() {
			if(this.debug) {
                console.log("FM+ onPaint");
            }
            this.forEachPlugin((plugin) => {
                if(typeof plugin.onPaint === "function") {
                    plugin.onPaint();
                }
            });
        }

		onPanelChanged(panelBefore, panelAfter) {
            if(this.debug) {
                console.log(`FM+ onPanelChanged "${panelBefore}" -> "${panelAfter}"`);
            }
            if(panelAfter === "flatmmoplus") {
                this.refreshPanel("flatmmoplus");
            }
            this.forEachPlugin((plugin) => {
                if(typeof plugin.onPanelChanged === "function") {
                    plugin.onPanelChanged(panelBefore, panelAfter);
                }
            });
        }

		onMapChanged(mapBefore, mapAfter) {
            if(this.debug) {
                console.log(`FMMO+ onMapChanged "${mapBefore}" -> "${mapAfter}"`);
            }
            this.forEachPlugin((plugin) => {
                if(typeof plugin.onMapChanged === "function") {
                    plugin.onMapChanged(mapBefore, mapAfter);
                }
            });
        }

		onInventoryChanged(inventoryBefore, inventoryAfter) {
            if(this.debug) {
                console.log(`FMMO+ onInventoryChanged "${inventoryBefore}" -> "${inventoryAfter}"`);
            }
            this.forEachPlugin((plugin) => {
                if(typeof plugin.onInventoryChanged === "function") {
                    plugin.onInventoryChanged(inventoryBefore, inventoryAfter);
                }
            });
        }
	}

	// Add to window and init
    window.FlatMMOPlusPlugin = FlatMMOPlusPlugin;
    window.FlatMMOPlus = new FlatMMOPlus();

	window.FlatMMOPlus.customChatCommands["help"] = (command, data='') => {
        let help;
        if(data && data!="help") {
            let helpContent = window.FlatMMOPlus.customChatHelp[data.trim()] || "No help content was found for this command.";
			help = `<div style="color: white;">
              	<strong><u>Command Help:</u></strong><br />
				<span><strong style="color:cyan">/${data}:</strong> <span>${helpContent}</span>
				<br>`
        }
        else {
			help = `<div style="color: white;">
              	<strong><u>Command Help:</u></strong><br />
              	<strong>Available Commands:</strong> <span>${Object.keys(window.FlatMMOPlus.customChatCommands).sort().map(s => "/"+s).join(" ")}</span><br />
              	<span>Use the /help command for more information about a specific command: /help &lt;command&gt;</span>
			</div>`
        }
		if (window.FlatMMOPlus.plugins.hasOwnProperty("flatChat")) {
			window.FlatMMOPlus.plugins.flatChat.showWarning(help, "white");
		} else {
			document.getElementById("chat").insertAdjacentHTML("beforeend",help)
		}
        //Chat auto scroll is always true for now
		chat_div_element.scrollTop = chat_div_element.scrollHeight;
    };

	//flatChat overrides this
	window.FlatMMOPlus.registerCustomChatCommand(["clear", "clean"], (command, data='') => {
        document.getElementById("chat").innerHTML = "";
    }, `Clears all messages in chat.`);

	window.FlatMMOPlus.registerCustomChatCommand("yell", (command, data='') => {
        Globals.websocket.send('CHAT=/yell ' + data);
    }, `Chat to everyone on server.<br><strong>Usage:</strong> /yell [message]`);

	window.FlatMMOPlus.registerCustomChatCommand("stuck", (command, data='') => {
        Globals.websocket.send('CHAT=/stuck');
    }, `Use if your character is stuck and cannot move.`);

    window.FlatMMOPlus.registerCustomChatCommand(["players","who"], (command, data='') => {
        Globals.websocket.send('CHAT=/players');
    }, `Show all players online.`);

	internal.init.call(window.FlatMMOPlus);
})();