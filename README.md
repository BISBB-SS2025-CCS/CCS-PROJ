#befehl um redis und postgre LOKAL zu starten für dev/testing:
docker-compose up -d

#verbindung zur postgres_db:
docker exec -it postgres_db psql -U postgres_user -d incident_db

#damits funktioniert muss auch ein .env erstellt werden, etwaige pws und user anpassen:
```
PORT=3000

# Lokale PostgreSQL-Konfiguration (passen Sie dies für Ihr lokales Setup an)
PG_USER=postgres_user
PG_HOST=localhost
PG_DATABASE=incident_db
PG_PASSWORD=your_secure_password
PG_PORT=5432

# Lokale Redis-Konfiguration (passen Sie dies für Ihr lokales Setup an)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password # Falls Ihr Redis ein Passwort hat

# Session Secret (ändern Sie dies in einen langen, zufälligen String)
SESSION_SECRET=THIS_IS_A_VERY_SECURE_SECRET_KEY_REPLACE_IT

# Platzhalter für AWS-Konfiguration (wird später bei der Bereitstellung aktualisiert)
# RDS_HOSTNAME=your_rds_instance_endpoint
# RDS_PORT=5432
# RDS_DB_NAME=your_rds_database_name
# RDS_USERNAME=your_rds_username
# RDS_PASSWORD=your_rds_password
# ELASTICACHE_REDIS_ENDPOINT=your_elasticache_redis_endpoint
# ELASTICACHE_REDIS_PORT=6379
```