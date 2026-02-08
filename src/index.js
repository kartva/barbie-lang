/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {blocks} from './blocks/text';
import {barbieGenerator} from './generators/barbie';
import {save, load} from './serialization';
import {toolbox} from './toolbox';
import './index.css';
import barbieHead from '../public/barbie-head.png';
import splashImage from '../public/splash-screen.png';
import './barbie_interpreter';

document.getElementById('barbie-head').src = barbieHead;
document.getElementById('splash-logo').src = splashImage;

// Splash screen: fade out after 4 seconds, then remove
const splash = document.getElementById('splash-screen');
setTimeout(() => {
  splash.classList.add('fade-out');
  splash.addEventListener('transitionend', () => splash.remove());
}, 4000);

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);

Blockly.common.defineBlocks({
  'controls_strut': {
    'init': function() {
      this.appendValueInput('TIMES')
          .setCheck('Number')
          .appendField('strut')
          .appendField(new Blockly.FieldVariable('i'), 'VAR')
          .appendField('in runway(');
      this.appendDummyInput()
          .appendField(')');
      this.appendStatementInput('DO')
          .appendField('do');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(Blockly.Msg['LOOPS_HUE'] || '#FF1493');
      this.setTooltip('Loop with a variable from 0 to N-1');
    }
  }
});

barbieGenerator.forBlock['controls_strut'] = function(block) {
  const repeats = barbieGenerator.valueToCode(block, 'TIMES',
      barbieGenerator.Order.NONE) || '0';
  const variable = barbieGenerator.nameDB_.getName(block.getFieldValue('VAR'),
      Blockly.VARIABLE_CATEGORY_NAME);
  let branch = barbieGenerator.statementToCode(block, 'DO');
  branch = barbieGenerator.addLoopTrap(branch, block) || barbieGenerator.PASS;
  return 'strut ' + variable + ' in runway(' + repeats + '):\n' + branch;
};

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
      //'stroke-width ': '2',
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
Blockly.Msg['CONTROLS_IF_MSG_ELSEIF'] = 'otherwise feel';
Blockly.Msg['CONTROLS_IF_MSG_THEN'] = 'then';
Blockly.Msg['CONTROLS_IF_IF_TITLE_IF'] = 'feel';
Blockly.Msg['CONTROLS_IF_ELSEIF_TITLE_ELSEIF'] = 'otherwise feel';
Blockly.Msg['CONTROLS_IF_ELSE_TITLE_ELSE'] = 'otherwise';

Blockly.Msg['CONTROLS_WHILEUNTIL_OPERATOR_WHILE'] = 'keepgoing';
Blockly.Msg['CONTROLS_REPEAT_TITLE'] = 'somanytimes %1';
Blockly.Msg['CONTROLS_REPEAT_INPUT_DO'] = 'do';

Blockly.Msg['PROCEDURES_DEFRETURN_TITLE'] = 'dream';
Blockly.Msg['PROCEDURES_DEFRETURN_PROCEDURE'] = 'procedure';
Blockly.Msg['PROCEDURES_DEFRETURN_DO'] = 'do';
Blockly.Msg['PROCEDURES_DEFRETURN_RETURN'] = 'gift';
Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE'] = 'dream';
Blockly.Msg['PROCEDURES_DEFNORETURN_PROCEDURE'] = 'procedure';
Blockly.Msg['PROCEDURES_DEFNORETURN_DO'] = 'do';
Blockly.Msg['PROCEDURES_IFRETURN_TITLE'] = 'gift';
Blockly.Msg['PROCEDURES_CALL_BEFORE_PARAMS'] = 'a dream with';

Blockly.Msg['LISTS_CREATE_WITH_INPUT_WITH'] = 'list';

Blockly.Msg['CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'] = 'kenough';
Blockly.Msg['CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE'] = 'kentinue';

// Define Barbie theme with pink colors
Blockly.Themes.Barbie = Blockly.Theme.defineTheme('barbie', {
  base: Blockly.Themes.Classic,
  fontStyle: {
    family: '"Bartex", sans-serif',
    weight: 'normal',
    size: 15,
  },
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
    toolboxForegroundColour: '#880E4F',
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
const outputDiv = document.getElementById('barbie-bubble');
const blocklyDiv = document.getElementById('blocklyDiv');
const ws = Blockly.inject(blocklyDiv, {toolbox, theme: Blockly.Themes.Barbie});

// This function updates the code div to show the generated code.
const updateCode = () => {
  const code = barbieGenerator.workspaceToCode(ws);
  codeDiv.innerText = code;
};

// This function executes the generated code and shows output.
const runCode = () => {
  const code = barbieGenerator.workspaceToCode(ws);
  outputDiv.innerHTML = '';
  try {
    const result = window.BarbieInterpreter.run(code);
    if (result.ok) {
      const output = result.output;
      if (Array.isArray(output) && output.length > 0) {
        output.forEach(line => {
          const p = document.createElement('p');
          p.style.margin = '5px 0';
          p.innerText = line;
          outputDiv.appendChild(p);
        });
      } else {
        outputDiv.innerText = '(No output)';
      }
    } else {
      const errorP = document.createElement('p');
      errorP.style.color = 'red';
      errorP.style.fontWeight = 'bold';
      errorP.innerText = result.error;
      outputDiv.appendChild(errorP);
    }
  } catch (error) {
    outputDiv.innerText = 'Execution error: ' + error.message;
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

// Function to create glitter particles
function createGlitterBurst() {
  const blocklyDiv = document.getElementById('blocklyDiv');
  const rect = blocklyDiv.getBoundingClientRect();

  // Position near bottom-right where trashcan typically is
  const centerX = rect.right - 80;
  const centerY = rect.bottom - 80;

  // Create multiple glitter particles
  for (let i = 0; i < 51; i++) {
    const particle = document.createElement('div');
    particle.className = 'glitter-particle';

    // Random angle and distance
    const angle = (Math.PI * 2 * i) / 51;
    const distance = 50 + Math.random() * 30;
    const endX = centerX + Math.cos(angle) * distance;
    const endY = centerY + Math.sin(angle) * distance;

    // Set custom properties for animation
    particle.style.setProperty('--start-x', `${centerX}px`);
    particle.style.setProperty('--start-y', `${centerY}px`);
    particle.style.setProperty('--end-x', `${endX}px`);
    particle.style.setProperty('--end-y', `${endY}px`);

    // Random delay for staggered effect
    particle.style.animationDelay = `${Math.random() * 0.1}s`;

    document.body.appendChild(particle);

    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}

// Add glitter effect when blocks are deleted
ws.addChangeListener((e) => {
  // Only trigger glitter for actual block deletions from the main workspace
  // Ignore flyout/toolbox deletions and other internal Blockly operations
  if (e.type === Blockly.Events.BLOCK_DELETE &&
      !e.isUiEvent &&
      e.workspaceId === ws.id) {
    console.log('Block deleted from workspace! Creating glitter burst...');
    createGlitterBurst();
  }
});
