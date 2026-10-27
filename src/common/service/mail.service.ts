import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService { }


interface EmailTemplate {
    forgotPassword: string,
    otpVerify: string
}
const emailTemplate: EmailTemplate = {
    forgotPassword: '',
    otpVerify: ''
}