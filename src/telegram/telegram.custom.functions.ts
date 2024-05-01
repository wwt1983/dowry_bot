import { CommandContext } from 'grammy';
import { ITelegramWebApp, MyContext } from './telegram.interface';
import { format } from 'date-fns';
import {
  FIRST_STEP,
  HEADER,
  FIRST_STEP_A,
  FIRST_STEP_B,
} from './telegram.constants';
export function sendMsgToSecretChat(ctx: CommandContext<MyContext>) {
  const { first_name, last_name, username, id } = ctx.from;

  return `Старт: ${format(new Date(), 'dd.MM.yyyy H:mm')} ${first_name} 
  ${last_name || ''} username=${username || ''} 
  https://web.telegram.org/a/#${id}`;
}

export function getTextForFirstStep(data: ITelegramWebApp): string {
  return (
    `Раздача: ${data.title} с кешбеком ${data.cash} рублей\n` +
    HEADER +
    FIRST_STEP +
    data.keys +
    FIRST_STEP_A +
    FIRST_STEP_B
  );
}
