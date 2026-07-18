# Jak u Mamy — stołówka i dostawy

Aplikacja Next.js do publicznego wyświetlania menu, planowania dostaw i obsługi tras kierowców. Panel administratora korzysta z sesji HTTP-only oraz z tokenu Firebase wydawanego wyłącznie po autoryzacji na serwerze.

## Uruchomienie lokalne

1. Skopiuj `.env.example` jako `.env.local` i ustaw wszystkie wartości.
2. W Firebase utwórz projekt z Firestore i wygeneruj konto usługi; jego dane wpisz do trzech zmiennych `FIREBASE_ADMIN_*`.
3. W konsoli Firebase Authentication włącz usługę Authentication. Tokeny niestandardowe nie wymagają żadnego dostawcy logowania.
4. Wklej reguły z [firestore.rules](firestore.rules) do **Firestore Database → Rules** i opublikuj je.
5. Zainstaluj zależności i uruchom aplikację:

```bash
npm ci
npm run dev
```

Adres lokalny: `http://localhost:3000`.

## Kontrole przed wdrożeniem

```bash
npm run lint
npm run build
```

Oba polecenia muszą zakończyć się powodzeniem. Nie zapisuj `.env.local`, klucza konta usługi ani haseł w repozytorium.

## Wdrożenie Docker

Obraz jest przygotowany do samodzielnego hostowania:

```bash
docker build -t jak-u-mamy .
docker run --env-file .env.local -p 3000:3000 jak-u-mamy
```

Przed wystawieniem aplikacji publicznie ustaw HTTPS w reverse proxy (np. Nginx, Caddy albo panel hostingu). Produkcyjne ciasteczka sesyjne są wtedy oznaczone jako `Secure`.

## Zmienne środowiskowe

| Zmienna | Zastosowanie |
| --- | --- |
| `ADMIN_PASSWORD` | hasło administratora |
| `ADMIN_SESSION_SECRET` | podpis sesji administratora |
| `DRIVER_SESSION_SECRET` | podpis sesji kierowców |
| `FIREBASE_ADMIN_PROJECT_ID` | identyfikator projektu Firebase |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | e-mail konta usługi Firebase |
| `FIREBASE_ADMIN_PRIVATE_KEY` | klucz prywatny konta usługi Firebase |

Nie używaj `NEXT_PUBLIC_` dla haseł ani sekretów.
