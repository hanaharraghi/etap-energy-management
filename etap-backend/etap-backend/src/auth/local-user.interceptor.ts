import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class LocalUserInterceptor implements NestInterceptor {
  constructor(private authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      // Public route — no Keycloak user decoded, nothing to attach.
      return next.handle();
    }

    return from(this.authService.upsertFromKeycloak(request.user)).pipe(
      switchMap((localUser) => {
        request.localUser = localUser;
        return next.handle();
      }),
    );
  }
}
