import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../guard/auth.guard.js";
import { RolesGuard } from "../guard/role.guard.js";
import { Roles } from "./role.decorator.js";
import { UserRole } from "../enum/schema.enum.js";

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
