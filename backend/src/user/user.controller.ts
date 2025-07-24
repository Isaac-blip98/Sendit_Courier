import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from 'src/common/cloudinary/cloudinary.provider';
import { UserService } from './user.service';
import { UpdateUserDto } from './dtos/update-user.dto';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'sendit_users',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Patch(':id/upload-profile')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadProfileImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.update(id, { profileImage: file.path });
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }
}
