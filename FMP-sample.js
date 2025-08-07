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
                        label: "Pick a Number",
                        type: "integer",
                        min: 1,
                        max: 10,
                        type: "integer",
                        default: 1
                    },
                    {
                        id: "MyNumber",
                        label: "Pick a Cooler Number",
                        type: "number",
                        min: 0,
                        max: 10,
                        step: 0.1,
                        default: 1.5
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
                    }
                ]
            });
        }
 
        
        onConfigsChanged() {
            console.log("SamplePlugin.onConfigsChanged");
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
 
        
        onMapChanged(mapBefore, mapAfter) {
            // console.log("SamplePlugin.onMapChange", mapBefore, mapAfter);
        }

        
        onInventoryChanged(inventoryBefore, inventoryAfter) {
            //It spams the console each time any modification happens
            // console.log("SamplePlugin.onInventoryChange", inventoryBefore, inventoryAfter);
        }
 

 
    }
 
    const plugin = new SamplePlugin();
    FlatMMOPlus.registerPlugin(plugin);
 
})();