import { IsString } from 'class-validator';

export class AirtableDto {
  @IsString({ message: 'не указан артикул' })
  articul: string;

  // @IsString({message: "не казан barcode"})
  // barcode: string;

  // @IsString({message:"не указано имя"})
  // name: string;
}
