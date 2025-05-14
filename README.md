# SIMASM – Estensione per il linguaggio Assembly di SIMCPU

Estensione per Visual Studio Code che fornisce **supporto completo al linguaggio SIMASM**, utilizzato nel simulatore SIMCPU dell'Università di Udine.

Questa estensione è pensata per studenti e docenti, e rende più chiara e produttiva la scrittura in assembly attraverso:

✅ **Evidenziazione della sintassi**  
✅ **Snippet rapidi per tutte le istruzioni**  
✅ **Tooltip descrittivi per ogni comando**  
✅ **Colorazione dei tipi di dato (`WORD`, `BYTE`)**  
✅ **Tema scuro personalizzato: “SIMCPU Syntax”**  

---

## ✨ Caratteristiche principali

- **Riconoscimento file**: supporto per `.asm` e `.axx`
- **Tokenizzazione avanzata**: separa correttamente istruzioni, registri, numeri e tipi
- **Snippet espandibili**: basta digitare `LDWA` o `ADD` e premere `Tab`
- **Tooltip**: posiziona il cursore su un’istruzione per vederne descrizione, parametri e comportamento
- **Tema colore incluso**: attivalo da `Preferenze → Tema Colore → SIMCPU Syntax`

---

## 🚀 Come iniziare

1. Installa l'estensione
2. Apri un file `.asm` o `.axx`
3. Digita un’istruzione (es. `LDBR`) e premi `Tab` per espandere lo snippet
4. Esplora i tooltip passando il mouse sulle istruzioni

> Per migliorare i suggerimenti, si consiglia di disattivare quelli basati sul documento:  
> `"editor.wordBasedSuggestions": false`

---

## 👨‍🏫 Pensata per l’uso didattico

Tutti i comandi sono documentati, con istruzioni divise per gruppo (trasferimento dati, aritmetica, controllo, I/O) e dettagli sui flag (`Z`, `N`, `C`, `V`) modificati.

Basata sul lavoro originale di **Pier Luca Montessoro** per il simulatore SIMCPU.  
Email: montessoro@uniud.it — Web: [www.montessoro.it](http://www.montessoro.it)

---

## 🧾 Licenza

Freeware e Open Source. È possibile usarla e modificarla liberamente **a patto di mantenere questa nota**:

---

© 2001 Pier Luca Montessoro – University of Udine

---

👉 Perfetta per corsi di Architettura degli Elaboratori o Sistemi Digitali.
