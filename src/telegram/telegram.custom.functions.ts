import { CommandContext } from 'grammy';
import { MyContext } from './telegram.interface';
import { format } from 'date-fns';

export function sendMsgToSecretChat(ctx: CommandContext<MyContext>) {
  const { first_name, last_name, username, id } = ctx.from;

  return `Старт: ${format(new Date(), 'dd.MM.yyyy H:mm')} ${first_name} 
  ${last_name || ''} username=${username || ''} 
  https://web.telegram.org/a/#${id}`;
}
