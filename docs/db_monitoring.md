Enable pg_stat_statements (Postgres) on staging:

1. Edit postgresql.conf:
   shared_preload_libraries = 'pg_stat_statements'

2. Restart Postgres.

3. Create extension (once):
   CREATE EXTENSION pg_stat_statements;

4. Example query to measure queries for a time window:
   SELECT query, calls, total_time
   FROM pg_stat_statements
   ORDER BY total_time DESC
   LIMIT 50;
