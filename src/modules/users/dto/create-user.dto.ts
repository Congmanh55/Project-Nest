import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: "name khong duoc de trong" })
    name: string;

    @IsNotEmpty({ message: "email khong duoc de trong" })
    @IsEmail({}, { message: 'email khong dung dinh dang' })
    email: string;

    @IsNotEmpty({ message: "password khong duoc de trong" })
    password: string;

    phone: string;

    address: string;

    image: string;

}
