import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CodeAuthDto, CreateAuthDto } from 'src/auth/dto/create-auth.dto';
import { comparePasswordHelper } from 'src/helpers/util';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (!user) return null

    const isValidPassword = await comparePasswordHelper(pass, user.password)

    if (!isValidPassword) return null

    return user
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user._id }

    return {
      user: {
        email: user.email,
        _id: user.id,
        name: user.name,
      },
      access_token: this.jwtService.sign(payload)
    }
  }
  handleRegister = async (registerDto: CreateAuthDto) => {
    return await this.usersService.handleRegister(registerDto)
  }

  checkCode = async (data: CodeAuthDto) => {
    return await this.usersService.handleActive(data)
  }
}
