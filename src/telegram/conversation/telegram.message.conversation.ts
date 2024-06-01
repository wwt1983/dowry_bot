import { MyContext, MyConversation } from '../telegram.interface';

export async function message(conversation: MyConversation, ctx: MyContext) {
  try {
    let chatId = null;
    if (ctx.message?.text && ctx.message?.text.includes('=')) {
      chatId = ctx.message.text.replace(/\D/g, '');
    }
    if (!chatId) {
      await ctx.reply('Введите номер пользователя (поле chat_id)');
      chatId = await conversation.form.number();
    }

    await ctx.reply('Введите текст для ' + chatId);
    const {
      msg: { text },
    } = await conversation.waitFor('message:text');

    await ctx.api.sendMessage(chatId, 'Ответ оператора🧑‍💻 \n→ ' + text);
    await ctx.reply(`Ваше сообщение отправлено!`);
    return;
  } catch (e) {
    console.log(e);
    await ctx.reply(`Ваше сообщение не отправлено!`, e);
    return;
  }
}
