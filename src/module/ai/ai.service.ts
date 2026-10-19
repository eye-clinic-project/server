import { BadGatewayException, Injectable } from '@nestjs/common';
import FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class AiService {
  async uploadToFastAPI(file: Express.Multer.File) {

 const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    
    try {
      const { data } = await axios.post(
        'http://127.0.0.1:8000/upload-image',
        form,
        {
          headers: form.getHeaders(),
          timeout: 120_000,
        },
      );
      
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('FastAPI error:', error.response?.data ?? error.message);
      }

      throw new BadGatewayException('AI service request failed');
    }
  }
}