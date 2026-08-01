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
                        id: "map",
                        label: "Yes / No",
                        type: "boolean",
                        default: true
                    }
                ]
            });
            this.loaded = false;

            this.maps = new window.Map();
            this.npcs = new window.Map();
            this.objects = new window.Map();
        }

        async getData() {
            const response = await fetch("https://flat.dounford.qd.je/maps");
            const data = response.json();
            this.maps = data.maps
        }
 
        
        onLogin() {
            console.log("SamplePlugin.onLogin");
            this.getData()
        }
 
        
        onMessageReceived(data) {
            if(!this.loaded || !this.config.map) return;
            if (data.startsWith("UPDATE_OBJECTS")) {
//UPDATE_OBJECTS=O_yfcppvejiu~waterfall_anim~~waterfall_anim~0~0~2~2~4~false~false~true~false~none~O_alczxhszpe~waterfall_anim~~waterfall_anim~1~0~2~2~4~false~false~true~false~none~O_jxrogqburk~waterfall_anim~~waterfall_anim~2~0~2~2~4~false~false~true~false~none~O_zrdiuiphix~waterfall_anim~~waterfall_anim~3~0~2~2~4~false~false~true~false~none~O_mfemqhgvcb~waterfall_anim~~waterfall_anim~4~0~2~2~4~false~false~true~false~none~O_djiliheacv~waterfall_anim~~waterfall_anim~0~1~2~2~4~false~false~true~false~none~O_rrijsnvios~waterfall_anim~~waterfall_anim~1~1~2~2~4~false~false~true~false~none~O_pkaenfecjm~waterfall_anim~~waterfall_anim~2~1~2~2~4~false~false~true~false~none~O_xtbnrseumx~waterfall_anim~~waterfall_anim~3~1~2~2~4~false~false~true~false~none~O_dobvyweisl~waterfall_anim~~waterfall_anim~4~1~2~2~4~false~false~true~false~none~O_bxbmpzrldu~coal_rock~Coal Rock~coal_rock~19~10~1~1~1~true~false~true~false~none~O_daydhazbai~coal_rock~Coal Rock~coal_rock~15~12~1~1~1~true~false~true~false~none~O_gqbopmjxsm~well~Well~well~15~3~2~2~1~true~false~true~false~none~O_tlpwximyea~mine_sign_two~Mine East of Here~mine_sign_two~20~7~2~3~1~false~false~true~false~none~O_celgvoqeon~maple_tree~Maple Tree~maple_tree~0~5~4~5~1~true~true~true~true~none~O_kbynmwefxq~sc_general_ev~Thieving Chest~bronze_thieving_chest~23~0~1~1~1~true~false~true~false~none~O_hstpkpxuml~dig_spot~Search Dirt~none~18~6~1~1~2~false~false~true~false~none~O_cpdwfjssau~general_store_sign~General Supply Shop~general_store_sign~21~4~1~2~1~false~false~true~false~none~O_bnhewedfeh~tree~Tree~tree~2~2~4~5~1~true~true~true~true~none~O_pznyucapsj~tree~Tree~tree~5~1~4~5~1~true~true~true~true~none~O_fyvkgcqivf~tree~Tree~tree~21~1~4~5~1~false~true~true~true~none~O_ajeelhfyqk~m1001_1000_door~Enter~single_wooden_door~19~3~1~2~1~true~false~true~false~none
            }
            // Will spam the console, uncomment if you want to see it
            //console.log("SamplePlugin.onMessageReceived: ", data);
        }

        onMessageSent(data) {

        }
 

        onMapChanged(mapBefore, mapAfter) {
            // console.log("SamplePlugin.onMapChange", mapBefore, mapAfter);
        }
    }
 
    const plugin = new SamplePlugin();
    FlatMMOPlus.registerPlugin(plugin);
 
})();