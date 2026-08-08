-- `status` is filtered on (equality) and used as a sort key in listPublicAdvisors
-- and adminListAdvisors, but had no index — nazwisko/imie were the only
-- indexed columns so far. Note: the woj filter (json_each over `regiony`) and
-- the q/oferta LIKE '%...%' search can't benefit from a plain btree index
-- regardless (unindexable JSON table-valued scan / leading-wildcard LIKE), so
-- this is the one gap worth closing given the current dataset size.

CREATE INDEX IF NOT EXISTS idx_advisors_status ON advisors (status COLLATE NOCASE);
