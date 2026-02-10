# RBR Light — Catalogo online (statico)

Questa cartella contiene un mini-sito statico che legge i dati da `data.json` (generato dal tuo Excel).

## Struttura
- `index.html` — pagina del catalogo
- `style.css` — stile
- `app.js` — logica di ricerca/filtri/scheda prodotto
- `data.json` — dati esportati da Excel

## Come aggiungere foto
Nel file Excel puoi mettere nella colonna **Photo**:
- un URL completo (https://...), oppure
- un percorso relativo tipo `assets/nomefile.jpg`

Se usi `assets/...`, crea una cartella `assets` e carica lì le immagini.

## Pubblicazione rapida (due opzioni)
### A) GitHub Pages (gratis)
1. Crea un repository su GitHub (es. `rbr-catalogo`)
2. Carica questi file nel repository (incluse eventuali immagini in `assets/`)
3. In *Settings → Pages*, abilita Pages su branch `main` (root)
4. Ti verrà dato un link pubblico

### B) Netlify (gratis)
1. Crea un account Netlify
2. Drag&drop della cartella (o dello zip) in Netlify
3. Il sito va online in pochi secondi

## Aggiornare i dati
Rigenera `data.json` dall'Excel (oppure aggiornalo direttamente).
