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
  ['18', '18'],
  ['19', '19'],
  ['20', '20'],
  ['21', '21'],
  ['22', '22'],
  ['23', '23'],
  ['24', '24'],
  ['25', '25'],
  ['26', '26'],
  ['27', '27'],
  ['28', '28'],
  ['29', '29'],
  ['30', '30'],
  ['31', '31'],
  ['32', '32'],
  ['33', '33'],
  ['34', '34'],
  ['35', '35'],
  ['36', '36'],
  ['37', '37'],
  ['38', '38'],
  ['39', '39'],
  ['40', '40'],
];

const GPIO_BUS_OPTIONS = [
  ['B1', 'B1'],
  ['B2', 'B2'],
];

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
    this.appendDummyInput()
      .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_WRITE_PREFIX);
    this.appendValueInput('VALUE')
      .setCheck('Number');
    this.appendDummyInput()
      .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_WRITE_MIDDLE)
      .appendField(new Blockly.FieldDropdown(GPIO_BUS_OPTIONS), 'BUS');

    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4C97FF');
    this.setHelpUrl('');
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
      .appendField(new Blockly.FieldDropdown(GPIO_BUS_OPTIONS), 'BUS')
      .appendField(new Blockly.FieldDropdown([
        [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_LEFT, 'LEFT'],
        [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_RIGHT, 'RIGHT']
      ]), 'DIRECTION')
      .appendField(new Blockly.FieldDropdown([
        [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_NON_ROTATE, 'NON_ROTATE'],
        [Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_ROTATE, 'ROTATE']
      ]), 'ROTATE')
      .appendField(Blockly.Msg.HARDWARE_GPIO_BUS_SHIFT_BY);
    this.appendValueInput('N')
      .setCheck('Number');
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

/**
 * 读取 GPIO：是否为高电平 / 是否为低电平。
 * 积木类型：gpio_read_pin_high / gpio_read_pin_low
 * 返回值：Boolean
 */
const defineGpioReadBooleanBlock = (blockType, trailingLabel) => {
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput()
        .appendField(Blockly.Msg.HARDWARE_GPIO_READ_PIN_PREFIX)
        .appendField(new Blockly.FieldDropdown(GPIO_PIN_OPTIONS), 'PIN')
        .appendField(trailingLabel);

      this.setInputsInline(true);
      this.setOutputShape(Blockly.OUTPUT_SHAPE_HEXAGONAL);
      this.setOutput(true, 'Boolean');

      this.setColour('#4C97FF');
      this.setHelpUrl('');
    }
  };
};
defineGpioReadBooleanBlock('gpio_read_pin_high', Blockly.Msg.HARDWARE_GPIO_READ_PIN_HIGH_SUFFIX);
defineGpioReadBooleanBlock('gpio_read_pin_low', Blockly.Msg.HARDWARE_GPIO_READ_PIN_LOW_SUFFIX);

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
