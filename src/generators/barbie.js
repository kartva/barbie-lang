import * as Blockly from 'blockly';

export const barbieGenerator = new Blockly.CodeGenerator('Barbie');

// Order of precedence (based on Python)
barbieGenerator.Order = {
  ATOMIC: 0,             // 0 "" ...
  COLLECTION: 1,         // tuples, lists, dictionaries
  STRING_CONVERSION: 1,  // `expression...`
  MEMBER: 2.1,           // . [ ]
  FUNCTION_CALL: 2.2,    // ()
  EXPONENTIATION: 3,     // **
  UNARY_SIGN: 4,         // + -
  BITWISE_NOT: 4,        // ~
  MULTIPLICATION: 5,     // * / // %
  ADDITION: 6,           // + -
  BITWISE_SHIFT: 7,      // << >>
  BITWISE_AND: 8,        // &
  BITWISE_XOR: 9,        // ^
  BITWISE_OR: 10,        // |
  RELATIONAL: 11,        // in, not in, is, is not, <, <=, >, >=, <>, !=, ==
  LOGICAL_NOT: 12,       // not
  LOGICAL_AND: 13,       // and
  LOGICAL_OR: 14,        // or
  LAMBDA: 15,            // lambda
  NONE: 99,              // (...)
};

barbieGenerator.init = function(workspace) {
  // Call Blockly.Generator's init.
  Object.getPrototypeOf(this).init.call(this);

  if (!this.nameDB_) {
    this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
  } else {
    this.nameDB_.reset();
  }

  this.nameDB_.setVariableMap(workspace.getVariableMap());
  this.nameDB_.populateVariables(workspace);
  this.nameDB_.populateProcedures(workspace);

  this.isInitialized = true;
};

barbieGenerator.finish = function(code) {
  // Convert the definitions dictionary into a list.
  const definitions = Object.values(this.definitions_);
  // Call Blockly.Generator's finish.
  Object.getPrototypeOf(this).finish.call(this);
  return definitions.join('\n\n') + '\n\n\n' + code;
};

barbieGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock =
      block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock) {
    nextCode = this.blockToCode(nextBlock);
  }
  return code + nextCode;
};

// --- Block Generators ---

barbieGenerator.forBlock['text'] = function(block) {
  const textValue = block.getFieldValue('TEXT');
  const code = `"${textValue}"`;
  return [code, barbieGenerator.Order.ATOMIC];
};

barbieGenerator.forBlock['math_number'] = function(block) {
  const code = String(block.getFieldValue('NUM'));
  return [code, barbieGenerator.Order.ATOMIC];
};

barbieGenerator.forBlock['logic_boolean'] = function(block) {
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'glitter' : 'dust';
  return [code, barbieGenerator.Order.ATOMIC];
};

barbieGenerator.forBlock['logic_null'] = function(block) {
  return ['None', barbieGenerator.Order.ATOMIC];
};

barbieGenerator.forBlock['variables_get'] = function(block) {
  const code = barbieGenerator.nameDB_.getName(block.getFieldValue('VAR'),
      Blockly.VARIABLE_CATEGORY_NAME);
  return [code, barbieGenerator.Order.ATOMIC];
};

barbieGenerator.forBlock['variables_set'] = function(block) {
  const argument0 = barbieGenerator.valueToCode(block, 'VALUE',
      barbieGenerator.Order.NONE) || '0';
  const varName = barbieGenerator.nameDB_.getName(block.getFieldValue('VAR'),
      Blockly.VARIABLE_CATEGORY_NAME);
  return varName + ' = ' + argument0 + '\n';
};

barbieGenerator.forBlock['text_print'] = function(block) {
  const msg = barbieGenerator.valueToCode(block, 'TEXT',
      barbieGenerator.Order.NONE) || '""';
  return 'Ken.say(' + msg + ')\n';
};

barbieGenerator.forBlock['add_text'] = barbieGenerator.forBlock['text_print'];

barbieGenerator.forBlock['controls_if'] = function(block) {
  // If/elseif/else condition.
  let n = 0;
  let code = '', branchCode, conditionCode;
  
  // If (feel)
  conditionCode = barbieGenerator.valueToCode(block, 'IF' + n,
      barbieGenerator.Order.NONE) || 'dust';
  branchCode = barbieGenerator.statementToCode(block, 'DO' + n) || barbieGenerator.PASS;
  code += 'feel ' + conditionCode + ':\n' + branchCode;

  // Else If (elif)
  for (n = 1; n <= block.elseifCount_; n++) {
    conditionCode = barbieGenerator.valueToCode(block, 'IF' + n,
        barbieGenerator.Order.NONE) || 'dust';
    branchCode = barbieGenerator.statementToCode(block, 'DO' + n) || barbieGenerator.PASS;
    code += 'elif ' + conditionCode + ':\n' + branchCode;
  }

  // Else (else)
  if (block.elseCount_) {
    branchCode = barbieGenerator.statementToCode(block, 'ELSE') || barbieGenerator.PASS;
    code += 'else:\n' + branchCode;
  }
  return code;
};

barbieGenerator.forBlock['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 = barbieGenerator.valueToCode(block, 'BOOL',
      until ? barbieGenerator.Order.LOGICAL_NOT :
      barbieGenerator.Order.NONE) || 'dust';
  let branch = barbieGenerator.statementToCode(block, 'DO');
  branch = barbieGenerator.addLoopTrap(branch, block) || barbieGenerator.PASS;
  
  if (until) {
    argument0 = 'not ' + argument0;
  }
  return 'keepgoing ' + argument0 + ':\n' + branch;
};

barbieGenerator.forBlock['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  if (block.getFieldValue('FLOW') === 'BREAK') {
    return 'kenough\n';
  } else {
    return 'continue\n';
  }
};

barbieGenerator.forBlock['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  const operator = (block.getFieldValue('OP') === 'AND') ? 'and' : 'or';
  const order = (operator === 'and') ? barbieGenerator.Order.LOGICAL_AND :
      barbieGenerator.Order.LOGICAL_OR;
  const argument0 = barbieGenerator.valueToCode(block, 'A', order) || 'dust';
  const argument1 = barbieGenerator.valueToCode(block, 'B', order) || 'dust';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

barbieGenerator.forBlock['logic_negate'] = function(block) {
  // Negation.
  const argument0 = barbieGenerator.valueToCode(block, 'BOOL',
      barbieGenerator.Order.LOGICAL_NOT) || 'dust';
  const code = 'not ' + argument0;
  return [code, barbieGenerator.Order.LOGICAL_NOT];
};

barbieGenerator.forBlock['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  let repeats;
  if (block.getField('TIMES')) {
    repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    repeats = barbieGenerator.valueToCode(block, 'TIMES',
        barbieGenerator.Order.NONE) || '0';
  }
  let branch = barbieGenerator.statementToCode(block, 'DO');
  branch = barbieGenerator.addLoopTrap(branch, block) || barbieGenerator.PASS;
  return 'somanytimes ' + repeats + ':\n' + branch;
};

barbieGenerator.forBlock['controls_repeat'] = barbieGenerator.forBlock['controls_repeat_ext'];

barbieGenerator.forBlock['lists_create_with'] = function(block) {
  // Create a list with any number of elements of any type.
  const elements = new Array(block.itemCount_);
  for (let i = 0; i < block.itemCount_; i++) {
    elements[i] = barbieGenerator.valueToCode(block, 'ADD' + i,
        barbieGenerator.Order.NONE) || 'None';
  }
  const code = '[' + elements.join(', ') + ']';
  return [code, barbieGenerator.Order.COLLECTION];
};

barbieGenerator.forBlock['lists_getIndex'] = function(block) {
  // Get element at index.
  const list = barbieGenerator.valueToCode(block, 'VALUE',
      barbieGenerator.Order.MEMBER) || '[]';
  const at = barbieGenerator.valueToCode(block, 'AT',
      barbieGenerator.Order.NONE) || '0';
  const code = list + '[' + at + ']';
  return [code, barbieGenerator.Order.MEMBER];
};

barbieGenerator.forBlock['lists_length'] = function(block) {
  // String or list length.
  const argument0 = barbieGenerator.valueToCode(block, 'VALUE',
      barbieGenerator.Order.NONE) || '[]';
  return ['len(' + argument0 + ')', barbieGenerator.Order.FUNCTION_CALL];
};

barbieGenerator.forBlock['lists_getSublist'] = function(block) {
  // Get sublist.
  const list = barbieGenerator.valueToCode(block, 'LIST',
      barbieGenerator.Order.MEMBER) || '[]';
  const at1 = barbieGenerator.valueToCode(block, 'AT1',
      barbieGenerator.Order.NONE) || '0';
  const at2 = barbieGenerator.valueToCode(block, 'AT2',
      barbieGenerator.Order.NONE) || 'None';
  const code = list + '[' + at1 + ':' + at2 + ']';
  return [code, barbieGenerator.Order.MEMBER];
};

// Functions
barbieGenerator.forBlock['procedures_defnoreturn'] = function(block) {
  // Define a procedure with no return value.
  const funcName = barbieGenerator.nameDB_.getName(block.getFieldValue('NAME'),
      Blockly.PROCEDURE_CATEGORY_NAME);
  let branch = barbieGenerator.statementToCode(block, 'STACK');
  if (barbieGenerator.STATEMENT_PREFIX) {
    branch = barbieGenerator.prefixLines(
        barbieGenerator.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + block.id + '\''), barbieGenerator.INDENT) + branch;
  }
  if (barbieGenerator.INFINITE_LOOP_TRAP) {
    branch = barbieGenerator.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }
  const returnValue = barbieGenerator.valueToCode(block, 'RETURN',
      barbieGenerator.Order.NONE) || '';
  let returnStr = '';
  if (returnValue) {
    returnStr = barbieGenerator.INDENT + 'gift ' + returnValue + '\n';
  }
  const args = [];
  for (let i = 0; i < block.arguments_.length; i++) {
    args[i] = barbieGenerator.nameDB_.getName(block.arguments_[i],
        Blockly.VARIABLE_CATEGORY_NAME);
  }
  let code = 'dream ' + funcName + '(' + args.join(', ') + '):\n' +
      (branch || barbieGenerator.PASS) + returnStr;
  code = barbieGenerator.scrub_(block, code);
  barbieGenerator.definitions_['%' + funcName] = code;
  return null;
};

barbieGenerator.forBlock['procedures_defreturn'] = barbieGenerator.forBlock['procedures_defnoreturn'];

barbieGenerator.forBlock['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  const funcName = barbieGenerator.nameDB_.getName(block.getFieldValue('NAME'),
      Blockly.PROCEDURE_CATEGORY_NAME);
  const args = [];
  for (let i = 0; i < block.arguments_.length; i++) {
    args[i] = barbieGenerator.valueToCode(block, 'ARG' + i,
        barbieGenerator.Order.NONE) || 'None';
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, barbieGenerator.Order.FUNCTION_CALL];
};

barbieGenerator.forBlock['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  const funcName = barbieGenerator.nameDB_.getName(block.getFieldValue('NAME'),
      Blockly.PROCEDURE_CATEGORY_NAME);
  const args = [];
  for (let i = 0; i < block.arguments_.length; i++) {
    args[i] = barbieGenerator.valueToCode(block, 'ARG' + i,
        barbieGenerator.Order.NONE) || 'None';
  }
  return funcName + '(' + args.join(', ') + ')\n';
};

barbieGenerator.forBlock['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  const condition = barbieGenerator.valueToCode(block, 'CONDITION',
      barbieGenerator.Order.NONE) || 'dust';
  let code = 'feel ' + condition + ':\n';
  const returnValue = barbieGenerator.valueToCode(block, 'VALUE',
      barbieGenerator.Order.NONE) || 'None';
  code += barbieGenerator.INDENT + 'gift ' + returnValue + '\n';
  return code;
};

barbieGenerator.forBlock['math_arithmetic'] = function(block) {
  // Basic arithmetic operators.
  const OPERATORS = {
    'ADD': [' + ', barbieGenerator.Order.ADDITION],
    'MINUS': [' - ', barbieGenerator.Order.ADDITION],
    'MULTIPLY': [' * ', barbieGenerator.Order.MULTIPLICATION],
    'DIVIDE': [' / ', barbieGenerator.Order.MULTIPLICATION],
    'POWER': [' ** ', barbieGenerator.Order.EXPONENTIATION]
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = barbieGenerator.valueToCode(block, 'A', order) || '0';
  const argument1 = barbieGenerator.valueToCode(block, 'B', order) || '0';
  const code = argument0 + operator + argument1;
  return [code, order];
};

barbieGenerator.forBlock['logic_compare'] = function(block) {
  // Comparison operator.
  const OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  const operator = OPERATORS[block.getFieldValue('OP')];
  const order = barbieGenerator.Order.RELATIONAL;
  const argument0 = barbieGenerator.valueToCode(block, 'A', order) || '0';
  const argument1 = barbieGenerator.valueToCode(block, 'B', order) || '0';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

barbieGenerator.PASS = '  pass\n';
barbieGenerator.INDENT = '  ';