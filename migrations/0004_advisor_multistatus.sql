-- Advisors can hold several statuses at once (e.g. "doradca clauwi" AND
-- "doradca innej szkoły"). `statusy` is the JSON-array source of truth; the
-- existing `status` column keeps the primary (first) one, which is what the
-- public site currently displays, filters and sorts by.

ALTER TABLE advisors ADD COLUMN statusy TEXT NOT NULL DEFAULT '[]';

-- Backfill existing rows: seed the array from the single status they already have.
UPDATE advisors SET statusy = json_array(status) WHERE statusy IN ('', '[]');
