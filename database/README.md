# Instrukcja uruchomienia bazy danych PostgreSQL

## Wymagania
- Docker
- Docker Compose

## Uruchomienie bazy danych
1. Przejdź do folderu `database`
2. Uruchom komendę:
```bash
docker-compose up -d
```

## Dane dostępowe
- Host: localhost
- Port: 5433
- Baza danych: project_db
- Użytkownik: postgres
- Hasło: postgres

## Zatrzymanie bazy danych
```bash
docker-compose down
```

## Usunięcie danych
Jeśli chcesz usunąć wszystkie dane z bazy, wykonaj:
```bash
docker-compose down -v
``` 