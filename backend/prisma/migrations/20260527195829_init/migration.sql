-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TournamentType" AS ENUM ('WORLD_CUP', 'LIGA_MX', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('SETUP', 'DRAW_PENDING', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "DrawMethod" AS ENUM ('POTS', 'SNAKE_DRAFT', 'BALANCED_AUTO', 'AUCTION', 'MANUAL');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'ELIMINATED', 'CHAMPION');

-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL', 'PLAYOFF', 'LIGUILLA', 'REGULAR_SEASON', 'PLAY_IN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScoringEventType" AS ENUM ('WIN_GROUP', 'DRAW_GROUP', 'ADVANCE_ROUND_OF_32', 'ADVANCE_ROUND_OF_16', 'ADVANCE_QUARTER', 'ADVANCE_SEMI', 'REACH_FINAL', 'CHAMPION', 'RUNNER_UP', 'CLEAN_SHEET', 'THRASHING_WIN', 'SUPER_LEADERSHIP', 'LAST_IN_GROUP', 'EARLY_ELIMINATION', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TournamentType" NOT NULL,
    "season" TEXT NOT NULL,
    "team_count" INTEGER NOT NULL,
    "participant_count" INTEGER NOT NULL,
    "competition_system" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'SETUP',
    "scoring_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "alias" TEXT,
    "avatar_url" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "current_rank" INTEGER NOT NULL DEFAULT 0,
    "prev_rank" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "participant_id" TEXT,
    "pot_id" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "shield_url" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 50,
    "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "matches_played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "clean_sheets" INTEGER NOT NULL DEFAULT 0,
    "thrashings" INTEGER NOT NULL DEFAULT 0,
    "phase_reached" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pots" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "strength_min" INTEGER NOT NULL,
    "strength_max" INTEGER NOT NULL,
    "teams_per_participant" INTEGER NOT NULL,

    CONSTRAINT "pots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draws" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "method" "DrawMethod" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "balance_score" DOUBLE PRECISION,
    "assignments" JSONB NOT NULL DEFAULT '[]',
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_phases" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PhaseType" NOT NULL,
    "round_number" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),

    CONSTRAINT "tournament_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "match_date" TIMESTAMP(3),
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "home_goals" INTEGER NOT NULL,
    "away_goals" INTEGER NOT NULL,
    "winner_team_id" TEXT,
    "had_penalties" BOOLEAN NOT NULL DEFAULT false,
    "home_clean_sheet" BOOLEAN NOT NULL DEFAULT false,
    "away_clean_sheet" BOOLEAN NOT NULL DEFAULT false,
    "is_thrashing" BOOLEAN NOT NULL DEFAULT false,
    "advancing_team_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_rules" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "event_type" "ScoringEventType" NOT NULL,
    "points" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_scores" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "result_id" TEXT,
    "scoring_rule_id" TEXT,
    "team_id" TEXT,
    "points_earned" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_scores" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "points_earned" INTEGER NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_history" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL,
    "alive_teams" INTEGER NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "participants_tournament_id_user_id_key" ON "participants"("tournament_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "results_match_id_key" ON "results"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_rules_tournament_id_event_type_key" ON "scoring_rules"("tournament_id", "event_type");

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_pot_id_fkey" FOREIGN KEY ("pot_id") REFERENCES "pots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pots" ADD CONSTRAINT "pots_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draws" ADD CONSTRAINT "draws_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_phases" ADD CONSTRAINT "tournament_phases_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "tournament_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_rules" ADD CONSTRAINT "scoring_rules_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_scores" ADD CONSTRAINT "participant_scores_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_scores" ADD CONSTRAINT "participant_scores_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_scores" ADD CONSTRAINT "participant_scores_scoring_rule_id_fkey" FOREIGN KEY ("scoring_rule_id") REFERENCES "scoring_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_scores" ADD CONSTRAINT "team_scores_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_scores" ADD CONSTRAINT "team_scores_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
