import { IsString } from 'class-validator';
//import { format} from "date-fns"
export class AirtableDto {
  @IsString({ message: 'не указан артикул' })
  articul: string;

  //createAt: format(new Date(), "dd.MM.yyyy")
  // @IsString({message: "не казан barcode"})
  // barcode: string;

  // @IsString({message:"не указано имя"})
  // name: string;
}
