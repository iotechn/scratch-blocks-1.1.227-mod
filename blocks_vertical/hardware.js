'use strict';

goog.provide('Blockly.Blocks.hardware');

goog.require('Blockly.Blocks');

const GPIO_PIN_OPTIONS = [
  ['0', '0'],
  ['1', '1'],
  ['2', '2'],
  ['3', '3'],
  ['4', '4'],
  ['5', '5'],
  ['6', '6'],
  ['7', '7'],
  ['8', '8'],
  ['9', '9'],
  ['10', '10'],
  ['11', '11'],
  ['12', '12'],
  ['13', '13'],
  ['14', '14'],
  ['15', '15'],
  ['16', '16'],
  ['17', '17'],
];

const GPIO_BUS_OPTIONS = [
  ['B1', 'B1'],
  ['B2', 'B2'],
];

// Display-only format for GPIO bus write values. This field is intentionally
// kept out of execution data by the editor; it only controls the block UI.
const GPIO_BUS_DISPLAY_OPTIONS = () => [
  [Blockly.Msg.HARDWARE_GPIO_BUS_DISPLAY_DEC || 'Decimal', 'DEC'],
  [Blockly.Msg.HARDWARE_GPIO_BUS_DISPLAY_HEX || 'Hexadecimal', 'HEX'],
  [Blockly.Msg.HARDWARE_GPIO_BUS_DISPLAY_BIN || 'Binary', 'BIN'],
];

// GPIO bus writes carry one unsigned byte. Blockly's number field validator is
// also used for the default shadow, so values above 255 are immediately shown
// as 255 (and negative/non-numeric values become 0).
const clampGpioBusByte = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(255, Math.trunc(number)));
};

const parseGpioBusByte = (value, mode) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;

  if (mode === 'HEX') {
    const digits = text.replace(/^0x/i, '');
    if (!/^[0-9a-fA-F]+$/.test(digits)) return null;
    return clampGpioBusByte(parseInt(digits, 16));
  }
  if (mode === 'BIN') {
    const digits = text.replace(/^0b/i, '');
    if (!/^[01]+$/.test(digits)) return null;
    return clampGpioBusByte(parseInt(digits, 2));
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
    return null;
  }
  return clampGpioBusByte(Number(text));
};

const getGpioBusDisplayMode = (block) =>
  block && block.getFieldValue('DISPLAY') || 'DEC';

const formatGpioBusByte = (value, mode) => {
  const byte = clampGpioBusByte(value);
  if (mode === 'HEX') return '0x' + byte.toString(16).toUpperCase();
  if (mode === 'BIN') return '0b' + ('00000000' + byte.toString(2)).slice(-8);
  return String(byte);
};

const GPIO_BUS_INPUT_RESTRICTOR = /[0-9a-fA-FxXbB.+\-eE]/;

const installGpioBusByteValidator = (block) => {
  const input = block.getInput('VALUE');
  const connection = input && input.connection;
  const target = connection && connection.targetBlock();
  const field = target && typeof target.getField === 'function'
    ? target.getField('NUM')
    : null;
  if (!field || target.type !== 'math_number') return;

  // The numeric shadow owns this field, but the display mode lives on its
  // parent gpio_bus_write block. Keep that owner reference for every edit and
  // render callback so changing DISPLAY is reflected immediately.
  field.gpioBusBlock_ = block;

  if (!field.gpioBusByteValidatorInstalled) {
    const originalSetText = field.setText;
    field.gpioBusValue_ = parseGpioBusByte(
      field.getText(), getGpioBusDisplayMode(block));
    if (field.gpioBusValue_ === null) field.gpioBusValue_ = 0;
    field.setRestrictor(GPIO_BUS_INPUT_RESTRICTOR);

    field.getValue = function() {
      return String(clampGpioBusByte(this.gpioBusValue_));
    };
    field.setText = function(newText) {
      if (newText !== null && newText !== undefined) {
        const text = String(newText);
        if (this.gpioBusCanonicalText_ === text) {
          this.gpioBusCanonicalText_ = null;
        } else {
          const parsed = parseGpioBusByte(
            text, getGpioBusDisplayMode(this.gpioBusBlock_));
          if (parsed !== null) this.gpioBusValue_ = parsed;
        }
      }
      return originalSetText.call(this, newText);
    };
    field.setValidator(function(value) {
      const parsed = parseGpioBusByte(
        value, getGpioBusDisplayMode(this.gpioBusBlock_));
      if (parsed === null) return null;
      this.gpioBusValue_ = parsed;
      this.gpioBusCanonicalText_ = String(parsed);
      return this.gpioBusCanonicalText_;
    });
    field.gpioBusByteValidatorInstalled = true;
  }

  if (!field.gpioBusDisplayFormatterInstalled) {
    field.getDisplayText_ = function() {
      return formatGpioBusByte(
        this.gpioBusValue_, getGpioBusDisplayMode(this.gpioBusBlock_));
    };
    const originalShowEditor = field.showEditor_;
    field.showEditor_ = function() {
      originalShowEditor.apply(this, arguments);
      const inputElement = Blockly.FieldTextInput && Blockly.FieldTextInput.htmlInput_;
      if (!inputElement) return;
      const displayText = formatGpioBusByte(
        this.gpioBusValue_, getGpioBusDisplayMode(this.gpioBusBlock_));
      inputElement.value = displayText;
      inputElement.defaultValue = displayText;
      inputElement.oldValue_ = null;
      this.validate_();
      this.resizeEditor_();
      inputElement.select();
    };
    field.gpioBusDisplayFormatterInstalled = true;
  }
  field.forceRerender();
};

const refreshGpioBusDisplay = (block) => {
  if (!block) return;
  installGpioBusByteValidator(block);
  const input = block.getInput('VALUE');
  const connection = input && input.connection;
  const target = connection && connection.targetBlock();
  const field = target && target.type === 'math_number' && target.getField
    ? target.getField('NUM')
    : null;
  if (field) field.forceRerender();
};

/**
 * 设置 GPIO 引脚模式。
 * 积木类型：gpio_set_mode
 * 参数：PIN（引脚号）、MODE（输入/输出）
 */
Blockly.Blocks['gpio_set_mode'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_SET_MODE_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
        .appendField(Blockly.Msg.HARDWARE_GPIO_SET_MODE_MIDDLE)
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.HARDWARE_GPIO_MODE_INPUT, 'INPUT'],
          [Blockly.Msg.HARDWARE_GPIO_MODE_OUTPUT, 'OUTPUT'],
          [Blockly.Msg.HARDWARE_GPIO_MODE_INPUT_PULLUP, 'INPUT_PULLUP'],
          [Blockly.Msg.HARDWARE_GPIO_MODE_INPUT_PULLDOWN, 'INPUT_PULLDOWN']
        ]), 'MODE');

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * Set a GPIO bus mode.
 * Block type: gpio_bus_set_mode
 * Parameters: BUS (B1/B2), MODE.
 */
Blockly.Blocks['gpio_bus_set_mode'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SET_MODE_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_BUS_OPTIONS), 'BUS')
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SET_MODE_MIDDLE)
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.HARDWARE_GPIO_MODE_INPUT, 'INPUT'],
          [Blockly.Msg.HARDWARE_GPIO_MODE_OUTPUT, 'OUTPUT'],
          [Blockly.Msg.HARDWARE_GPIO_MODE_INPUT_PULLUP, 'INPUT_PULLUP'],
          [Blockly.Msg.HARDWARE_GPIO_MODE_INPUT_PULLDOWN, 'INPUT_PULLDOWN'],
          [Blockly.Msg.HARDWARE_GPIO_MODE_OUTPUT_OPEN_DRAIN, 'OUTPUT_OPEN_DRAIN']
        ]), 'MODE');

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * Write a numeric value to a GPIO bus.
 * Block type: gpio_bus_write
 * Parameters: BUS (B1/B2), VALUE (numeric expression).
 */
Blockly.Blocks['gpio_bus_write'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_WRITE_PREFIX);
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_WRITE_MIDDLE)
        .appendField(new Blockly.FieldDropdown(GPIO_BUS_OPTIONS), 'BUS')
        .setLineBreak(true);
    const displayField = new Blockly.FieldDropdown(GPIO_BUS_DISPLAY_OPTIONS);
    const originalDisplaySetValue = displayField.setValue;
    displayField.setValue = function(value) {
      originalDisplaySetValue.call(this, value);
      refreshGpioBusDisplay(this.sourceBlock_);
    };
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_WRITE_DISPLAY || 'Display')
        .appendField(displayField, 'DISPLAY')
        .setLineBreak(true);

    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
    this.setOnChange(() => {
      installGpioBusByteValidator(this);
    });
    installGpioBusByteValidator(this);
  }
};

/**
 * Read a GPIO bus value.
 * Block type: gpio_bus_read
 * Parameters: BUS (B1/B2).
 */
Blockly.Blocks['gpio_bus_read'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_READ_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_BUS_OPTIONS), 'BUS');

    this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
    this.setOutput(true, 'Number');
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * Shift or rotate a GPIO bus.
 * Block type: gpio_bus_shift
 * Parameters: BUS (B1/B2), DIRECTION, ROTATE, N (numeric expression).
 */
Blockly.Blocks['gpio_bus_shift'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_BUS_OPTIONS), 'BUS');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_LEFT, 'LEFT'],
          [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_RIGHT, 'RIGHT']
        ]), 'DIRECTION')
        .setLineBreak(true);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_NON_ROTATE, 'NON_ROTATE'],
          [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_ROTATE, 'ROTATE']
        ]), 'ROTATE')
        .setLineBreak(true);
    this.appendValueInput('N')
        .setCheck('Number')
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_BY)
        .setLineBreak(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_BITS_SUFFIX)
        .setLineBreak(true);

    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * Apply bitwise NOT to a GPIO bus.
 * Block type: gpio_bus_not
 * Parameters: BUS (B1/B2).
 */
Blockly.Blocks['gpio_bus_not'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_NOT_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_BUS_OPTIONS), 'BUS');

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * 设置 GPIO 引脚电平。
 * 积木类型：gpio_set_pin
 * 参数：PIN（引脚号）、VALUE（高/低）
 */
Blockly.Blocks['gpio_set_pin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_SET_PIN_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
        .appendField(Blockly.Msg.HARDWARE_GPIO_SET_PIN_MIDDLE)
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.HARDWARE_GPIO_VALUE_HIGH, 'HIGH'],
          [Blockly.Msg.HARDWARE_GPIO_VALUE_LOW, 'LOW']
        ]), 'VALUE');

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * 读取 GPIO：是否为高电平 / 是否为低电平。
 * 积木类型：gpio_read_pin_high / gpio_read_pin_low
 * 返回值：Boolean
 * @param {string} blockType Block type identifier.
 * @param {string} trailingLabelKey Blockly message key for the trailing label.
 */
const defineGpioReadBooleanBlock = (blockType, trailingLabelKey) => {
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput()
          .appendField(Blockly.Msg.HARDWARE_GPIO_READ_PIN_PREFIX)
          .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
          .appendField(Blockly.Msg[trailingLabelKey]);

      this.setInputsInline(true);
      this.setOutputShape(Blockly.OUTPUT_SHAPE_HEXAGONAL);
      this.setOutput(true, 'Boolean');

      this.setColour('#4C97FF');
      this.setHelpUrl('');
    }
  };
};
defineGpioReadBooleanBlock('gpio_read_pin_high', 'HARDWARE_GPIO_READ_PIN_HIGH_SUFFIX');
defineGpioReadBooleanBlock('gpio_read_pin_low', 'HARDWARE_GPIO_READ_PIN_LOW_SUFFIX');

/**
 * 读取设备从系统启动以来经过的毫秒数。
 * 积木类型（固件 opcode：0x006A / system_uptime_milliseconds）：system_uptime_milliseconds
 * 返回值：i32
 */
Blockly.Blocks['system_uptime_milliseconds'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_SYSTEM_UPTIME_MILLISECONDS);

    this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
    this.setOutput(true, 'Number');
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * 将 GPIO 配置为舵机控制模式。
 * 积木类型：gpio_set_servo_mode（固件 opcode：gpio_set_servo_mode）
 * 参数：PIN（引脚号）
 */
Blockly.Blocks['gpio_set_servo_mode'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_SET_SERVO_MODE_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
        .appendField(Blockly.Msg.HARDWARE_GPIO_SET_SERVO_MODE_SUFFIX);

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * 翻转 GPIO 引脚电平。
 * 积木类型：gpio_toggle_pin
 * 参数：PIN（引脚号）
 */
Blockly.Blocks['gpio_toggle_pin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_TOGGLE_PIN_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
        .appendField(Blockly.Msg.HARDWARE_GPIO_TOGGLE_PIN_SUFFIX);

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};

/**
 * 舵机角度控制。
 * 积木类型：control_servo
 * 参数：PIN（下拉选引脚）、ANGLE（角度，可嵌套表达式）
 */
Blockly.Blocks['control_servo'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_CONTROL_SERVO_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN');
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_CONTROL_SERVO_ANGLE_LABEL);
    this.appendValueInput('ANGLE');
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_CONTROL_SERVO_DEGREE_SUFFIX);

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
  }
};
