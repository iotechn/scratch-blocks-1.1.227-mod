'use strict';

goog.provide('Blockly.Blocks.hardware');

goog.require('Blockly.Blocks');

const GPIO_PIN_OPTIONS = [
  ['0', '0'],
  ['1', '1'],
  ['2', '2'],
  ['3', '3'],
  ['4', '4'],
  ['5', '5']
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
