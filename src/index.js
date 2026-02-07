/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {blocks} from './blocks/text';
import {forBlock} from './generators/javascript';
import {javascriptGenerator} from 'blockly/javascript';
import {save, load} from './serialization';
import {toolbox} from './toolbox';
import './index.css';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

// Custom Sparkle Mutator Icon - replaces the gear icon with sparkles
class SparkleMutatorIcon extends Blockly.icons.MutatorIcon {
  initView(pointerdownListener) {
    if (this.svgRoot) return;
    super.initView(pointerdownListener);

    // Remove the default gear icon elements
    while (this.svgRoot.firstChild) {
      this.svgRoot.removeChild(this.svgRoot.firstChild);
    }

    // Add a pink background circle
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.CIRCLE,
      {
        class: 'blocklyIconShape',
        r: '8',
        cx: '8',
        cy: '8',
        fill: '#FF69B4',
      },
      this.svgRoot
    );

    // Add the sparkles icon (scaled down from 24x24 to fit 16x16)
    const sparklesGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {
        transform: 'scale(0.6) translate(1, 1)',
      },
      this.svgRoot
    );

    // Main sparkle shape
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {
        d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
        fill: 'white',
        stroke: 'none',
      },
      sparklesGroup
    );

    // Small cross sparkle (top right)
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {
        d: 'M20 2v4M22 4h-4',
        fill: 'none',
        stroke: 'white',
        'stroke-width': '2',
        'stroke-linecap': 'round',
      },
      sparklesGroup
    );

    // Small circle sparkle (bottom left)
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.CIRCLE,
      {
        cx: '4',
        cy: '20',
        r: '2',
        fill: 'white',
      },
      sparklesGroup
    );
  }
}

// Register the custom sparkle icon to replace the default mutator icon
Blockly.registry.register(
  Blockly.registry.Type.ICON,
  Blockly.icons.MutatorIcon.TYPE.toString(),
  SparkleMutatorIcon,
  true
);

// Rename "if" block to "feel" block
Blockly.Msg['CONTROLS_IF_MSG_IF'] = 'feel';
Blockly.Msg['CONTROLS_IF_MSG_ELSEIF'] = 'else feel';
Blockly.Msg['CONTROLS_IF_MSG_THEN'] = 'then';

// Define Barbie theme with pink colors
Blockly.Themes.Barbie = Blockly.Theme.defineTheme('barbie', {
  base: Blockly.Themes.Classic,
  blockStyles: {
    logic_blocks: {
      colourPrimary: '#FF69B4',
      colourSecondary: '#FFB6C1',
      colourTertiary: '#FFC0CB',
    },
    loop_blocks: {
      colourPrimary: '#FF1493',
      colourSecondary: '#FF69B4',
      colourTertiary: '#FFB6C1',
    },
    math_blocks: {
      colourPrimary: '#DB7093',
      colourSecondary: '#FFB6C1',
      colourTertiary: '#FFC0CB',
    },
    text_blocks: {
      colourPrimary: '#C71585',
      colourSecondary: '#FF69B4',
      colourTertiary: '#FFB6C1',
    },
    list_blocks: {
      colourPrimary: '#FF85A2',
      colourSecondary: '#FFB6C1',
      colourTertiary: '#FFC0CB',
    },
    variable_blocks: {
      colourPrimary: '#E75480',
      colourSecondary: '#FF69B4',
      colourTertiary: '#FFB6C1',
    },
    procedure_blocks: {
      colourPrimary: '#DE3163',
      colourSecondary: '#FF69B4',
      colourTertiary: '#FFB6C1',
    },
  },
  categoryStyles: {
    logic_category: {colour: '#FF69B4'},
    loop_category: {colour: '#FF1493'},
    math_category: {colour: '#DB7093'},
    text_category: {colour: '#C71585'},
    list_category: {colour: '#FF85A2'},
    variable_category: {colour: '#E75480'},
    procedure_category: {colour: '#DE3163'},
  },
  componentStyles: {
    workspaceBackgroundColour: '#FFF0F5',
    toolboxBackgroundColour: '#FFB6C1',
    toolboxForegroundColour: '#FFFFFF',
    flyoutBackgroundColour: '#FFC0CB',
    flyoutForegroundColour: '#FFFFFF',
    flyoutOpacity: 0.9,
    scrollbarColour: '#FF69B4',
    scrollbarOpacity: 0.6,
    insertionMarkerColour: '#FF1493',
    insertionMarkerOpacity: 0.5,
    cursorColour: '#FF69B4',
  },
});

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode').firstChild;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const ws = Blockly.inject(blocklyDiv, {toolbox, theme: Blockly.Themes.Barbie});

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  const code = javascriptGenerator.workspaceToCode(ws);
  codeDiv.innerText = code;

  outputDiv.innerHTML = '';

  eval(code);
};

// Load the initial state from storage and run the code.
load(ws);
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  runCode();
});
