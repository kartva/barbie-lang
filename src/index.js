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

// Monkey-patch MutatorIcon to replace the gear with sparkles
const originalInitView = Blockly.icons.MutatorIcon.prototype.initView;
Blockly.icons.MutatorIcon.prototype.initView = function (pointerdownListener) {
  // Call original to set up svgRoot and event listeners
  originalInitView.call(this, pointerdownListener);

  // Remove the default gear icon elements
  while (this.svgRoot.firstChild) {
    this.svgRoot.removeChild(this.svgRoot.firstChild);
  }

  // Add a pink background rounded rect
  Blockly.utils.dom.createSvgElement(
    Blockly.utils.Svg.RECT,
    {
      class: 'blocklyIconShape',
      rx: '4',
      ry: '4',
      height: '16',
      width: '16',
      fill: '#FF69B4',
    },
    this.svgRoot
  );

  // Add the sparkles icon (scaled down from 24x24 to fit ~14x14 centered)
  const sparklesGroup = Blockly.utils.dom.createSvgElement(
    Blockly.utils.Svg.G,
    {
      transform: 'translate(1, 1) scale(0.58)',
    },
    this.svgRoot
  );

  // Main sparkle shape (4-pointed star)
  Blockly.utils.dom.createSvgElement(
    Blockly.utils.Svg.PATH,
    {
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
      fill: 'white',
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
};

Blockly.Msg['CONTROLS_IF_MSG_IF'] = 'feel';
Blockly.Msg['CONTROLS_IF_MSG_ELSEIF'] = 'otherwise';
Blockly.Msg['CONTROLS_IF_MSG_THEN'] = 'then';
Blockly.Msg['CONTROLS_IF_IF_TITLE_IF'] = 'feel';
Blockly.Msg['CONTROLS_IF_ELSEIF_TITLE_ELSEIF'] = 'otherwise';
Blockly.Msg['CONTROLS_IF_ELSE_TITLE_ELSE'] = 'otherwise';

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

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    const currentScale = ws.getScale();
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      ws.setScale(currentScale * 1.2);
    }
    if (e.key === '-') {
      e.preventDefault();
      ws.setScale(currentScale / 1.2);
    }
    if (e.key === '0') {
      e.preventDefault();
      ws.setScale(1);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    const currentScale = ws.getScale();
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      ws.setScale(currentScale * 1.2);
    }
    if (e.key === '-') {
      e.preventDefault();
      ws.setScale(currentScale / 1.2);
    }
    if (e.key === '0') {
      e.preventDefault();
      ws.setScale(1);
    }
  }
});

// This function updates the code div to show the generated code.
const updateCode = () => {
  const code = javascriptGenerator.workspaceToCode(ws);
  codeDiv.innerText = code;
};

// This function executes the generated code and shows output.
const runCode = () => {
  const code = javascriptGenerator.workspaceToCode(ws);
  outputDiv.innerHTML = '';
  try {
    eval(code);
  } catch (error) {
    console.error(error);
    outputDiv.innerText = error.message;
  }
};

document.getElementById('runButton').addEventListener('click', runCode);

// Load the initial state from storage and update the code display.
load(ws);
updateCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, update the code preview.
ws.addChangeListener((e) => {
  // Don't update when the workspace finishes loading; we're
  // already doing it once when the application starts.
  // Don't update during drags; we might have invalid state.
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  updateCode();
});

