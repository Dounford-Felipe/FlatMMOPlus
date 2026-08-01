// ==UserScript==
// @name         FlatMMO+ Graphic Settings
// @namespace    com.dounford.flatmmo.settingsPlus
// @version      1.0.0
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
    const effects = {
        //Text, bgColor, textColor
        snowing: ["Snowing", "#ddd", "white"],
        darkness: ["Darkness", "rgba(0, 0, 0, 0.75)", "white"],
        underwater: ["Underwater", "rgba(0, 76, 255, 0.15)", "white"],
        volcano: ["Heat", "rgba(255, 0, 0, 0.50)", "white"],
        thunder: ["Thunder", "rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 1)"],
    }
 
    class SettingsPlugin extends FlatMMOPlusPlugin {
        constructor() {
            super("settings", {
                about: {
                    name: "FlatMMO+ Graphic Settings",
                    version: "1.0.0",
                    author: "Liam",
                    description: "Adds new Graphic Settings"
                },
                config: [
                    {
						id: "fps",
						label: "FPS",
						type: "range",
						min: 1,
						max: 60,
						step: 1,
						default: 60,
					},
                    {
						id: "scale",
						label: "Render Scale",
						type: "range",
						min: 0.1,
						max: 1,
						step: 0.1,
						default: 1,
					},
                    {
						id: "animations",
						label: "Animations (You may need to reload)",
						type: "boolean",
						default: true
					},
                    {
						id: "effects",
						label: "Effects",
						type: "select",
						options: [
							{value: 0, label: "Vanilla"},
							{value: 1, label: "Text"},
							{value: 2, label: "None"}
						],
						default: 0
					},
                    {
						id: "hitsplat",
						label: "Hitsplat",
						type: "boolean",
						default: true
					},
                    {
						id: "chatOverHead",
						label: "Chat Over Head",
						type: "boolean",
						default: true
					},
                    {
						id: "xp",
						label: "XP Progress",
						type: "select",
						options: [
							{value: 0, label: "Vanilla (Orbs)"},
							{value: 1, label: "Old Vanilla (Rectangle)"},
							{value: 2, label: "Text"},
                            {value: 3, label: "None"}
						],
						default: 0
					},
                    {
						id: "particles",
						label: "Particles",
						type: "boolean",
						default: true
					},
                    {
						id: "projectiles",
						label: "Projectiles",
						type: "boolean",
						default: true
					},
                    {
						id: "npcs",
						label: "NPCs",
						type: "boolean",
						default: true
					},
                    {
						id: "pets",
						label: "Pets",
						type: "boolean",
						default: true
					},
                    /*{
						id: "pathing",
						label: "Path Algorithm",
						type: "select",
						options: [
							{value: "vanilla", label: "Vanilla"},
							{value: "custom", label: "Custom"},
							{value: "minimal", label: "Minimal"}
						],
						default: "vanilla"
					},*/
                    {
						id: "groundItems",
						label: "Ground Items",
						type: "boolean",
						default: true
					},
                    {
						id: "mapObjects",
						label: "Map Objects",
						type: "boolean",
						default: true
					},
                    {
						id: "maxMessages",
						label: "Max Messages On Chat (0 = unlimited)",
						type: "number",
						max: 5000,
                        min: 1,
						step: 50,
						default: 0
					},
                    {
						id: "presetLow",
						label: "Low End Preset",
						type: "btn",
                        func: ()=>{this.preset("low")}
					},
                    {
						id: "presetVanilla",
						label: "Vanilla Preset",
						type: "btn",
                        func: ()=>{this.preset("vanilla")}
					},
                    /*{ This will be used by controller/runes scripts
						id: "input",
						label: "Default Input",
						type: "select",
						options: [
							{value: "keyboard", label: "Vanilla"},
							//{value: "controller", label: "Controller"},
							//{value: "touch", label: "Touch Gestures"}
						],
						default: "keyboard"
					}*/
                ]
            });

            /*this.settings = {
                fps: 60,
                scale: 1,
                canvasWidth: 1536,
                canvasHeight: 896,
                animations: true,
                //chatAboveHead: true,
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
                defaultInput: 0, // 0 Keyboard/mouse - 1 controller (requires controller plugin) - 2 mobile gesture (requires mobile gestures plugin it uses Protractor version of the $1 Recognizer algorithm)
            }*/
        
            this.settings = {
                canvasWidth: 1536,
                canvasHeight: 896,
            }

            this.currentEffect = null;
        }

        addCSS() {
            const style = document.createElement("style");
            style.innerHTML = `
                .xpDiv {
                    background: aqua;
                    position: absolute;
                    right: 0;
                }
                .graphicsXp {
                    background-color: gray;
                    display: flex;
                    align-items: center;
                    text-align: center;
                    padding: 5px;
                    width: 214px;
                }
                .graphicsXpTitle {
                    text-transform: uppercase;
                }
            `
            document.head.append(style);
        }

        changeRenderResolution(value) {
            if(isNaN(value) || value <= 0) {
                console.error("Invalid value on changeRenderResolution, it needs to be a positive number")
                return;
            }
            canvasWidth = defaultCanvasWidth * value;
            canvasWidth = defaultCanvasWidth * value;
            TILE_SIZE = defaultTileSize * value;

            //TBD
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
                    bgUpperCtx.drawImage(map.upper_image, 0, 0, this.settings.canvasWidth, this.settings.canvasHeight)
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
                if(this.config.chatOverHead) originalTextAboveHead(username, message);
            };

            //FMP uses this function on onPaint()
            const originalPaintEffects = FlatMMOPlus.original_paint_effects;
            FlatMMOPlus.original_paint_effects = ()=>{
                if(this.config.effects === 0) {
                    originalPaintEffects();
                } else if(this.config.effects === 1) {
                    this.paintEffectsAsText();
                }
            }

            canvasParent.insertAdjacentHTML("afterbegin", `<span style="
                z-index: 999;
                position: absolute;
                background-color: white;
                right: 10px;
                font-size: 2rem;
                padding: 5px;
                border-radius: 10%;
                top: 10px;
                display:none
            " id="effectsSpan"></span>
            `)

            


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
                if(this.config.hitsplat === false) return;
                ctx.font = "35px serif";
                for (let slug in hit_splats) {
                    ctx.globalAlpha = 0.6;
                    if (hit_splats.hasOwnProperty(slug)) {
                    let obj = hit_splats[slug];
                    obj.tick();
                    let text_width = obj?.textWidth || 1;
                    
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

            //Same as HitSplat, the code could save some cycles with text
            GroundItem.prototype.constructor = function(uuid, name, amount, x, y) {
                this.uuid = uuid;
                this.name = name;
                this.amount = amount;
                this.x = x;
                this.y = y;
                this.mouse_hovering_over = false;
                this.opacity = 1.0;
                let image = new Image();
                image.src = "images/items/" + name + ".png";
                this.image = image;

                //Text is expensive, it's better to measure it on creation
                this.label = format_snake_case(name);
                this.textWidth = ctx.measureText(this.label).width;
            }

            paint_ground_items = () => {
                if(this.settings.paintGroundItems === false) return;
                let ground_items_seen = []
                for(let i = 0; i < ground_items.length; i++) {
                    let ground_item = ground_items[i];

                    let count_seen = 0;
                    for(let j = 0; j < ground_items_seen.length; j++) {
                        let ground_item_seen = ground_items_seen[j];
                        if(ground_item_seen.x == ground_item.x && ground_item_seen.y == ground_item.y) {
                            count_seen++;
                        }
                    }
                    ground_items_seen.push(ground_item)

                    
                    let label = ground_item.label || "";
                    if(count_seen == 3) {
                        label = "...";
                    }
                    if(ground_item.amount > 1) {
                        label += " ("+format_number(ground_item.amount)+")"
                    }
                    let text_width = ground_item?.textWidth || 1;
                    ctx.fillStyle = "silver"
                    ctx.globalAlpha = 1.0;
                    if(count_seen < 4) {
                        ctx.fillText(label, ground_item.x * TILE_SIZE + TILE_SIZE / 2 - text_width/2, ground_item.y * TILE_SIZE + TILE_SIZE + 4 + (count_seen * 15));
                    }
                    

                    ctx.globalAlpha = ground_item.get_opacity()
                    ctx.drawImage(ground_item.image, ground_item.x * TILE_SIZE + (TILE_SIZE/12), ground_item.y * TILE_SIZE + (TILE_SIZE/12));
                }
            }

            const originalXpProgressBar = paint_xp_progress_bar;
            paint_xp_progress_bar = () => {
                if(this.config.xp === 0) {
                    originalXpProgressBar();
                } else if(this.config.xp === 1) {
                    this.paintOldXp();
                }
            }

            const originalPaintNpcs = paint_npcs;
            paint_npcs = () => {
                if(this.settings.npcs === false) return;
                originalPaintNpcs();
            }

            const originalPaintObjectsLower = paint_map_objects_lower;
            paint_map_objects_lower = () => {
                if(this.settings.mapObjects === false) return;
                originalPaintObjectsLower();
            }

            const originalPaintObjectsUpper = paint_map_objects_upper;
            paint_map_objects_upper = () => {
                if(this.settings.mapObjects === false) return;
                originalPaintObjectsUpper();
            }

            const originalPaintObjectsLowerShadows = paint_map_objects_lower_shadows;
            paint_map_objects_lower_shadows = () => {
                if(this.settings.mapObjects === false) return;
                originalPaintObjectsLowerShadows();
            }
            
            const originalPaintParticles = paint_particles;
            paint_particles = () => {
                if(this.settings.particles === false) return;
                originalPaintParticles();
            }

            //This is considered particle
            const originalPaintXpDrop = paint_xp_drops;
            paint_xp_drops = () => {
                if(this.settings.particles === false) return;
                originalPaintXpDrop();
            }

            //This is considered particle
            const originalPaintLvlDrop = paint_level_drops;
            paint_level_drops = () => {
                if(this.settings.particles === false) return;
                originalPaintLvlDrop();
            }

            const originalPaintProjectiles = paint_projectiles;
            paint_projectiles = () => {
                if(this.settings.projectiles === false) return;
                originalPaintProjectiles();
            }

            const originalXpTracker = update_session_XP_tracker;
            update_session_XP_tracker = (skillName, newXP) => {
                if(this.config.xp === 2) {
                    this.paintXpText(skillName);
                }
                originalXpTracker(skillName, newXP);
            }
        }

        paintEffectsAsText() {
            const effectSpan = document.getElementById("effectsSpan");

            let currentEffect = null;
            if(thunder_effect_ticks > 0) {
                currentEffect = "thunder"
                thunder_effect_ticks--;
            } else if(is_snowing) {
                currentEffect = "snowing";
            } else if(is_dark) {
                currentEffect = "darkness";
            } else if(is_underwater) {
                currentEffect = "underwater";
            } else if(is_volcan_heat) {
                currentEffect = "volcano"
            }


            
            if(this.currentEffect !== currentEffect) {
                this.currentEffect = currentEffect;
                if(currentEffect) {
                    effectSpan.innerText = effects[currentEffect][0];
                    effectSpan.style.backgroundColor = effects[currentEffect][1];
                    effectSpan.style.color = effects[currentEffect][2];
                    effectSpan.style.display = "";
                } else {
                    effectSpan.style.display = "none";
                }
            }
        }

        paintOldXp() {
            const PADDING = 10;
            let yOffset = 0;
            let y = 0.2 * TILE_SIZE;
            for (let s in xp_progress_bar_top_right) {
                const not = xp_progress_bar_top_right[s];
                if(not.ticks <= 0) {
                    delete xp_progress_bar_top_right[s];
                    continue;
                }
                not.ticks--;
                if(!not.hasOwnProperty("xpi")) {
                    not.xpi = parseInt(not.xp.replaceAll(",",""));
                }
                if(not.xpi > 10004999) {//lvl 100
                    continue;
                }
                //We don't need to call this function all the time
                if(!not.hasOwnProperty("image")) {
                    not.image = get_image_large_icon(s);
                }
                if(!not.hasOwnProperty("title")) {
                    not.title = s.toUpperCase();
                }
                if(!not.hasOwnProperty("text")) {
                    not.text = not.xp + " / " + not.xp_next + " xp"
                }
                ctx.font = "20px serif";
                ctx.fillStyle = "white";
                ctx.globalAlpha = 0.2;
                ctx.fillRect(20.5 * TILE_SIZE, y + yOffset, TILE_SIZE * 3.5 - PADDING, TILE_SIZE - PADDING);
                ctx.globalAlpha = 1.0;
                ctx.drawImage(not.image, 20.5 * TILE_SIZE + PADDING, y + 10 - yOffset, 32, 32);
                ctx.fillText(not.title, 20.5 * TILE_SIZE + 50, y + 20 - yOffset);
                ctx.font = "16px serif";
                ctx.fillText(not.text, 20.5 * TILE_SIZE + 50, y + 40 - yOffset);
                yOffset += TILE_SIZE;
            }
        }

        paintXpText(s) {
            const not = xp_progress_bar_top_right[s]
            let skillDiv = document.querySelector(`.graphicsXp[data-skill='${s}']`)
            if(skillDiv === null) {
                skillDiv = document.createElement("div");
                skillDiv.setAttribute("data-skill", s);
                skillDiv.className = "graphicsXp";

                skillDiv.innerHTML = `<img src="images/icons/${s}_large.png" width="32" height="32">
                <div>
                    <span class="graphicsXpTitle">${s}</span>
                    <span class="graphicsXpText">${not?.xp + " / " + not?.xp_next + " xp"}</span>
                </div>`;
                document.getElementById("xpDiv").append(skillDiv);
            } else {
                skillDiv.querySelector("graphicsXpText").innerText = not?.xp + " / " + not?.xp_next + " xp";
            }
            clearTimeout(not.timeout)
            not.timeout = setTimeout(()=>{skillDiv.remove()}, 5000);
        }

        removeAllAnimations() {

        }
 
        
        onConfigsChanged() {
			this.changedConfigs.forEach(config => {
				switch (config) {
                    case "fps": {
                        const fps = this.config.fps;
                        fps_interval = 1000 / fps;
                    } break;
					case "scale": {
                        this.changeRenderResolution(this.config.scale);
                    } break;
                    case "animations": {
                        if(this.config.animations === false) {
                            this.removeAllAnimations();
                        }
                    } break;
                    case "pets": {
                        window.hide_pets = !this.config.pets;
                    } break;
                }
            })
        }

        getRgbFromName(color) {
            const colorCtx = document.createElement('canvas').getContext('2d');
            colorCtx.fillStyle = color;
            return colorCtx.fillStyle;
        }

        preset(pres) {
            this.config = {}

            this.changedConfigs.add("fps");
            this.changedConfigs.add("scale");
            this.changedConfigs.add("animations");
            this.changedConfigs.add("pets");
            this.onConfigsChanged()
        }

        onLogin() {
            this.addCSS();
            this.changeVanilla();
        }
    }
 
    const plugin = new SettingsPlugin();
    FlatMMOPlus.registerPlugin(plugin);
 
})();