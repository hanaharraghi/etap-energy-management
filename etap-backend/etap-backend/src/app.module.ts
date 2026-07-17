import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { RegionsModule } from './regions/regions.module';
import { SitesModule } from './sites/sites.module';
import { CompteursModule } from './compteurs/compteurs.module';
import { FacturesModule } from './factures/factures.module';
import { ConsommationsModule } from './consommations/consommations.module';
import { AlertesModule } from './alertes/alertes.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { PredictionsModule } from './predictions/predictions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FournisseursModule,
    RegionsModule,
    SitesModule,
    CompteursModule,
    FacturesModule,
    ConsommationsModule,
    AlertesModule,
    UtilisateursModule,
    PredictionsModule,
  ],
})
export class AppModule {}
