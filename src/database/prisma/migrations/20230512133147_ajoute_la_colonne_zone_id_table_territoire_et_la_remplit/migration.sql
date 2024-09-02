-- AlterTable
ALTER TABLE "public"."territoire" ADD COLUMN     "zone_id" TEXT;

UPDATE territoire
    SET zone_id = CONCAT('D',code_insee)
    WHERE maille::text='dept';

UPDATE territoire
    SET zone_id = CONCAT('R',code_insee)
    WHERE maille::text='reg';

UPDATE territoire
    SET zone_id = 'FRANCE'
    WHERE maille::text='nat';

ALTER TABLE "public"."territoire" ALTER COLUMN "zone_id" SET NOT NULL;
