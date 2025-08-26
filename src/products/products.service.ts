import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');

  //OnModuleInit es una clase que se ejecuta cuando se inicia el módulo
  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPage = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPage / limit);

    //TODO: Esta condicion no es parte del curso lo hice para que puedas ver el error de la paginación
    if (page > lastPage) {
      throw new Error('Page not found');
    }
    return {
      data: await this.product.findMany({
        //El skip indica cuántos registros se deben omitir antes de empezar a tomar los registros
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      meta: {
        total: totalPage,
        page: page,
        lastPage: lastPage,
      },
    };
  }
  async findOne(id: number) {
    const product = await this.product.findFirst({
      //esto es lo mismo que poner { id }
      where: { id: id, available: true },
    });

    if (!product) {
      //Se utiliza RpcException para enviar un mensaje de error al cliente
      throw new RpcException({
        message: `Product with id #${id} not found!!`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;

    await this.findOne(id);

    return this.product.update({
      where: { id },
      //Mandamos la data nomas y no el id
      data: data,
    });
  }

  //Soft delete
  async remove(id: number) {
    await this.findOne(id);

    const product = await this.product.update({
      where: { id },
      data: { available: false },
    });
    return product;
  }

  //Se utiliza el método validateProduct para validar que los ids de la lista de productos estén en la base de datos de productos (SQLite)
  async validateProduct(ids: number[]) {
    ids = Array.from(new Set(ids)); //esto hace que el array no tenga ningun elemento duplicado

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    }); // Esto devuelve un array de productos que coinciden con los ids

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some products ware not found',
        status: HttpStatus.BAD_REQUEST,
      });
    } // Si la cantidad de productos encontrados no es igual a la cantidad de ids enviados, significa que algunos productos no existen

    return products;
  }
}

//No es recomendable borrar un producto de la base de datos porque puede causar problemas
// async remove(id: number) {
//   await this.findOne(id);

//   return this.product.delete({
//     where: { id },
//   });
// }
