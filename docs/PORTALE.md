# Portale istanze DR7 AI

Da `dr7ai.com/portale` si scrive il nome di un'azienda e nasce la sua
piattaforma: struttura identica a quella di produzione, **nessun dato di
nessun'altra azienda**, indirizzo `dr7ai.com/NOMEAZIENDA`.

## Come sono separate le aziende

Ogni azienda ha il **suo** progetto Supabase e il **suo** sito Netlify. Non
c'e' un database condiviso e non c'e' codice che decide "di chi sono questi
dati": due aziende non possono vedersi fra loro perche' non si toccano da
nessuna parte.

`dr7ai.com` non ospita le aziende, le **indirizza**. Una funzione di
frontiera (`netlify/edge-functions/tenant-proxy.ts`) guarda la prima parte
dell'indirizzo, cerca l'azienda nel registro e inoltra la richiesta al suo
sito togliendo il prefisso:

```
dr7ai.com/RENTCAGLIARI/assets/app.js  ->  sito-rentcagliari/assets/app.js
```

Il registro viene riletto ogni minuto: **aggiungere un'azienda non richiede
di ripubblicare dr7ai.com.**

## I dodici passi

| # | Passo | Cosa fa |
|---|---|---|
| 1 | Crea il database | Nuovo progetto Supabase. Se esiste gia' un progetto con quel nome lo riprende invece di crearne un secondo. |
| 2 | Aspetta che sia pronto | Un progetto nuovo impiega qualche minuto ad avviarsi. |
| 3 | Recupera le chiavi | Finiscono in `portal_instance_secrets`, che nessuna pagina puo' leggere. |
| 4 | Ricrea la struttura | 2.100 istruzioni: tabelle, funzioni, trigger, indici, sicurezza, permessi, archivio file. |
| 5 | Configurazione di partenza | Modelli di messaggio, impostazioni, centraline. Senza, il gestionale si apre vuoto e non manda niente. |
| 6 | Enti per le multe | Elenco pubblico degli enti notificatori. |
| 7 | Accesso del titolare | Utente + **scheda in `admins`**. Senza la seconda il login riesce e il gestionale rifiuta l'ingresso, senza spiegare perche'. |
| 8 | Crea il sito | Sito Netlify collegato al repository del gestionale. |
| 9 | Collega il sito al database | Variabili d'ambiente, compreso `VITE_BASE_PATH=/NOMEAZIENDA/`. |
| 10 | Compila e pubblica | Le variabili si congelano nel pacchetto: per questo ogni azienda ha il suo. |
| 11 | Aspetta la pubblicazione | |
| 12 | Apri l'indirizzo | L'azienda passa ad attiva e il proxy la serve. |

Ogni passo e' **ripetibile**: quello gia' riuscito non viene mai rifatto.
La creazione dura piu' di una chiamata, quindi la porta avanti una funzione
in sottofondo che un cron rimette al lavoro ogni due minuti finche' non ha
finito. Chiudere la pagina non interrompe niente.

## Cosa NON viene copiato

Clienti, prenotazioni, fatture, contratti, wallet, cauzioni, documenti
d'identita', log, e `service_secrets` (token API e password PEC).
L'azienda parte vuota e carica i suoi dati dal gestionale: i clienti anche
dall'**Importazione Massiva**, i veicoli dall'onglet **Veicoli**.

## L'identita' DR7 che viene tolta

Tre punti dello schema di produzione hanno indirizzi DR7 scritti dentro
(`dr7_is_direzione`, `dr7_can_see_all_acconti`, la policy
`operatore_contratto_direzione_all`). Al momento della creazione diventano
l'indirizzo del titolare: altrimenti l'azienda comprerebbe un gestionale in
cui la direzione e' ancora DR7.

L'elenco dei recapiti da togliere **non e' scritto nel codice**: lo ricava
`scripts/schema/aggiorna.py` cercando indirizzi, numeri e partite IVA dentro
funzioni, policy e modelli. Un recapito nuovo aggiunto in produzione viene
cosi' ripulito da solo, e questo repository pubblico non contiene nessun
recapito reale.

Nei modelli di messaggio si riscrive **solo il testo**. `message_key` e
`label` restano identici: il gestionale instrada gli invii per etichetta, e
rinominarle spegnerebbe i messaggi. Le menzioni rimaste (nomi commerciali
tipo "DR7 Club", "DR7 FLEX" dentro la Centralina) si cambiano dal gestionale,
e la scheda dell'azienda dice quante sono.

## Lo stampo della piattaforma

Quattro file in `schema/`, **fuori dal repository** perche' questo repository
e' pubblico e contengono lo schema completo della produzione e i modelli con
recapiti reali:

```
schema/statements.json            la struttura, istruzione per istruzione
schema/configurazione.json        messaggi, impostazioni, centraline
schema/enti_notificatori.json.gz  elenco enti
schema/identita.json              i recapiti DR7 da togliere
```

Si rigenerano **a ogni pubblicazione** di dr7ai.com, dal comando di
compilazione, quindi sono sempre allineati alla produzione. In locale:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export SUPABASE_PROD_REF=<ref della produzione>
python3 scripts/schema/aggiorna.py
```

Se mancano, la vetrina funziona lo stesso e il portale lo dice: non crea
aziende a meta'.

## Cosa serve perche' funzioni

Nel progetto Supabase del **portale**, eseguire
`supabase/migrations/20260831_portal.sql` e inserire il proprio indirizzo:

```sql
insert into public.portal_admins (email, nome) values ('tuo@indirizzo', 'Nome');
```

Variabili d'ambiente del sito dr7ai.com:

| Variabile | A cosa serve |
|---|---|
| `PORTAL_SUPABASE_URL` · `PORTAL_SUPABASE_SERVICE_ROLE_KEY` | Registro e proxy. |
| `PORTAL_SUPABASE_ANON_KEY` | Verifica del token di chi entra. |
| `VITE_PORTAL_SUPABASE_URL` · `VITE_PORTAL_SUPABASE_ANON_KEY` | Accesso dal browser. |
| `SUPABASE_ACCESS_TOKEN` · `SUPABASE_ORG_ID` | Creare i progetti delle aziende. |
| `SUPABASE_PROD_REF` | Rigenerare lo stampo a ogni pubblicazione. |
| `SUPABASE_PLAN` | `free` oppure il piano a pagamento. |
| `NETLIFY_API_TOKEN` · `NETLIFY_ACCOUNT_ID` | Creare i siti delle aziende. |
| `GESTIONALE_REPO` · `GESTIONALE_BRANCH` | Repository del gestionale (es. `DR7app/DR7-AI`, `main`). |

Queste tre chiavi — Supabase, Netlify, e la chiave di servizio del portale —
sono le piu' potenti che esistano in questa infrastruttura. Stanno solo nelle
variabili del sito, lato server. Nessuna passa mai dal browser e nessuna
finisce nell'audit: ogni testo scritto nel registro passa da `sanifica()`.

## Cosa il portale non fa, di proposito

- Non cancella progetti, database, aziende o dati.
- Non copia dati di clienti da un'azienda all'altra.
- Non mostra mai una chiave: dice solo se c'e'.
- Non salva la password del titolare. Il primo accesso si consegna con
  **Link di accesso**, che vale una volta sola e non viene registrato.
- Sospendere chiude l'indirizzo, non tocca i dati dell'azienda.

## Il gestionale sotto un indirizzo

Perche' la stessa base di codice possa vivere sia su un sito suo sia dentro
`dr7ai.com/NOMEAZIENDA`, nel repository del gestionale:

- `vite.config.ts` legge `VITE_BASE_PATH`;
- `BrowserRouter` usa `basename={import.meta.env.BASE_URL}`;
- `src/utils/basePath.ts` aggiunge il prefisso alle chiamate alle funzioni.
  Sono oltre quattrocento in un centinaio di file: si correggono in un punto
  solo, appena prima che la richiesta parta, invece di riscriverle una per una.
