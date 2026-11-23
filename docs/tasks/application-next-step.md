# Application next step and deadline

## Intent and acceptance

Compare whether candidates and employers can identify who acts next, what they should do, and when. The selected Supersprint idea is “Następny krok i termin przy zgłoszeniu”.

- Both roles see the same saved deadline and event history on the existing application record. A candidate does not see employer notes or editing controls.
- The owner company can change the deadline and use existing stage actions to invite or end the process. Advancing the stage clears the deadline assigned to the previous step.
- `?wariant=status` shows the same record and history with the next-step panel hidden. The parameter survives navigation between list and record.
- The local scenario includes one Build publication and three of its applications. Existing browser data is preserved when adding the sample records.

## Dane scenariusza

Źródła to `applications.csv` i `publications.csv` w katalogu danych projektu. Połączenie po `publication_id` daje ofertę `pub-000001` firmy Splot Operacje oraz trzy zgłoszenia z decyzją `hold`. Z plików pochodzą treść oferty, odpowiedzi, treści profili, wyniki dopasowania (zaokrąglone do procentu) i czasy złożenia oraz selekcji. Zdarzenie selekcji jest widoczne w historii jako „Aplikacja przejrzana”. Imiona, nazwa stanowiska i przyszłe terminy to elementy scenariusza. Oferta pozostaje historyczna, zgodnie z datą wygaśnięcia.

| Zgłoszenie   | Osoba          | Termin testowy |
| ------------ | -------------- | -------------- |
| `app-029542` | Maja Zielińska | 24.11.2026     |
| `app-028169` | Oskar Nowak    | 25.11.2026     |
| `app-028666` | Lena Wójcik    | 04.12.2026     |

## Scenariusz testu

1. Otwórz [wybór osoby](http://127.0.0.1:3001/#/auth/sign-in). Wybierz Igę Kamińską i otwórz [Kandydatów](http://127.0.0.1:3001/#/app/kandydaci). Powiedz uczestnikowi, że w scenariuszu jest 23 listopada. Zapytaj, którym zgłoszeniem zajmie się najpierw, co zrobi i do kiedy. Zapisz odpowiedź przed jakąkolwiek podpowiedzią.
2. Porównaj [listę bez terminów](http://127.0.0.1:3001/#/app/kandydaci?wariant=status) z listą z terminami. W szczegółach użyj Mai i Oskara jako pary porównawczej. Zmieniaj kolejność wariantów i przypisanie zgłoszeń między osobami.
3. Zmień osobę na Maję lub Oskara. Porównaj kartę [z następnym krokiem](http://127.0.0.1:3001/#/app/aplikacje/app-029542) z kartą [z samym statusem](http://127.0.0.1:3001/#/app/aplikacje/app-028169?wariant=status). Dopasuj wybrany profil do otwartego zgłoszenia. Poproś uczestnika, żeby własnymi słowami powiedział, kto ma zadziałać, co zrobi i do kiedy.
4. Po zadaniu porównawczym, jako Iga zmień termin Mai i zapisz. Przełącz się na Maję i sprawdź datę na aplikacji. W osobnej sesji możesz jako Iga zapisać zaproszenie lub zakończenie procesu. Zaproszenia i zmiany istnieją w lokalnym prototypie.
5. Dla każdej roli i wariantu zapisz poprawne odpowiedzi / ukończone zadania, powroty do historii oraz błędne interpretacje. W wariancie z panelem poprawna odpowiedź dla Mai to „pracodawca do 24 listopada da znać, czy zaprosi na rozmowę”. W kontroli termin jest niedostępny. Do porównania użyj świeżego profilu przeglądarki, jeżeli wcześniej zmieniano scenariusz.

## Verification

Type checking, lint, 28 unit tests and production build passed. An isolated Chrome session verified both roles, the comparison variant, cross-role deadline persistence, history focus, stage progression and reflow at 390px and 320px. The existing browser suite passed 32/34 tests in installed Chrome. The other two counted internal requests from Chrome's PDF viewer as external. Prettier with automatic line-ending detection passed. The reference checksum and baseline packaging passed on an archive extracted with Git's Windows CRLF conversion disabled. The packaged scenario fixture was empty.
