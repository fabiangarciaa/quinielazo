# 🏆 Quinielazo — Gestión de Quinielas Deportivas

Sistema completo para gestionar quinielas del **Mundial 2026** y **Liga MX**, con sorteo automático
de equipos, cálculo de puntos en tiempo real, ranking con WebSocket y simulador de escenarios.

---

## 🚀 Inicio rápido (Docker — recomendado)

```bash
git clone <repo> quinielazo && cd quinielazo

# Levantar todos los servicios (postgres + api + frontend)
docker-compose up -d

# Primera vez: migraciones + datos iniciales
docker exec quinielazo_api npx prisma migrate dev --name init
docker exec quinielazo_api npm run db:seed

# Listo:
# Frontend  → http://localhost:5173
# API       → http://localhost:3000/api
# Swagger   → http://localhost:3000/api/docs
# Login     → admin@quinielazo.mx  /  admin123
```

---

## 🛠 Desarrollo local (sin Docker)

**Requisitos:** Node.js 20+, PostgreSQL 16+

```bash
# 1. Base de datos
createdb quinielazo

# 2. Backend
cd backend
npm install
cp .env.example .env        # editar DATABASE_URL
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev           # http://localhost:3000

# 3. Frontend (en otra terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

---

## 📁 Estructura del proyecto

```
quinielazo/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          ← Modelo de datos completo
│   │   └── seed.ts                ← 48 equipos Mundial + 18 Liga MX + reglas
│   └── src/
│       ├── auth/                  ← JWT login/registro
│       ├── tournaments/           ← CRUD + estados + reglas de puntuación
│       ├── participants/          ← CRUD participantes
│       ├── teams/                 ← CRUD equipos + importación CSV
│       ├── pots/                  ← Bombos configurables
│       ├── draws/                 ← Sorteo: bombos / serpiente / balanceado
│       ├── phases/                ← Fases del torneo
│       ├── matches/               ← Partidos + registro de resultados
│       ├── results/               ← Historial de resultados
│       ├── scoring/               ← ⭐ Motor central de puntos
│       ├── ranking/               ← Recálculo + historial de snapshots
│       ├── simulator/             ← Escenarios hipotéticos
│       ├── export/                ← Excel / CSV
│       ├── audit/                 ← Log de cambios
│       └── events/                ← WebSocket gateway
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage           ← Login + registro
        │   ├── DashboardPage       ← Centro de control con ranking en vivo
        │   ├── TournamentsPage     ← Lista y creación de torneos
        │   ├── TournamentDetailPage← Resumen del torneo
        │   ├── ParticipantsPage    ← CRUD participantes
        │   ├── TeamsPage           ← Gestión de equipos + asignación
        │   ├── DrawPage            ← Bombos + ejecución del sorteo
        │   ├── MatchesPage         ← Partidos + captura de resultados
        │   ├── RankingPage         ← Tabla de posiciones + gráfica
        │   ├── SimulatorPage       ← ¿Qué pasa si...?
        │   └── AdminPage           ← Fases, puntuación, estado torneo
        ├── components/
        │   └── Layout              ← Sidebar + navegación
        ├── store/
        │   └── auth.store.ts       ← Zustand (auth + torneo activo)
        └── lib/
            └── api.ts              ← Axios + helpers por módulo
```

---

## 🔌 API endpoints principales

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| Auth | `POST /auth/login` | Login con email/password |
| Auth | `POST /auth/register` | Registro de usuario |
| Torneos | `GET/POST /tournaments` | Listar / crear |
| Torneos | `PATCH /tournaments/:id/status` | Cambiar estado |
| Torneos | `GET/PATCH /tournaments/:id/scoring-rules` | Reglas de puntuación |
| Participantes | `GET/POST /participants?tournamentId=` | Listar / crear |
| Equipos | `POST /teams/import` | Importar CSV |
| Bombos | `POST /draws/:id/pots` | Sorteo por bombos |
| Bombos | `POST /draws/:id/snake` | Draft serpiente |
| Bombos | `POST /draws/:id/balanced` | Sorteo balanceado |
| Partidos | `POST /matches/:id/result` | **Registrar resultado** (recalcula todo) |
| Partidos | `POST /matches/:id/correct` | Corregir resultado ya registrado |
| Ranking | `GET /ranking/:tournamentId` | Ranking actual |
| Ranking | `GET /ranking/:tournamentId/history` | Historial para gráfica |
| Simulador | `GET /simulator/:tournamentId` | Escenarios posibles |
| Simulador | `POST /simulator/:tournamentId/team-win` | ¿Qué pasa si X gana? |
| Export | `GET /export/:id/ranking?format=csv\|excel` | Exportar ranking |

---

## 🎲 Métodos de sorteo

| Método | Descripción |
|--------|-------------|
| **Por bombos** | 1 equipo de cada bombo por participante |
| **Draft serpiente** | Turnos alternados P1→PN luego PN→P1 |
| **Balanceado auto** | Minimiza diferencia de fuerza total entre participantes |

Al terminar el sorteo el sistema calcula un **indicador de equilibrio**:
- 🟢 Muy equilibrado (score ≥ 80)
- 🟡 Medianamente equilibrado (score ≥ 50)
- 🔴 Desbalanceado (score < 50)

---

## ⚙️ Puntuación automática

Al registrar un resultado se calculan automáticamente:
- Puntos por victoria/empate según la fase
- Puntos por avance de fase (configurables por torneo)
- Bonus por portería en cero
- Bonus por goleada (3+ goles de diferencia)
- Actualización de ranking con 4 criterios de desempate
- Snapshot del ranking para gráfica histórica
- Evento WebSocket para actualización en tiempo real

---

## 🌐 WebSocket

El frontend se conecta automáticamente al torneo activo y recibe:

| Evento | Descripción |
|--------|-------------|
| `ranking_updated` | Nuevo resultado registrado, incluye resumen y ranking |
| `match_result` | Resultado de partido |
| `tournament_updated` | Cambios en el torneo |

---

## 🔧 Variables de entorno

**Backend** (`.env`):
```
DATABASE_URL=postgresql://user:pass@host:5432/quinielazo
JWT_SECRET=clave_muy_larga_y_aleatoria
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```
