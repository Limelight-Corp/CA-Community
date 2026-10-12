-- CreateTable
CREATE TABLE "legal_documents" (
    "slug" VARCHAR(40) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(400) NOT NULL,
    "content" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("slug")
);
