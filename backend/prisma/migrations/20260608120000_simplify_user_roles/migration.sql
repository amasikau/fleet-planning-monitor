ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole"
USING (
  CASE
    WHEN "role"::text = 'admin' THEN 'admin'
    ELSE 'user'
  END
)::"UserRole";

DROP TYPE "UserRole_old";
