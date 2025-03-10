import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateAuthDto {
    @IsNotEmpty({ message: "email khong duoc de trong" })
    email: string;

    @IsNotEmpty({ message: "password khong duoc de trong" })
    password: string;

    @IsOptional()
    name: string;
}
