-- A team member can belong to several wings.
-- CreateTable
CREATE TABLE "team_member_wings" (
    "team_member_id" TEXT NOT NULL,
    "wing_id" TEXT NOT NULL,
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "team_member_wings_pkey" PRIMARY KEY ("team_member_id","wing_id")
);

-- CreateIndex
CREATE INDEX "team_member_wings_wing_id_idx" ON "team_member_wings"("wing_id");

-- AddForeignKey
ALTER TABLE "team_member_wings" ADD CONSTRAINT "team_member_wings_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member_wings" ADD CONSTRAINT "team_member_wings_wing_id_fkey" FOREIGN KEY ("wing_id") REFERENCES "wings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Copy each member's current wing (team_members.wing_id stays as the primary wing).
INSERT INTO "team_member_wings" ("team_member_id", "wing_id", "position")
SELECT "id", "wing_id", 0 FROM "team_members" WHERE "wing_id" IS NOT NULL
ON CONFLICT DO NOTHING;
