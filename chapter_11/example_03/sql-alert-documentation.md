The Todos Cloud SQL database is experiencing unusually high connections or client queries.
This may indicate a few things:

- a client is not correctly terminating connections, causing stale connections to accumulate
- a client has scaled beyond expected volume
- a client is executing inefficient or unnecessary queries

### Notes

Clients connect to this database from the App Engine flexible environment using the [Spring Cloud GCP integrations for Cloud SQL](https://docs.spring.io/spring-cloud-gcp/docs/1.0.0.M2/reference/htmlsingle/#_spring_boot_starter_for_google_cloud_sql).

### Possible Causes

- [Cloud SQL Logs](https://console.cloud.google.com/logs/viewer?minLogLevel=0&resource=cloudsql_database)
- [GCP Cloud SQL Documentation](https://cloud.google.com/sql/docs/mysql/connect-app-engine)
- [Spring Cloud GCP issues](https://github.com/spring-cloud/spring-cloud-gcp/issues)
