/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

goog.provide('Blockly.Colours');

Blockly.Colours = {
  // SVG colours: these must be specificed in #RRGGBB style
  // To add an opacity, this must be specified as a separate property (for SVG fill-opacity)
  // Category hues follow metal gradients (145deg-style: light -> dark):
  // gold #d4af37–#7a5c1a, silver #cfcfcf–#6a6a6a, copper #b87333–#5a2e12,
  // iron #6e6e6e–#2a2a2a, platinum #e5e4e2–#8c8c8c
  "motion": {
    // silver
    "primary": "#CFCFCF",
    "secondary": "#989898",
    "tertiary": "#6A6A6A",
    "quaternary": "#6A6A6A"
  },
  "looks": {
    // platinum
    "primary": "#E5E4E2",
    "secondary": "#BCBBB9",
    "tertiary": "#8C8C8C",
    "quaternary": "#8C8C8C"
  },
  "sounds": {
    // copper
    "primary": "#B87333",
    "secondary": "#8C5122",
    "tertiary": "#5A2E12",
    "quaternary": "#5A2E12"
  },
  "control": {
    // gold
    "primary": "#D4AF37",
    "secondary": "#A78528",
    "tertiary": "#7A5C1A",
    "quaternary": "#7A5C1A"
  },
  "event": {
    // gold
    "primary": "#D4AF37",
    "secondary": "#A78528",
    "tertiary": "#7A5C1A",
    "quaternary": "#7A5C1A"
  },
  "sensing": {
    // silver
    "primary": "#CFCFCF",
    "secondary": "#989898",
    "tertiary": "#6A6A6A",
    "quaternary": "#6A6A6A"
  },
  "pen": {
    // iron
    "primary": "#6E6E6E",
    "secondary": "#4C4C4C",
    "tertiary": "#2A2A2A",
    "quaternary": "#2A2A2A"
  },
  "operators": {
    // iron
    "primary": "#6E6E6E",
    "secondary": "#4C4C4C",
    "tertiary": "#2A2A2A",
    "quaternary": "#2A2A2A"
  },
  "data": {
    // copper
    "primary": "#B87333",
    "secondary": "#8C5122",
    "tertiary": "#5A2E12",
    "quaternary": "#5A2E12"
  },
  // This is not a new category, but rather for differentiation
  // between lists and scalar variables.
  "data_lists": {
    // copper (slightly deeper secondary for lists)
    "primary": "#A8682E",
    "secondary": "#7A4518",
    "tertiary": "#4A260E",
    "quaternary": "#4A260E"
  },
  "more": {
    // platinum
    "primary": "#E5E4E2",
    "secondary": "#BCBBB9",
    "tertiary": "#8C8C8C",
    "quaternary": "#8C8C8C"
  },
  "text": "#FFFFFF",
  "workspace": "#F9F9F9",
  "toolboxHover": "#989898",
  "toolboxSelected": "#e9eef2",
  "toolboxText": "#575E75",
  "toolbox": "#FFFFFF",
  "flyout": "#F9F9F9",
  "scrollbar": "#CECDCE",
  "scrollbarHover": '#CECDCE',
  "textField": "#FFFFFF",
  "textFieldText": "#575E75",
  "insertionMarker": "#000000",
  "insertionMarkerOpacity": 0.2,
  "dragShadowOpacity": 0.3,
  "stackGlow": "#FFF200",
  "stackGlowSize": 4,
  "stackGlowOpacity": 1,
  "replacementGlow": "#FFFFFF",
  "replacementGlowSize": 2,
  "replacementGlowOpacity": 1,
  "colourPickerStroke": "#FFFFFF",
  // CSS colours: support RGBA
  "fieldShadow": "rgba(0,0,0,0.1)",
  "dropDownShadow": "rgba(0, 0, 0, .3)",
  "numPadBackground": "#547AB2",
  "numPadBorder": "#435F91",
  "numPadActiveBackground": "#435F91",
  "numPadText": "white", // Do not use hex here, it cannot be inlined with data-uri SVG
  "valueReportBackground": "#FFFFFF",
  "valueReportBorder": "#AAAAAA",
  "menuHover": "rgba(0, 0, 0, 0.2)"
};

/**
 * Override the colours in Blockly.Colours with new values basded on the
 * given dictionary.
 * @param {!Object} colours Dictionary of colour properties and new values.
 * @package
 */
Blockly.Colours.overrideColours = function(colours) {
  // Colour overrides provided by the injection
  if (colours) {
    for (var colourProperty in colours) {
      if (colours.hasOwnProperty(colourProperty) &&
          Blockly.Colours.hasOwnProperty(colourProperty)) {
        // If a property is in both colours option and Blockly.Colours,
        // set the Blockly.Colours value to the override.
        // Override Blockly category color object properties with those
        // provided.
        var colourPropertyValue = colours[colourProperty];
        if (goog.isObject(colourPropertyValue)) {
          for (var colourSequence in colourPropertyValue) {
            if (colourPropertyValue.hasOwnProperty(colourSequence) &&
              Blockly.Colours[colourProperty].hasOwnProperty(colourSequence)) {
              Blockly.Colours[colourProperty][colourSequence] =
                  colourPropertyValue[colourSequence];
            }
          }
        } else {
          Blockly.Colours[colourProperty] = colourPropertyValue;
        }
      }
    }
  }
};
