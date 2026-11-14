import { PrismaClient } from "@prisma/client";
import { tournamentSlug } from "../lib/slug";

const prisma = new PrismaClient();

const SQUADS: Record<string, string[]> = {
  "Deportivo La Esquina": ["Nico Pérez", "Tomás Ruiz", "Iván Sosa", "Leo Díaz", "Bruno Gil"],
  "Atlético Barrio Norte": ["Pablo Vega", "Marcos Lema", "Juan Ortiz", "Dani Salas", "Facu Rivas"],
  "Sporting El Potrero": ["Kevin Mora", "Lucho Bravo", "Seba Ríos", "Ariel Paz", "Gonza Luna"],
  "Unión Los Pinos": ["Mati Herrera", "Fede Campos", "Nahuel Costa", "Emi Bustos", "Thiago Nieto"],
  "Racing Villa Sur": ["Axel Romero", "Joaco Medina", "Simón Arce", "Rama Ferreyra", "Benja Toledo"],
};

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: { slug: "demo", name: "Liga Amateur Demo" },
  });

  const name = "Copa Barrio Norte";
  await prisma.tournament.deleteMany({
    where: { organizationId: org.id, name },
  });

  const tournament = await prisma.tournament.create({
    data: {
      organizationId: org.id,
      name,
      season: "2026",
      slug: tournamentSlug(name),
    },
  });

  for (const [teamName, players] of Object.entries(SQUADS)) {
    await prisma.team.create({
      data: {
        tournamentId: tournament.id,
        name: teamName,
        players: {
          create: players.map((playerName, i) => ({
            name: playerName,
            number: i + 1,
            document: `3${Math.floor(1000000 + Math.random() * 8999999)}`,
          })),
        },
      },
    });
  }

  console.log(`Torneo creado: ${tournament.name}`);
  console.log(`Dashboard: /dashboard/${tournament.id}/equipos`);
  console.log(`Público:   /torneo/${tournament.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
