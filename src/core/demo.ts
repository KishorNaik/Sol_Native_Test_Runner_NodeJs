import 'reflect-metadata';
import { Err, Ok, Result, err } from 'neverthrow';
import { NODE_ENV } from './config/env';
import { ResultError } from './shared/utils/exceptions';
import { StatusCodes } from 'http-status-codes';
import Container, { Service } from 'typedi';
import { IRequest, IRequestHandler, requestHandler } from 'mediatr-ts';
import mediatR from './shared/mediatR';
import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { validateOrRejectAsync } from './shared/dtoValidation';
import { DataResponse, DataResponseFactory } from './shared/models/response';

export interface IAdd {
  add(a: number, b: number): Result<number, ResultError>;
}

@Service()
export class Add implements IAdd {
  public add(a: number, b: number): Result<number, ResultError> {
    console.log(`env: ${process.env.NODE_ENV}`);
    console.log(`env: ${NODE_ENV}`);

    if (a <= 0 || b <= 0)
      return new Err(new ResultError('Invalid input', StatusCodes.BAD_REQUEST));

    return new Ok(a + b);
  }
}

export class AddRequestDTO {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  a?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  b?: number;
}

export class AddResponseDTO {
  result?: number;
}

export class AddCommand
  implements IRequest<DataResponse<AddResponseDTO | null>>
{
  public constructor(addRequest: AddRequestDTO) {
    this._addRequest = addRequest;
  }

  private _addRequest: AddRequestDTO;
  public get addRequest(): AddRequestDTO {
    return this._addRequest;
  }
}

@requestHandler(AddCommand)
export class AddCommandHandler
  implements IRequestHandler<AddCommand, DataResponse<AddResponseDTO | null>>
{
  private readonly _add: IAdd;

  public constructor() {
    this._add = Container.get(Add);
  }
  public async handle(
    value: AddCommand,
  ): Promise<DataResponse<AddResponseDTO | null>> {
    try {
      // Validate DTO.
      var validateResult = await validateOrRejectAsync<AddRequestDTO>(
        value.addRequest,
      );
      if (validateResult.isErr())
        return Promise.resolve(
          DataResponseFactory.Response(
            false,
            validateResult.error.StatusCode,
            null,
            validateResult.error.message,
          ),
        );

      // Call Add Service
      var result = this._add.add(
        value?.addRequest?.a ?? 0,
        value.addRequest.b ?? 0,
      );

      if (result.isErr())
        return Promise.resolve(
          DataResponseFactory.Response(
            false,
            result.error.StatusCode,
            null,
            result.error.message,
          ),
        );

      return Promise.resolve(
        DataResponseFactory.Response(true, StatusCodes.OK, {
          result: result.value,
        }),
      );
    } catch (ex) {
      const error = ex as Error;
      return Promise.resolve(
        DataResponseFactory.Response(
          false,
          StatusCodes.INTERNAL_SERVER_ERROR,
          null,
          error.message,
        ),
      );
    }
  }
}

export class Main {
  public async addCall(
    a: number,
    b: number,
  ): Promise<DataResponse<AddResponseDTO | null>> {
    const addRequestDTO: AddRequestDTO = new AddRequestDTO();
    addRequestDTO.a = a;
    addRequestDTO.b = b;
    return await mediatR.send(new AddCommand(addRequestDTO));
  }
}
