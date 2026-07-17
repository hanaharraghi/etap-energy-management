import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtStrategy } from './jwt.strategy';
import { KeycloakAuthGuard } from './keycloak-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { LocalUserInterceptor } from './local-user.interceptor';

@Module({
  imports: [PassportModule],
  providers: [
    JwtStrategy,
    AuthService,
    { provide: APP_GUARD, useClass: KeycloakAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LocalUserInterceptor },
  ],
  exports: [AuthService],
})
export class AuthModule {}
