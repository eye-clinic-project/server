import { Query } from '@nestjs/cqrs';

export class IsLicenseTakenQuery extends Query<boolean> {
  constructor(public readonly licenseNumber: string) {
    super();
  }
}
