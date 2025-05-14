# SIMASM – Estensione per il linguaggio Assembly di SIMCPU

Estensione per Visual Studio Code che fornisce **supporto completo al linguaggio SIMASM**, utilizzato nel simulatore SIMCPU dell'Università di Udine.

Questa estensione è pensata per studenti e docenti, e rende più chiara e produttiva la scrittura in assembly attraverso:

✅ **Evidenziazione della sintassi**  
✅ **Snippet rapidi per tutte le istruzioni**  
✅ **Tooltip descrittivi per ogni comando**   
✅ **Tema scuro personalizzato: “SIMCPU Syntax”**  

---

## ✨ Caratteristiche principali

- **Riconoscimento file**: supporto per `.axx`
- **Tokenizzazione avanzata**: separa correttamente istruzioni, registri, numeri e tipi
- **Snippet espandibili**: basta digitare l'istruzione e premere `Tab`
- **Tema colore incluso**: attivalo da `Preferenze → Tema Colore → SIMCPU Syntax`

---

## 🚀 Come iniziare

1. Installa l'estensione
2. Apri un file `.axx`
3. Digita un’istruzione (es. `LDBR`) e premi `Tab` per espandere lo snippet

> Per migliorare i suggerimenti, si consiglia di disattivare quelli basati sul documento:  
> `"editor.wordBasedSuggestions": false`

---

## 🧩 Come funziona la formattazione

La formattazione del codice SIMASM avviene automaticamente quando attivi il comando **"Format Document"** (`Shift+Alt+F` oppure clic destro → "Format Document").

L’estensione suddivide ogni riga del codice nei seguenti componenti:

- **Etichetta**: facoltativa, deve terminare con `:`
- **Istruzione**: ad esempio `LOAD`, `STORE`, `JMP`, ecc.
- **Operandi**: uno o due operandi (es. `A`, `0xFF`, `label`)
- **Commento**: qualsiasi testo dopo `;`, anche da solo

Ogni sezione viene **allineata automaticamente** in base alla larghezza massima trovata nel documento, rendendo il codice più leggibile.

### 🔄 Cambiare modalità di formattazione

SIMASM Formatter supporta due modalità di formattazione:

- **Full**: colonne larghe e ben allineate per massima leggibilità
- **Compact**: formato più compatto, meno spazi ma comunque leggibile

Puoi **cambiare modalità** in qualsiasi momento utilizzando il comando:

```text
SIMASM: Toggle Formatting Mode
```

📥 Come eseguire il comando

1. Apri la Command Palette (Ctrl+Shift+P o Cmd+Shift+P su macOS)

2. Cerca: SIMASM: Toggle Formatting Style

3. Premi Invio per alternare tra FULL e COMPACT

Riceverai una notifica con la modalità attiva:

```text
Formato SIMASM: FULL
```

oppure

```text
Formato SIMASM: COMPACT
```

La modalità selezionata viene salvata automaticamente e sarà applicata a tutti i file successivi.

💡 Consiglio: Puoi anche associare una scorciatoia da tastiera personalizzata a questo comando andando in
`File → Preferences → Keyboard Shortcuts` e cercando `extension.toggleFormattingStyle`.


---

### ✅ Esempio prima/dopo

#### 🔹 Prima

```asm
init:   LOAD A 0x10   ; inizializza A
        STORE A result
        ; questo è un commento solitario
end:    HALT
```

🔹 Dopo la formattazione (modalità Full)

```asm
init:   LOAD     A       0x10       ; inizializza A
        STORE    A       result     
; questo è un commento solitario
end:    HALT                       
```

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
