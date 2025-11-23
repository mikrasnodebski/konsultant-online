# System Konsultacji Online

## Opis Projektu
Celem pracy jest stworzenie aplikacji webowej dla osób prowadzących konsultacje online (specjalistów z różnych branż – psychologii, doradztwa zawodowego, marketingu, finansów, dietetyki czy fitnessu) łączącej wszystkie niezbędne narzędzia w jednym miejscu (kalendarz, profile klientów, komunikator, zarządzanie płatnościami).

## Podobne Rozwiązania na Rynku
Jednym z podobnych rozwiązań dostępnych na rynku jest [naffy.io](https://naffy.io) - platforma oferująca kompleksowe narzędzia do prowadzenia konsultacji online.

## Technologie
W projekcie wykorzystane zostaną następujące technologie:
- Frontend: Next.js z TypeScript
- Backend: NestJS
- Baza danych: PostgreSQL
- ORM: Prisma
- Autentykacja: JWT (JSON Web Tokens)

## Struktura Panelu
Panel konsultanta zawiera następujące funkcjonalności:

### Mój Profil
- Edycja własnego profilu konsultanta
- Zarządzanie oferowanymi produktami/usługami
- Personalizacja wyglądu i treści profilu

### Produkty/Usługi
- Dodawanie nowych produktów/usług
- Zarządzanie istniejącymi ofertami
- Ustawianie cen i opisów

### Sprzedaż
- Statystyki sprzedanych produktów/usług
- Raporty sprzedażowe
- Analiza efektywności

### Klienci
- Lista aktualnych klientów
- Podział na leady i stałych klientów
- Historia współpracy
- Zarządzanie danymi klientów

### Kalendarz
- Zarządzanie terminami spotkań online
- Oznaczanie statusu płatności
- Przypomnienia i powiadomienia
- Synchronizacja z zewnętrznymi kalendarzami

### Konwersacje
- Wbudowany komunikator tekstowy
- Komunikator wideo
- Historia rozmów
- Bezpośrednia komunikacja z klientami bez konieczności używania zewnętrznych rozwiązań

## Najbliższe Kroki
1. Implementacja systemu autentykacji:
   - Stworzenie strony logowania i rejestracji
   - Implementacja mechanizmu JWT do zarządzania sesjami
   - Zabezpieczenie odpowiednich ścieżek w aplikacji
   - Stworzenie wstępnego designu panelu użytkownika

## Wymagania Projektowe
Projekt wymaga:
1. Przeprowadzenia analizy podobnych rozwiązań na rynku
2. Określenia wymagań funkcjonalnych i niefunkcjonalnych
3. Ustalenia priorytetów implementacji
4. Zaprojektowania architektury aplikacji
5. Wyboru odpowiedniego stosu technologicznego
6. Implementacji systemu zgodnie z ustalonymi priorytetami
7. Przeprowadzenia testów funkcjonalnych

## Struktura Projektu
```
/
├── frontend/           # Aplikacja Next.js
│   ├── app/           # Główny katalog aplikacji
│   ├── public/        # Statyczne pliki
│   └── ...
├── backend/           # Serwer NestJS
│   ├── src/           # Kod źródłowy
│   ├── prisma/        # Konfiguracja i migracje Prisma
│   └── ...
└── database/          # Skrypty i migracje bazy danych
``` 