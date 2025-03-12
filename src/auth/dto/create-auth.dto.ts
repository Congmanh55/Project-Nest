import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateAuthDto {
    @IsNotEmpty({ message: "email khong duoc de trong" })
    email: string;

    @IsNotEmpty({ message: "password khong duoc de trong" })
    password: string;

    @IsOptional()
    name: string;
}

export class CodeAuthDto {
    @IsNotEmpty({ message: "_id khong duoc de trong" })
    _id: string;

    @IsNotEmpty({ message: "Code khong duoc de trong" })
    code: string;
}
