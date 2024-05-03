import { IsString } from 'class-validator';


export class SubscribeDto {
    chat_id: string;
    text: string;
}