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

const PWM_MODE_OPTIONS = () => [
  [Blockly.Msg.HARDWARE_PWM_FREQUENCY_DUTY || 'frequency + duty cycle', 'FREQUENCY_DUTY'],
  [Blockly.Msg.HARDWARE_PWM_PERIOD_PULSE || 'period + pulse width', 'PERIOD_PULSE'],
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
  if (mode === 'HEX') {
    const digits = byte.toString(16).toUpperCase();
    return '0x' + digits.padStart(Math.ceil(digits.length / 2) * 2, '0');
  }
  if (mode === 'BIN') {
    const digits = byte.toString(2);
    return '0b' + digits.padStart(Math.ceil(digits.length / 8) * 8, '0');
  }
  return String(byte);
};

const GPIO_BUS_INPUT_RESTRICTOR = /[0-9a-fA-FxXbB.+\-eE]/;

const SERVO_ANGLE_MIN = 0;
const SERVO_ANGLE_MAX = 180;

const clampServoAngle = (value) => {
  const angle = Number(value);
  if (!Number.isFinite(angle)) return null;
  return String(Math.min(SERVO_ANGLE_MAX, Math.max(SERVO_ANGLE_MIN, angle)));
};

const installServoAngleValidator = (block) => {
  const input = block.getInput('ANGLE');
  const connection = input && input.connection;
  const target = connection && connection.targetBlock();
  const field = target && typeof target.getField === 'function'
    ? target.getField('NUM')
    : null;
  if (!field || !target || !/^math_/.test(target.type)) return;

  if (!field.servoAngleValidatorInstalled) {
    const originalValidator = field.getValidator && field.getValidator();
    field.setValidator(function(value) {
      const validated = originalValidator
        ? originalValidator.call(this, value)
        : value;
      if (validated === null) return null;
      return clampServoAngle(validated);
    });
    field.servoAngleValidatorInstalled = true;
  }

  const normalized = clampServoAngle(field.getText());
  if (normalized !== null && normalized !== field.getText()) {
    field.setText(normalized);
  }
};

const CONTINUOUS_SERVO_SPEED_MIN = 0;
const CONTINUOUS_SERVO_SPEED_MAX = 100;

const clampContinuousServoSpeed = (value) => {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return null;
  return String(Math.min(CONTINUOUS_SERVO_SPEED_MAX,
      Math.max(CONTINUOUS_SERVO_SPEED_MIN, Math.trunc(speed))));
};

const installContinuousServoSpeedValidator = (block) => {
  const input = block.getInput('SPEED');
  const connection = input && input.connection;
  const target = connection && connection.targetBlock();
  const field = target && typeof target.getField === 'function'
    ? target.getField('NUM')
    : null;
  if (!field || !target || !['math_number', 'math_whole_number'].includes(target.type)) return;

  if (!field.continuousServoSpeedValidatorInstalled) {
    const originalValidator = field.getValidator && field.getValidator();
    field.setValidator(function(value) {
      const validated = originalValidator
        ? originalValidator.call(this, value)
        : value;
      if (validated === null) return null;
      return clampContinuousServoSpeed(validated);
    });
    field.continuousServoSpeedValidatorInstalled = true;
  }

  const normalized = clampContinuousServoSpeed(field.getText());
  if (normalized !== null && normalized !== field.getText()) field.setText(normalized);
};

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
        .appendField(displayField, 'DISPLAY');

    this.setInputsInline(true);
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
        ]), 'DIRECTION');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_NON_ROTATE, 'NON_ROTATE'],
          [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_ROTATE, 'ROTATE']
        ]), 'ROTATE')
        .setLineBreak(true);
    this.appendValueInput('N')
        .setCheck('Number')
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_BY);
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_BITS_SUFFIX);

    this.setInputsInline(true);
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

/** Configure a GPIO output using PWM. Values are persisted as period/pulse. */
Blockly.Blocks['gpio_set_pwm'] = {
  init: function() {
    this.appendDummyInput('HEADER')
      .appendField(Blockly.Msg.HARDWARE_PWM_PREFIX || 'set GPIO')
      .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
      .appendField(Blockly.Msg.HARDWARE_PWM_LABEL || 'PWM')
      .setLineBreak(true);
    this.appendDummyInput('MODE_ROW')
      .appendField(Blockly.Msg.HARDWARE_PWM_PARAMETER || 'parameters')
      .appendField(new Blockly.FieldDropdown(PWM_MODE_OPTIONS(), function(mode) {
        const block = this.getSourceBlock ? this.getSourceBlock() : this.sourceBlock_;
        if (block && block.updatePwmShape_) block.updatePwmShape_(mode);
      }), 'MODE')
      .setLineBreak(true);
    this.appendValueInput('FREQUENCY').setCheck('Number')
      .appendField(Blockly.Msg.HARDWARE_PWM_FREQUENCY || 'frequency')
      .setLineBreak(true);
    this.appendDummyInput('FREQUENCY_UNIT').appendField('Hz');
    this.appendValueInput('DUTY').setCheck('Number')
      .appendField(Blockly.Msg.HARDWARE_PWM_DUTY || 'duty cycle')
      .setLineBreak(true);
    this.appendDummyInput('DUTY_UNIT').appendField('%');
    this.appendValueInput('PERIOD').setCheck('Number')
      .appendField(Blockly.Msg.HARDWARE_PWM_PERIOD || 'period')
      .setLineBreak(true);
    this.appendDummyInput('PERIOD_UNIT').appendField('\u03bcs');
    this.appendValueInput('PULSE').setCheck('Number')
      .appendField(Blockly.Msg.HARDWARE_PWM_PULSE || 'pulse width')
      .setLineBreak(true);
    this.appendDummyInput('PULSE_UNIT').appendField('\u03bcs');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setOnChange(function() {
      if (this.workspace && !this.workspace.isFlyout) this.validatePwm_();
    });
    this.updatePwmShape_('FREQUENCY_DUTY');
  },
  updatePwmShape_: function(mode) {
    const frequency = mode === 'FREQUENCY_DUTY';
    ['FREQUENCY', 'FREQUENCY_UNIT', 'DUTY', 'DUTY_UNIT'].forEach((name) => {
      const input = this.getInput(name);
      if (input) input.setVisible(frequency);
    });
    ['PERIOD', 'PERIOD_UNIT', 'PULSE', 'PULSE_UNIT'].forEach((name) => {
      const input = this.getInput(name);
      if (input) input.setVisible(!frequency);
    });
    this.syncPwmValues_(mode);
    if (this.rendered) this.render();
  },
  syncPwmValues_: function(mode) {
    const num = (name) => { const input = this.getInput(name); const target = input && input.connection && input.connection.targetBlock(); return Number(target && target.getFieldValue('NUM')); };
    const set = (name, value) => { const input = this.getInput(name); const target = input && input.connection && input.connection.targetBlock(); if (Number.isFinite(value) && target) target.setFieldValue(String(value), 'NUM'); };
    if (mode === 'PERIOD_PULSE') {
      const frequency = num('FREQUENCY'); const duty = num('DUTY');
      if (frequency > 0) { const period = 1000000 / frequency; set('PERIOD', Math.round(period)); if (Number.isFinite(duty)) set('PULSE', Math.round(period * Math.max(0, Math.min(100, duty)) / 100)); }
    } else {
      const period = num('PERIOD'); const pulse = num('PULSE');
      if (period > 0) { set('FREQUENCY', 1000000 / period); if (Number.isFinite(pulse)) set('DUTY', Math.min(100, Math.max(0, pulse * 100 / period))); }
    }
  },
  validatePwm_: function() {
    if (this.getFieldValue('MODE') !== 'PERIOD_PULSE') return;
    const periodInput = this.getInput('PERIOD');
    const periodTarget = periodInput && periodInput.connection && periodInput.connection.targetBlock();
    const period = Number(periodTarget && periodTarget.getFieldValue('NUM'));
    const pulseInput = this.getInput('PULSE');
    const pulseBlock = pulseInput && pulseInput.connection && pulseInput.connection.targetBlock();
    const pulse = Number(pulseBlock && pulseBlock.getFieldValue('NUM'));
    if (Number.isFinite(period) && Number.isFinite(pulse) && pulse > period && pulseBlock) {
      pulseBlock.setFieldValue(String(period), 'NUM');
    }
  },
  mutationToDom: function() {
    const node = document.createElement('mutation');
    node.setAttribute('mode', this.getFieldValue('MODE') || 'FREQUENCY_DUTY');
    return node;
  },
  domToMutation: function(node) {
    this.updatePwmShape_(node.getAttribute('mode') || 'FREQUENCY_DUTY');
    const modeField = this.getField('MODE');
    if (modeField) modeField.setValue(node.getAttribute('mode') || 'FREQUENCY_DUTY');
  }
};

/** Disable PWM on a GPIO and leave it at the selected output level. */
Blockly.Blocks['gpio_disable_pwm'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_DISABLE_PWM_PREFIX || 'disable GPIO')
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
        .appendField(Blockly.Msg.HARDWARE_GPIO_DISABLE_PWM_MIDDLE || 'PWM, level to')
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.HARDWARE_GPIO_VALUE_LOW, 'LOW'],
          [Blockly.Msg.HARDWARE_GPIO_VALUE_HIGH, 'HIGH']
        ]), 'LEVEL');

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
    this.setOnChange(() => {
      installServoAngleValidator(this);
    });
    installServoAngleValidator(this);
  }
};

/**
 * 连续旋转舵机控制。
 * 积木类型：control_servo_continuous
 * 参数：PIN（下拉选引脚）、DIRECTION（方向）、SPEED（速度百分比，可嵌套表达式）
 */
const CONTINUOUS_SERVO_DIRECTION_OPTIONS = () => [
  [Blockly.Msg.HARDWARE_CONTROL_SERVO_CONTINUOUS_DIRECTION_CLOCKWISE || 'clockwise', 'CLOCKWISE'],
  [Blockly.Msg.HARDWARE_CONTROL_SERVO_CONTINUOUS_DIRECTION_COUNTERCLOCKWISE || 'counter-clockwise', 'COUNTERCLOCKWISE'],
  [Blockly.Msg.HARDWARE_CONTROL_SERVO_CONTINUOUS_DIRECTION_STOP || 'stop', 'STOP']
];

Blockly.Blocks['control_servo_continuous'] = {
  init: function() {
    const directionField = new Blockly.FieldDropdown(CONTINUOUS_SERVO_DIRECTION_OPTIONS(), function(direction) {
      const block = this.getSourceBlock ? this.getSourceBlock() : this.sourceBlock_;
      if (block && block.updateContinuousServoShape_) block.updateContinuousServoShape_(direction);
    });
    this.appendDummyInput('HEADER')
        .appendField(Blockly.Msg.HARDWARE_CONTROL_SERVO_CONTINUOUS_PREFIX || 'servo pin')
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
        .appendField(directionField, 'DIRECTION');
    this.appendValueInput('SPEED')
        .setCheck('Number')
        .appendField(Blockly.Msg.HARDWARE_CONTROL_SERVO_CONTINUOUS_SPEED_LABEL || 'at speed')
        .setLineBreak(true);
    this.appendDummyInput('SPEED_UNIT')
        .appendField(Blockly.Msg.HARDWARE_CONTROL_SERVO_CONTINUOUS_SPEED_SUFFIX || '%');

    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
    this.setOnChange(() => {
      installContinuousServoSpeedValidator(this);
    });
    this.updateContinuousServoShape_('CLOCKWISE');
    installContinuousServoSpeedValidator(this);
  },
  updateContinuousServoShape_: function(direction) {
    const showSpeed = direction !== 'STOP';
    const renderList = [];
    ['SPEED', 'SPEED_UNIT'].forEach((name) => {
      const input = this.getInput(name);
      if (input) renderList.push.apply(renderList, input.setVisible(showSpeed));
    });
    if (this.rendered) {
      if (!renderList.length) renderList.push(this);
      for (let i = 0, block; block = renderList[i]; i++) {
        block.render();
      }
    }
  },
  mutationToDom: function() {
    const node = document.createElement('mutation');
    node.setAttribute('direction', this.getFieldValue('DIRECTION') || 'CLOCKWISE');
    return node;
  },
  domToMutation: function(node) {
    const direction = node.getAttribute('direction') || this.getFieldValue('DIRECTION') || 'CLOCKWISE';
    const field = this.getField('DIRECTION');
    if (field) field.setValue(direction);
    this.updateContinuousServoShape_(direction);
  }
};
