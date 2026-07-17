import { PrismaClient, TypeEnergie, ModeSaisie, StatutFacture, TypeReleve } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ETAP database...');

  // --- Fournisseurs ---
  const steg = await prisma.fournisseur.upsert({
    where: { codeFournisseur: 'STEG' },
    update: {},
    create: { nom: 'STEG', codeFournisseur: 'STEG', typeEnergieFournie: TypeEnergie.ELECTRICITE },
  });
  const stegGaz = await prisma.fournisseur.upsert({
    where: { codeFournisseur: 'STEG-GAZ' },
    update: {},
    create: { nom: 'STEG', codeFournisseur: 'STEG-GAZ', typeEnergieFournie: TypeEnergie.GAZ },
  });
  const sonede = await prisma.fournisseur.upsert({
    where: { codeFournisseur: 'SONEDE' },
    update: {},
    create: { nom: 'SONEDE', codeFournisseur: 'SONEDE', typeEnergieFournie: TypeEnergie.EAU },
  });

  // --- Régions & Sites ---
  const regionsData = [
    { nom: 'Tunis', code: 'TUN', couleur: '#005BAC' },
    { nom: 'Sfax', code: 'SFX', couleur: '#00AEEF' },
    { nom: 'Gafsa', code: 'GAF', couleur: '#22C55E' },
    { nom: 'Sousse', code: 'SOU', couleur: '#F59E0B' },
    { nom: 'Gabès', code: 'GAB', couleur: '#8B5CF6' },
    { nom: 'Nabeul', code: 'NAB', couleur: '#EC4899' },
  ];

  const regions: Record<string, any> = {};
  for (const r of regionsData) {
    regions[r.code] = await prisma.region.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  const sitesData = [
    { nom: 'Siège Tunis', adresse: 'Avenue Habib Bourguiba, Tunis', reference: 'SITE-TUN-01', type: 'Bureau', regionCode: 'TUN' },
    { nom: 'Usine Sfax', adresse: 'Zone Industrielle Sfax', reference: 'SITE-SFX-01', type: 'Industriel', regionCode: 'SFX' },
    { nom: 'Usine Métlaoui', adresse: 'Route de Gafsa, Métlaoui', reference: 'SITE-GAF-01', type: 'Industriel', regionCode: 'GAF' },
    { nom: 'Bureau Sousse', adresse: 'Corniche Sousse', reference: 'SITE-SOU-01', type: 'Bureau', regionCode: 'SOU' },
    { nom: 'Usine Gabès', adresse: 'Zone Industrielle Gabès', reference: 'SITE-GAB-01', type: 'Industriel', regionCode: 'GAB' },
  ];

  const sites: Record<string, any> = {};
  for (const s of sitesData) {
    const { regionCode, ...data } = s;
    sites[s.reference] = await prisma.site.upsert({
      where: { reference: s.reference },
      update: {},
      create: { ...data, regionId: regions[regionCode].id },
    });
  }

  // --- Utilisateur de démonstration (rattaché au compte Keycloak admin.demo) ---
  const admin = await prisma.utilisateur.upsert({
    where: { keycloakId: 'seed-admin-demo' },
    update: {},
    create: {
      keycloakId: 'seed-admin-demo',
      nom: 'Trabelsi',
      prenom: 'Ahmed',
      email: 'ahmed.trabelsi@etap.tn',
      role: 'ADMIN',
      dept: 'IT',
    },
  });

  // --- Compteurs ---
  const compteurTunisElec = await prisma.compteur.upsert({
    where: { referenceUnique: '02178702447600' },
    update: {},
    create: { referenceUnique: '02178702447600', type: TypeEnergie.ELECTRICITE, siteId: sites['SITE-TUN-01'].id },
  });
  const compteurMetlaouiEau = await prisma.compteur.upsert({
    where: { referenceUnique: '71510100' },
    update: {},
    create: { referenceUnique: '71510100', type: TypeEnergie.EAU, siteId: sites['SITE-GAF-01'].id },
  });

  // --- Facture d'exemple (reflète la facture STEG réelle analysée pour ce projet) ---
  const existingFacture = await prisma.facture.findUnique({ where: { numeroFacture: 'FAC-2025-0847' } });
  if (!existingFacture) {
    await prisma.facture.create({
      data: {
        numeroFacture: 'FAC-2025-0847',
        typeReleve: TypeReleve.RELEVE,
        dateFacture: new Date('2025-06-12'),
        dateEmission: new Date('2025-06-12'),
        periodeDebut: new Date('2025-02-13'),
        periodeFin: new Date('2025-06-12'),
        dateEcheance: new Date('2025-07-10'),
        puissanceSouscrite: 13,
        nombreMois: 4,
        montantHT: 873.328,
        totalTaxes: 103.805,
        montantTTC: 977.133,
        arrieres: 0,
        paiementsPrecedents: 427.085,
        montantAPayer: 550.0,
        typeEnergie: TypeEnergie.ELECTRICITE,
        modeSaisie: ModeSaisie.MANUEL,
        statut: StatutFacture.VALIDEE,
        compteurId: compteurTunisElec.id,
        fournisseurId: steg.id,
        creeParId: admin.id,
        valideeParId: admin.id,
        lignesConsommation: {
          create: [
            { libelleTranche: 'Jour', ancienIndex: 26457, nouveauIndex: 28691, quantite: 2234, prixUnitaire: 0.14, montantHT: 312.76, tauxTVA: 7 },
            { libelleTranche: 'Heures Creuses', ancienIndex: 43346, nouveauIndex: 44144, quantite: 4798, prixUnitaire: 0.116, montantHT: 556.568, tauxTVA: 7 },
          ],
        },
        taxes: {
          create: [
            { libelle: 'Contribution CL', montant: 35.16 },
            { libelle: 'FTE Électricité', montant: 7.032 },
            { libelle: 'TVA', montant: 61.613 },
          ],
        },
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
