// ==UserScript==
// @name         FlatMMO+ SamplePlugin
// @namespace    com.dounford.flatmmo.sample
// @version      0.0.1
// @description  FlatMMO+ sample plugin
// @author       Anwinity ported by Dounford
// @license      MIT
// @match        *://flatmmo.com/play.php*
// @grant        none
// @require      https://update.greasyfork.org/scripts/544062/FlatMMOPlus.js
// ==/UserScript==
 
/**
 * Box used for collision detections
 * @typedef {Object} Box
 * @property {number} x1 Left Border
 * @property {number} x2 Right Border
 * @property {number} y1 Top border
 * @property {number} y2 Bottom Border
 */

/**
 * Click position used for collision detections
 * @typedef {Object} Click
 * @property {number} x Horizontal Position
 * @property {number} y Vertical Position
 */

/**
 * @typedef {Object} Path
 * @property {Box[]} boxes
 * @property {string} destination
 * @property {boolean} [ignoreDraw]
 */

/**
 * @typedef {Object} MapObject
 * @property {string} name
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} MapNpc
 * @property {string} name
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} GameMap
 * @property {string} ingameId
 * @property {string} displayName
 * @property {boolean} upperImg
 * @property {Path[]} paths
 * @property {MapObject[]} objects
 * @property {MapNpc[]} npcs
 */


(function() {
    'use strict';
 
    class SamplePlugin extends FlatMMOPlusPlugin {
        constructor() {
            super("sample", {
                about: {
                    name: "Interactive Map Constructor",
                    version: GM_info.script.version,
                    author: GM_info.script.author,
                    description: GM_info.script.description
                },
                config: [
                    {
                        id: "mapping",
                        label: "Yes / No",
                        type: "boolean",
                        default: true
                    }
                ]
            });
            this.loaded = false;
            this.lastClick = {x: 10, y: 13};

            /** @type {Object<string,GameMap>} */
            this.maps = {};
            this.npcs = new window.Map();
            this.objects = new window.Map();
            this.mappu = {m1001_1001: {
                ingameId: "m1001_1001",
                displayName: "Everbrook Mayor Front Yard",
                upperImg: true,
                paths: [
                    {
                        x1: 8,
                        y1: 13,
                        x2: 13,
                        y2: 13,
                        destination: "m1001_1000"
                    },
                    {
                        boxes: [
                            {
                                x1: 22,
                                y1: 7,
                                x2: 23,
                                y2: 7
                            },
                            {
                                x1: 23,
                                y1: 8,
                                x2: 23,
                                y2: 9
                            }
                        ],
                        destination: "m1002_1001"
                    },
                    {
                        x1: 4,
                        y1: 0,
                        x2: 6,
                        y2: 0,
                        destination: "m1001_1002"
                    },
                    {
                        x1: 9,
                        y1: 5,
                        x2: 11,
                        y2: 6,
                        destination: "m1001_1001_inside1",
                        ignoreDraw: true
                    }
                ],
                objects: [
                    {
                        name: "blue_flag",
                        x: 15,
                        y: 5
                    },
                    {
                        name: "triple_wooden_door",
                        x: 9,
                        y: 5
                    },
                    {
                        name: "anchovy_fish_spot",
                        x: 1,
                        y: 3
                    },
                    {
                        name: "shrimp_fish_spot",
                        x: 1,
                        y: 6
                    },
                    {
                        name: "shrimp_fish_spot",
                        x: 3,
                        y: 9
                    },
                    {
                        name: "oak_tree",
                        x: 18,
                        y: 2
                    }
                ],
                npcs: [
                    {
                        name: "everbrook_guard",
                        x: 18,
                        y: 10
                    }
                ]
            }}
        }

        async getData() {
            const response = await fetch("https://flat.dounford.qd.je/maps");
            const data = response.json();
            this.maps = data.maps
        }
 
        
        onLogin() {
            console.log("SamplePlugin.onLogin");
            //this.getData()
        }
 
        
        onMessageReceived(data) {
            if(!this.loaded || !this.config.mapping) return;
            if (data.startsWith("UPDATE_OBJECTS")) {
//UPDATE_OBJECTS=O_yfcppvejiu~waterfall_anim~~waterfall_anim~0~0~2~2~4~false~false~true~false~none~O_alczxhszpe~waterfall_anim~~waterfall_anim~1~0~2~2~4~false~false~true~false~none~O_jxrogqburk~waterfall_anim~~waterfall_anim~2~0~2~2~4~false~false~true~false~none~O_zrdiuiphix~waterfall_anim~~waterfall_anim~3~0~2~2~4~false~false~true~false~none~O_mfemqhgvcb~waterfall_anim~~waterfall_anim~4~0~2~2~4~false~false~true~false~none~O_djiliheacv~waterfall_anim~~waterfall_anim~0~1~2~2~4~false~false~true~false~none~O_rrijsnvios~waterfall_anim~~waterfall_anim~1~1~2~2~4~false~false~true~false~none~O_pkaenfecjm~waterfall_anim~~waterfall_anim~2~1~2~2~4~false~false~true~false~none~O_xtbnrseumx~waterfall_anim~~waterfall_anim~3~1~2~2~4~false~false~true~false~none~O_dobvyweisl~waterfall_anim~~waterfall_anim~4~1~2~2~4~false~false~true~false~none~O_bxbmpzrldu~coal_rock~Coal Rock~coal_rock~19~10~1~1~1~true~false~true~false~none~O_daydhazbai~coal_rock~Coal Rock~coal_rock~15~12~1~1~1~true~false~true~false~none~O_gqbopmjxsm~well~Well~well~15~3~2~2~1~true~false~true~false~none~O_tlpwximyea~mine_sign_two~Mine East of Here~mine_sign_two~20~7~2~3~1~false~false~true~false~none~O_celgvoqeon~maple_tree~Maple Tree~maple_tree~0~5~4~5~1~true~true~true~true~none~O_kbynmwefxq~sc_general_ev~Thieving Chest~bronze_thieving_chest~23~0~1~1~1~true~false~true~false~none~O_hstpkpxuml~dig_spot~Search Dirt~none~18~6~1~1~2~false~false~true~false~none~O_cpdwfjssau~general_store_sign~General Supply Shop~general_store_sign~21~4~1~2~1~false~false~true~false~none~O_bnhewedfeh~tree~Tree~tree~2~2~4~5~1~true~true~true~true~none~O_pznyucapsj~tree~Tree~tree~5~1~4~5~1~true~true~true~true~none~O_fyvkgcqivf~tree~Tree~tree~21~1~4~5~1~false~true~true~true~none~O_ajeelhfyqk~m1001_1000_door~Enter~single_wooden_door~19~3~1~2~1~true~false~true~false~none
            }
            // Will spam the console, uncomment if you want to see it
            //console.log("SamplePlugin.onMessageReceived: ", data);
        }

        onMessageSent(data) {
            if(!this.loaded || !this.config.mapping) return;
            if(teleport) {
                this.lastClick = null;
            } else if(click) {
                this.lastClick = {x: 0, y: 0};
            }
        }
 
        /**
         * 
         * @param {string} mapBefore 
         * @param {string} mapAfter 
         */
        onMapChanged(mapBefore, mapAfter) {
            if(!this.loaded || !this.config.mapping) return;
            if(!this.maps.hasOwnProperty(mapAfter)) {
                this.maps[mapAfter] = {
                    ingameId: mapAfter,
                    displayName: "",
                    upperImg: false,
                    paths: [],
                    objects: [],
                    npcs: []
                }
            }

            this.addPathDestination(mapBefore, mapAfter);
        }

        /**
         * Adds the destination of the last teleport used
         * @param {string} map 
         * @param {string} destination 
         */
        addPathDestination(map, destination) {
            if(this.lastClick === null) return;

            //The shape doesn't matter anymore, we break into blocks, there are some L shaped paths, I don't remember any T shaped, but it should work too
            const path = this.maps[map].find(path => {
                return path.boxes.some(box => this.checkCollision(this.lastClick, box))
            })

            if(path) {
                path.destination = destination;
                return;
            };
            
            const obj = this.maps[map].objects.find(obj => {
                const box = {
                    x1: obj.x,
                    x2: this.objects.get(obj.name).width || 1,
                    y1: obj.y,
                    y2: this.objects.get(obj.name).height || 1,
                }

                return this.checkCollision(this.lastClick, box);
            })

            if(obj) {
                this.maps[map].paths.push({
                    boxes: [
                        {
                            x1: obj.x,
                            x2: obj.x + (this.objects.get(obj.name).width || 1),
                            y1: obj.y,
                            y2: obj.y + (this.objects.get(obj.name).height || 1),
                        }
                    ],
                    destination,
                    ignoreDraw: true
                })
                return;
            }

            const npc = null

            if(npc) {

            }
        }

        /**
         * Checks collisions
         * @param {Click} click 
         * @param {Box} box 
         * @returns 
         */
        checkCollision(click, box) {
            return click.x >= box.x1 && click.x <= box.x2 &&
              click.y >= box.y1 && click.y <= box.y2;
        }
    }
 
    const plugin = new SamplePlugin();
    FlatMMOPlus.registerPlugin(plugin);
 
})();