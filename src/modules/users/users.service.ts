import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/users/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { hashPasswordHelper } from 'src/helpers/util';
import aqp from 'api-query-params';
import { CodeAuthDto, CreateAuthDto } from 'src/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private readonly mailerService: MailerService
  ) {

  }

  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email });
    if (user) return true;
    return false
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;

    //chekc email
    const isExitst = await this.isEmailExist(email)
    if (isExitst) {
      throw new BadRequestException(`Email da ton tai: ${email}. Vui long su dung email khac`)
    }

    //hash password
    const hashPassword = await hashPasswordHelper(createUserDto.password)
    const user = await this.userModel.create({
      name, email, password: hashPassword, phone, address, image
    })
    return {
      _id: user.id
    }
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query)
    if (filter.current) delete filter.current
    if (filter.pageSize) delete filter.pageSize

    if (!current) current = 1
    if (!pageSize) pageSize = 10

    const totalItems = (await this.userModel.find(filter)).length
    const totalPages = Math.ceil(totalItems / pageSize)
    const skip = (+current - 1) * (pageSize)

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select("-password")
      .sort(sort as any)

    return { results, totalPages };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email })
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto }
    );
  }

  async remove(_id: string) {
    //check id
    if (mongoose.isValidObjectId(_id)) {
      //delete
      return await this.userModel.deleteOne({ _id })
    } else {
      throw new BadRequestException("Id khong dung dinh dang")
    }
    return `This action removes a #${_id} user`;
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { name, email, password } = registerDto;

    //chekc email
    const isExitst = await this.isEmailExist(email)
    if (isExitst) {
      throw new BadRequestException(`Email da ton tai: ${email}. Vui long su dung email khac`)
    }

    //hash password
    const hashPassword = await hashPasswordHelper(password)
    const codeId = uuidv4()
    const user = await this.userModel.create({
      name, email, password: hashPassword,
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes')
    })

    //send email
    this.mailerService
      .sendMail({
        to: user.email, // list of receivers
        subject: 'Active your account at See_M ✔', // Subject line
        text: 'welcome', // plaintext body
        template: 'register.hbs',
        context: {
          name: user?.name ?? user.email,
          activationCode: codeId
        }
      })

    //tra ra phan hoi 
    return {
      _id: user._id
    }

  }

  async handleActive(data: CodeAuthDto) {
    const user = await this.userModel.findOne({
      _id: data._id,
      codeId: data.code
    })
    if (!user) {
      throw new BadRequestException("Ma code khong ton tai hoac da het han")
    }

    //check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired)
    if (isBeforeCheck) {
      //valid => update user
      await this.userModel.updateOne({ _id: data._id }, {
        isActive: true
      })
      return { isBeforeCheck }
    } else {
      throw new BadRequestException("Ma code khong ton tai hoac da het han")
    }

  }

  async retryActive(email: string) {
    //check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException("Tai khoan khong ton tai")
    }
    if (user.isActive === 'true') {
      throw new BadRequestException("Tai khoan da duoc kich hoat")
    }

    //sendEmai
    const codeId = uuidv4()

    //update user
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes')
    })
    //send Email
    this.mailerService
      .sendMail({
        to: user.email, // list of receivers
        subject: 'Active your account at See_M ✔', // Subject line
        text: 'welcome', // plaintext body
        template: 'register.hbs',
        context: {
          name: user?.name ?? user.email,
          activationCode: codeId
        }
      })

    return { _id: user._id }
  }
}
