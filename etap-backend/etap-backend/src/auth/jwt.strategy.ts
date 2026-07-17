import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

interface KeycloakTokenPayload {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: { roles: string[] };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const keycloakUrl = config.get<string>('KEYCLOAK_URL');
    const realm = config.get<string>('KEYCLOAK_REALM');

    super({
      jwtFromRequest: (req) => {
        const auth = req.headers?.authorization;
        if (!auth || !auth.startsWith('Bearer ')) return null;
        return auth.substring(7);
      },
      // Signature + expiry validated via Keycloak's public keys (JWKS).
      // No client secret involved — react-client is a public SPA client.
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
      algorithms: ['RS256'],
      // We don't pin `audience`/`issuer` strictly here because dev Keycloak
      // instances often serve on multiple hostnames (localhost vs 127.0.0.1);
      // tighten this in production by setting issuer: `${keycloakUrl}/realms/${realm}`.
    });
  }

  async validate(payload: KeycloakTokenPayload) {
    return {
      keycloakId: payload.sub,
      email: payload.email ?? '',
      firstName: payload.given_name ?? '',
      lastName: payload.family_name ?? payload.preferred_username ?? '',
      roles: payload.realm_access?.roles ?? [],
    };
  }
}
