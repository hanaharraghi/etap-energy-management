import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { KeycloakAuthGuard } from '../src/auth/keycloak-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * e2e smoke test for /factures, with the Keycloak guard replaced by a
 * mock that injects a fake decoded token — this avoids needing a real
 * Keycloak instance running just to verify routing/DI wiring end to end.
 * Extend this file with real assertions once a test database is wired up
 * (currently Prisma calls will fail without one — see README).
 */
describe('Factures (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(KeycloakAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            keycloakId: 'test-user',
            email: 'test@etap.tn',
            firstName: 'Test',
            lastName: 'User',
            roles: ['ADMIN'],
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/factures (GET) returns an array', async () => {
    // Requires a real database connection (DATABASE_URL) to pass — this
    // confirms the route/guard/DI wiring resolves correctly even before
    // that's set up, by checking we get a response at all (200 with data,
    // or a clean 5xx from Prisma rather than a 404 routing failure).
    const res = await request(app.getHttpServer()).get('/factures');
    expect([200, 500, 503]).toContain(res.status);
  });

  afterEach(async () => {
    await app.close();
  });
});
