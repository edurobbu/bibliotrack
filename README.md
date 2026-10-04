# La mia biblioteca

Un tracker di lettura statico, pensato per GitHub Pages. Non richiede compilazione, installazioni o server: basta pubblicare i file di questa cartella.

## Funzioni

- Ricerca simultanea su Open Library e Google Books, anche per autore, con metadati, ISBN, copertine, anno, editore e numero di pagine quando disponibili. I risultati della stessa edizione vengono uniti tramite ISBN.
- Aggiunta di libri dalla ricerca o inserimento manuale.
- Libreria filtrabile per stato: in lettura, da leggere e completati.
- Aggiornamento delle pagine lette e barre di progresso.
- Timer Pomodoro da 25, 35 o 45 minuti, con avvio, pausa, ripresa e azzeramento.
- Salvataggio automatico nel browser tramite `localStorage`.
- Layout adattabile a desktop, tablet e telefono.

## Pubblicazione su GitHub Pages

1. Crea un repository GitHub e carica `index.html`, `styles.css`, `app.js` e questo `README.md` nella cartella principale.
2. In GitHub apri **Settings → Pages**.
3. In **Build and deployment**, seleziona **Deploy from a branch**, scegli `main` e `/(root)`, poi premi **Save**.
4. Dopo la pubblicazione, apri l'indirizzo Pages mostrato nella stessa sezione.

La ricerca online richiede una connessione a Internet e interroga Open Library e Google Books in tempo reale. I metadati disponibili e le copertine variano in base all’edizione presente nei cataloghi. I libri salvati rimangono nel browser e nel dispositivo in cui li hai aggiunti; per ora non vengono sincronizzati tra dispositivi.
