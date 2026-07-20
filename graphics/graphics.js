// ==UserScript==
// @name         FlatMMO+ Graphic Settings
// @namespace    com.dounford.flatmmo.settingsPlus
// @version      0.0.1
// @description  Adds new Graphic Settings
// @author       Liam
// @license      MIT
// @match        *://flatmmo.com/play.php*
// @grant        none
// @require      https://update.greasyfork.org/scripts/544062/FlatMMOPlus.js
// ==/UserScript==
 
(function() {
    'use strict';

    const defaultCanvasWidth = 1536;
    const defaultCanvasHeight = 896;
    const defaultTileSize = 64;
 
    class SettingsPlugin extends FlatMMOPlusPlugin {
        constructor() {
            super("settings", {
                about: {
                    name: GM_info.script.name,
                    version: GM_info.script.version,
                    author: GM_info.script.author,
                    description: GM_info.script.description
                },
                config: [
                    {
                        type: "label",
                        label: "Section Label:"
                    },
                    {
                        id: "MyCheckbox",
                        label: "Yes / No",
                        type: "boolean",
                        default: true
                    },
                    {
                        id: "MyInteger",
                        label: "Pick a Integer Number",
                        type: "integer",
                        min: 1,
                        max: 10,
                        type: "integer",
                        default: 1
                    },
                    {
                        id: "MyNumber",
                        label: "Pick a Float Number",
                        type: "number",
                        min: 0,
                        max: 10,
                        step: 0.1,
                        default: 1.5
                    },
                    {
						id: "myRange",
						label: "Choose a volume",
						type: "range",
						min: 0,
						max: 100,
						step: 1,
						default: 100,
					},
                    {
                        id: "MyString",
                        label: "Enter a Thing",
                        type: "string",
                        max: 20,
                        default: "x"
                    },
                    {
                        id: "MySelect",
                        label: "Pick One",
                        type: "select",
                        options: [
                            {value: "opt1", label: "Option 1"},
                            {value: "opt2", label: "Option 2"},
                            {value: "opt3", label: "Option 3"}
                        ],
                        default: "opt2"
                    },
                    {
                        id: "myColor",
                        label: "Pick a color",
                        type: "color"
                    },
                    {
                        id: "inventoryPanel",
                        label: "Go to Inventory",
                        type: "panel",
                        panel: "inventory"
                    }
                ]
            });

            this.settings = {
                fps: 60,
                renderAspect: 1,
                canvasWidth: 1536,
                canvasHeight: 896,
                animations: true,
                chatAboveHead: true,
                paintEffects: 0, //0Vanilla - 1Text - 2None
                paintHitSplat: true,
                xpProgress: 0, //0Vanilla/Orbs - 1Old Vanilla/Rectangle - 2Text - 3None
            }
        }

        changeRenderResolution(value) {
            if(isNaN(value) || value <= 0) {
                console.error("Invalid value on changeRenderResolution, it needs to be a positive number")
                return;
            }
            canvasWidth = defaultCanvasWidth * value;
            canvasWidth = defaultCanvasWidth * value;
            TILE_SIZE = defaultTileSize * value;
        }

        onMapChanged() {
            //Just in case it doesn't update as soon as you go to another map
            setTimeout(()=> {
                let map = get_map(current_map);

                //paint_layer_0
                bgCtx.drawImage(map.get_background(), 0, 0, this.settings.canvasWidth, this.settings.canvasHeight)
                let shadow_bg = map.get_shadow_background();
                if(shadow_bg != null) {
                    bgCtx.drawImage(shadow_bg, 0, 0, this.settings.canvasWidth, this.settings.canvasHeight)
                }

                //paint_layer_1 - I don't think Smitty will use this again, but just in case I will keep it here
                /*let tiles = map.get_tiles();
                for(let y = 0; y < Y_TILES; y++) {
                    for(let x = 0; x < X_TILES; x++) {
                        let tile = tiles[y][x];
                        if(!tile.is_empty())
                        bgCtx.drawImage(tile.get_frame(), x * TILE_SIZE, y * TILE_SIZE)
                    }
                }*/

                //paint_layer_3
                if(map.upper_image != null) {
                    bgUpperCanvas.drawImage(map.upper_image, 0, 0, this.settings.canvasWidth, this.settings.canvasHeight)
                }
            }, 500);
        }

        changeVanilla() {
            //Map background doesn't change while you are in the room, so it doesn't need to be drawn every tick, once is enough
            paint_layer_0 = function(){};
            paint_layer_1 = function(){};
            paint_layer_3 = function(){};

            //Two new canvas are created
            window.bgCanvas = canvas.cloneNode();
            bgCanvas.id = "bgCanvas";
            window.bgCtx = bgCanvas.getContext("2d");
            window.bgUpperCanvas = canvas.cloneNode();
            bgUpperCanvas.id = "bgUpperCanvas";
            window.bgUpperCtx = bgUpperCanvas.getContext("2d");
            const canvasParent = document.createElement("div");
            canvasParent.style.position = "relative";
            canvas.style.position = "absolute";
            canvas.insertAdjacentElement("beforebegin", canvasParent);
            canvasParent.append(canvas, bgCanvas, bgUpperCanvas);

            this.onMapChanged();

            //Text calls are expensive
            const originalTextAboveHead = add_player_chat_over_head;
            add_player_chat_over_head = (username, message)=>{
                if(this.settings.chatAboveHead) originalTextAboveHead(username, message);
            };

            const originalPaintEffects = paint_effects;
            paint_effects = ()=>{
                if(this.settings.paintEffects === 0) {
                    originalPaintEffects();
                } else if(this.settings.paintEffects === 1) {
                    this.paintEffectsAsText();
                }
            }


            //I'm only modifying it to avoid calculating text width all the time
            HitSplat.prototype.constructor = function(value, color, x , y) {
                this.value = value;
                this.color = color;
                this.x = x;
                this.y = y;

                this.y_offset = 0;

                //It never changes, so it would be better to calculate it here
                ctx.font = "35px serif";
                this.textWidth = ctx.measureText(value).width;
            }

            paint_hit_splats = () => {
                if(this.settings.paintHitSplat === false) return;
                ctx.font = "35px serif";
                for (let slug in hit_splats) {
                    ctx.globalAlpha = 0.6;
                    if (hit_splats.hasOwnProperty(slug)) {
                    let obj = hit_splats[slug];
                    obj.tick();
                    let text_width = obj.textWidth;
                    
                    let x = obj.x;
                    let y = obj.y;
                    y -= obj.y_offset;

                    ctx.fillStyle = obj.color;
                    ctx.fillRect(x - 10, y - 10, text_width + 20, 35);
                    ctx.fillStyle = "white";
                    ctx.globalAlpha = 1.0;
                    ctx.fillText(obj.value, x, y + 20);
                    }
                }
                ctx.globalAlpha = 1.0;
            }

            this.settings = {
                fps: 60,
                renderAspect: 1,
                canvasWidth: 1536,
                canvasHeight: 896,
                animations: true,
                chatAboveHead: true,
                paintEffects: 0, //0Vanilla - 1Text - 2None
                paintHitSplat: true,
                xpProgress: 0, //0Vanilla/Orbs - 1Old Vanilla/Rectangle - 2Text - 3None
                paintParticles: true,
                paintProjectiles: true,
                paintNPCs: true,
                paintPets: true,
                pathAlgorithm: 0, //0Vanilla - 1Custom Smooth - 2Custom Minimal
                paintGroundItems: true,
                paintObjects: true,
                chatMaxMessages: 50000, 
                clearChat: false, //Remove last 20% of messages by default
                defaultInput: 0, // 0 Keyboard/mouse - 1 controller (requires) - 2 mobile gesture (require mobile gestures plugin Protractor directly into the standard JavaScript version of the $1 Recognizer algorithm)
            }

            paint_xp_drops = () => {
                
            }
            paint_level_drops = () => {
                
            }
            paint_xp_progress_bar = () => {
                
            }
            paint_npcs = () => {

            }
            paint_ground_items = () => {

            }
        }

        //TBD
        paintEffectsAsText() {
            if(is_snowing) {
                ctx.fillStyle = "white";
                for (const b of balls) {
                    b.y += b.vy;
                    if (b.y - b.r > ctx.canvas.height) b.y = -b.r, b.x = Math.random() * ctx.canvas.width;

                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            if(is_dark) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            if(is_underwater) {
                ctx.fillStyle = "rgba(0, 76, 255, 0.15)";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            if(is_volcan_heat) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.50)";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            if(thunder_effect_ticks > 50) {
                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            else if(thunder_effect_ticks > 40) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            else if(thunder_effect_ticks > 30) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            else if(thunder_effect_ticks > 10) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }

            if(thunder_effect_ticks > 0) {
                thunder_effect_ticks--;
            }
        }
 
        
        onConfigsChanged() {
            console.log("SamplePlugin.onConfigsChanged");
        }

        getRgbFromName(color) {
            const colorCtx = document.createElement('canvas').getContext('2d');
            colorCtx.fillStyle = color;
            return colorCtx.fillStyle;
        }
 
        
        onLogin() {
            console.log("SamplePlugin.onLogin");
        }
 
        
        onMessageReceived(data) {
            // Will spam the console, uncomment if you want to see it
            //console.log("SamplePlugin.onMessageReceived: ", data);
        }
 
        
        onChat(data) {
            // Could spam the console, uncomment if you want to see it
            //console.log("SamplePlugin.onChat", data);
        }

        
        onPanelChanged(panelBefore, panelAfter) {
            console.log("SamplePlugin.onPanelChange", panelBefore, panelAfter);
        }

        
        onInventoryChanged(inventoryBefore, inventoryAfter) {
            //It spams the console each time any modification happens
            // console.log("SamplePlugin.onInventoryChange", inventoryBefore, inventoryAfter);
        }
 

 
    }
 
    const plugin = new SettingsPlugin();
    FlatMMOPlus.registerPlugin(plugin);
 
})();