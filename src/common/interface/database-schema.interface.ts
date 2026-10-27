import type { UserRoleEnum } from '../enum/security.enum.js';

export interface IUser {
  role: UserRoleEnum;
}

export interface IDoctor extends IUser {}

export interface IPatient extends IUser {}

export interface IAppointment {}

export interface IAnalysis {}

export interface IConversation {}

export interface IChat {}

export interface IMessage {}

export interface INotification {}

export interface IReport {}
