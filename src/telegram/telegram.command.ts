import { InlineKeyboard, Keyboard } from 'grammy';
import { STEP_COMMANDS } from './telegram.constants';

export const stepKeyboard = new InlineKeyboard()
  .text(STEP_COMMANDS.del, 'del')
  .text(STEP_COMMANDS.next, 'next');

export const commentKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.next,
  'next',
);
export const helpKeyboard = new InlineKeyboard().text(
  STEP_COMMANDS.operator,
  'operator',
);

export const shareKeyboard = new Keyboard()
  .requestLocation('Геолокация')
  .placeholder('Я хочу поделиться...')
  .resized();
export const userMenu = new InlineKeyboard().text(
  'История раздач',
  'showOrders',
);
