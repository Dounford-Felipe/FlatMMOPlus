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

    const presets = {
        verylow: {
            "fps": 10,
            "scale": 0.2,
            "animations": false,
            "effects": "2",
            "hitsplat": false,
            "chatOverHead": false,
            "xp": "3",
            "particles": false,
            "projectiles": false,
            "npcs": false,
            "pets": false,
            "groundItems": false,
            "showItemAmount": false,
            "mapObjects": true,
            "maxMessages": 200
        },
        low: {
            "fps": 20,
            "scale": 0.5,
            "animations": false,
            "effects": "1",
            "hitsplat": true,
            "chatOverHead": false,
            "xp": "2",
            "particles": false,
            "projectiles": true,
            "npcs": true,
            "pets": false,
            "groundItems": true,
            "showItemAmount": false,
            "mapObjects": true,
            "maxMessages": 2000
        },
        vanilla: {
            "fps": 60,
            "scale": 1,
            "animations": true,
            "effects": "0",
            "hitsplat": true,
            "chatOverHead": true,
            "xp": "0",
            "particles": true,
            "projectiles": true,
            "npcs": true,
            "pets": true,
            "groundItems": true,
            "showItemAmount": true,
            "mapObjects": true,
            "maxMessages": 0
        }
    }

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
						id: "showItemAmount",
						label: "Show Ground Items Amount",
						type: "boolean",
						default: false
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
                #effectsSpan {
                    z-index: 999;
                    position: absolute;
                    background-color: white;
                    right: 10px;
                    font-size: 2rem;
                    padding: 5px;
                    border-radius: 10%;
                    top: 10px;
                    display: none
                }
            `
            document.head.append(style);
        }

        /**
         * Changes the scale in which the game is rendered
         * @param {number} value Scale factor
         */
        changeRenderResolution(value) {
            if(isNaN(value) || value <= 0) {
                console.error("Invalid value on changeRenderResolution, it needs to be a positive number")
                return;
            }
            canvas.width = defaultCanvasWidth * value;
            canvas.height = defaultCanvasHeight * value;

            ctx.scale(value, value);

            if(value === 1) {
                canvas.style.imageRendering = "";
            } else {
                canvas.style.imageRendering = "pixelated";
            }
        }

        updateMapBg() {
            bgCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
            bgUpperCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

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
        }

        onMapChanged() {
            this.updateMapBg();
        }

        changeVanilla() {
            //I will use setTransform for the scale, it shouldn't be too expensive, just some matrix multiplications
            const originalSetTransform = ctx.setTransform;

            ctx.setTransform = function(a, b, c, d, e, f) {
                if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) {
                    const scale = FlatMMOPlus.plugins.settings.config.scale || 1;
                    return originalSetTransform.call(ctx, scale, 0, 0, scale, 0, 0);
                }
                return originalSetTransform.apply(ctx, arguments);
            };

            //There are a lot of measureText on the code, instead of replacing it, I added a cache, 
            const originalMeasureText = ctx.measureText;
            window.TextMetricsCache = new window.Map();
            ctx.measureText = function(text){
                const key = this.font + ":" + text;

                if(!TextMetricsCache.has(key)) {
                    TextMetricsCache.set(key, originalMeasureText.call(this, text))
                }
                return TextMetricsCache.get(key) 
            }

            //Map background doesn't change while you are in the room, so it doesn't need to be drawn every tick, once is enough
            //Layer 0 is the first paint function I will clear text there
            paint_layer_0 = function(){
                textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
            };
            paint_layer_1 = function(){};
            paint_layer_3 = function(){};

            //Two new canvas are created
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = defaultCanvasWidth + 'px';
            canvas.style.height = defaultCanvasHeight + 'px';
            
            window.bgCanvas = canvas.cloneNode();
            bgCanvas.id = "bgCanvas";

            window.bgUpperCanvas = canvas.cloneNode();
            bgUpperCanvas.id = "bgUpperCanvas";
            bgUpperCanvas.style.pointerEvents = "none";

            window.textCanvas = canvas.cloneNode();
            textCanvas.id = "textCanvas";
            textCanvas.style.pointerEvents = "none";

            window.bgCtx = bgCanvas.getContext("2d");
            window.bgUpperCtx = bgUpperCanvas.getContext("2d");
            window.textCtx = textCanvas.getContext("2d");

            const canvasParent = document.createElement("div");
            canvasParent.style.position = "relative";
            canvasParent.style.width = canvas.width + "px";
            canvasParent.style.height = canvas.height + "px";

            canvas.replaceWith(canvasParent);

            canvasParent.append(bgCanvas, canvas, bgUpperCanvas, textCanvas);

            this.onMapChanged();

            canvasParent.insertAdjacentHTML("afterbegin", `<span id="effectsSpan"></span>`)


            //I didn't want text to look blurry, so I made another canvas just for text, there's no way I'm changing each paint function one by one, so I will hack the fillText and the ctx properties, very clever I know
            ctx.fillText = function(...args) {
                textCtx.fillText(...args);
            };
            ctx.strokeText = function(...args) {
                textCtx.strokeText(...args);
            };
            const ctxProperties = ['font', 'textAlign', 'textBaseline', 'fillStyle', 'strokeStyle', 'lineWidth'];
            ctx.props = {};

            ctxProperties.forEach(prop => {
                Object.defineProperty(ctx, prop, {
                    get: function() {
                        return this.props[prop];
                    },
                    set: function(newValue) {
                        this.props[prop] = newValue;
                        textCtx[prop] = newValue;
                    },
                    configurable: true,
                    enumerable: true
                });
            });

            //Text calls are expensive
            const originalTextAboveHead = add_player_chat_over_head;
            add_player_chat_over_head = (username, message)=>{
                if(this.config.chatOverHead) originalTextAboveHead(username, message);
            };

            //FMP uses this function on onPaint()
            const originalPaintEffects = FlatMMOPlus.original_paint_effects;
            FlatMMOPlus.original_paint_effects = ()=>{
                if(this.config.effects === "0") {
                    originalPaintEffects();
                } else if(this.config.effects === "1") {
                    this.paintEffectsAsText();
                }
            }

            window.groundItemImageCache = new window.Map();

            //The code could save some cycles with amount and creating new images
            GroundItem.prototype.constructor = function(uuid, name, amount, x, y) {
                this.uuid = uuid;
                this.name = name;
                this.amount = FlatMMOPlus.plugins.settings.config.showItemAmount ? amount : 0;
                this.x = x;
                this.y = y;
                this.mouse_hovering_over = false;
                this.opacity = 1.0;

                //The original implementation creates a new image instance every time a new item drops, this is a waste
                //Images will be cached until reload, but it is usually fine
                if (groundItemImageCache.has(name)) {
                    this.image = groundItemImageCache.get(name);
                } else {
                    let image = new Image();
                    image.src = "images/items/" + name + ".png";
                    groundItemImageCache.set(name, image);
                    this.image = image;
                }
            }

            FlatMMOPlus.paint_ground_items = () => {
                if(this.config.groundItems === false) return;
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
                    /* Liam - this is not worth the additional cost, even considering the cache
                    if(count_seen == 3) {
                        label = "...";
                    }*/
                   //Instead of removing it here I will remove it on creation
                    if(ground_item.amount > 1) {
                        label += " ("+format_number(ground_item.amount)+")"
                    }
                    let text_width = ctx.measureText(label).width;
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
                if(this.config.xp === "0") {
                    originalXpProgressBar();
                } else if(this.config.xp === "1") {
                    this.paintOldXp();
                }
            }

            const originalPaintNpcs = paint_npcs;
            paint_npcs = () => {
                if(this.config.npcs === false) return;
                originalPaintNpcs();
            }

            const originalPaintObjectsLower = paint_map_objects_lower;
            paint_map_objects_lower = () => {
                if(this.config.mapObjects === false) return;
                originalPaintObjectsLower();
            }

            const originalPaintObjectsUpper = paint_map_objects_upper;
            paint_map_objects_upper = () => {
                if(this.config.mapObjects === false) return;
                originalPaintObjectsUpper();
            }

            const originalPaintObjectsLowerShadows = paint_map_objects_lower_shadows;
            paint_map_objects_lower_shadows = () => {
                if(this.config.mapObjects === false) return;
                originalPaintObjectsLowerShadows();
            }
            
            const originalPaintParticles = paint_particles;
            paint_particles = () => {
                if(this.config.particles === false) return;
                originalPaintParticles();
            }

            //This is considered particle
            const originalPaintXpDrop = paint_xp_drops;
            paint_xp_drops = () => {
                if(this.config.particles === false) return;
                originalPaintXpDrop();
            }

            //This is considered particle
            const originalPaintLvlDrop = paint_level_drops;
            paint_level_drops = () => {
                if(this.config.particles === false) return;
                originalPaintLvlDrop();
            }
            
            const originalPaintHitSplat = paint_hit_splats;
            paint_hit_splats = () => {
                if(this.config.hitSplat === false) return;
                originalPaintHitSplat();
            }

            const originalPaintProjectiles = paint_projectiles;
            paint_projectiles = () => {
                if(this.config.projectiles === false) return;
                originalPaintProjectiles();
            }

            const originalXpTracker = update_session_XP_tracker;
            update_session_XP_tracker = (skillName, newXP) => {
                if(this.config.xp === "2") {
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
                skillDiv.querySelector(".graphicsXpText").innerText = not?.xp + " / " + not?.xp_next + " xp";
            }
            clearTimeout(not.timeout)
            not.timeout = setTimeout(()=>{skillDiv.remove()}, 5000);
        }

        removeAllAnimations() {

        }
 
        
        onConfigsChanged() {
            this.changedConfigs.forEach(config => {
                console.log(config)
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
                        hide_pets = !this.config.pets;
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
            if(FlatMMOPlus.version < "1.5.4.3") {
                window.alert(`Your FlatMMO+ version (${FlatMMOPlus.version}) is bellow the required (1.5.4.2), you need to update it.`);
                return;
            }
            this.addCSS();
            this.changeVanilla();
        }
    }
 
    const plugin = new SettingsPlugin();
    FlatMMOPlus.registerPlugin(plugin);
 
})();