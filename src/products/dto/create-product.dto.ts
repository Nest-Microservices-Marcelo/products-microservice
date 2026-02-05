import { Type } from 'class-transformer';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  public name: string;

  @IsNumber({
    //Mas de 4 decimales
    maxDecimalPlaces: 4,
  })
  //El precio debe ser mayor que cero
  @Min(0)
  @Type(() => Number)
  public price: number;
}
