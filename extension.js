const vscode = require('vscode');

// Riferimento globale al pannello flowchart
let flowchartPanel = null;

let formattingStyle = 'full';

// Dizionario istruzioni SIMASM con descrizioni in italiano
const instructionDocs = {
   LDWI: { description: 'Carica un word immediato nel registro R.', arguments: 'R, valore', machineCode: '00010000dddd0000 DATA(16)', flags: 'Z, N' },
   LDWA: { description: 'Carica un word da memoria al registro R.', arguments: 'R, indirizzo', machineCode: '00100000dddd0000 ADDR(16)', flags: 'Z, N' },
   LDWR: { description: 'Carica un word dall’indirizzo in R2 nel registro R1.', arguments: 'R1, R2', machineCode: '00110000ddddaaaa', flags: 'Z, N' },
   LDBI: { description: 'Carica un byte immediato nel registro R.', arguments: 'R, valore', machineCode: '00010001dddd0000 DATA(8) ', flags: 'Z' },
   LDBA: { description: 'Carica un byte da memoria nel registro R.', arguments: 'R, indirizzo', machineCode: '00100001dddd0000 ADDR(16)', flags: 'Z' },
   LDBR: { description: 'Carica un byte dall’indirizzo in R2 nel registro R1.', arguments: 'R1, R2', machineCode: '00110001ddddaaaa', flags: 'Z' },
   STWA: { description: 'Salva un word da R nella memoria.', arguments: 'R, indirizzo', machineCode: '00100010ssss0000 ADDR(16)', flags: 'nessuna' },
   STWR: { description: 'Salva un word da R1 all’indirizzo in R2.', arguments: 'R1, R2', machineCode: '00110010ssssaaaa', flags: 'nessuna' },
   STBA: { description: 'Salva un byte da R nella memoria.', arguments: 'R, indirizzo', machineCode: '00100011ssss0000 ADDR(16)', flags: 'nessuna' },
   STBR: { description: 'Salva un byte da R1 all’indirizzo in R2.', arguments: 'R1, R2', machineCode: '00110011ssssaaaa', flags: 'nessuna' },
   MV: { description: 'Copia R2 in R1.', arguments: 'R1, R2', machineCode: '00000100ssssdddd', flags: 'Z, N' },
   PUSH: { description: 'Inserisce il valore di R nello stack.', arguments: 'R', machineCode: '00001000ssss0000', flags: 'nessuna' },
   POP: { description: 'Estrae un valore dallo stack in R.', arguments: 'R', machineCode: '00001001dddd0000', flags: 'Z, N' },
   SPRD: { description: 'Copia SP in R.', arguments: 'R', machineCode: '00001101dddd0000', flags: 'Z, N' },
   SPWR: { description: 'Scrive R nello stack pointer.', arguments: 'R', machineCode: '00001110ssss0000', flags: 'nessuna' },
   ADD: { description: 'R1 ← R1 + R2.', arguments: 'R1, R2', machineCode: '01000000ssssdddd', flags: 'Z, N, C, V' },
   SUB: { description: 'R1 ← R1 - R2.', arguments: 'R1, R2', machineCode: '01000001ssssdddd', flags: 'Z, N, C, V' },
   NOT: { description: 'Inverte i bit di R.', arguments: 'R', machineCode: '01000010rrrr0000', flags: 'Z, N; C e V azzerati' },
   AND: { description: 'Bitwise AND tra R1 e R2.', arguments: 'R1, R2', machineCode: '01000011ssssdddd', flags: 'Z, N; C e V azzerati' },
   OR: { description: 'Bitwise OR tra R1 e R2.', arguments: 'R1, R2', machineCode: '01000100ssssdddd', flags: 'Z, N; C e V azzerati' },
   XOR: { description: 'Bitwise XOR tra R1 e R2.', arguments: 'R1, R2', machineCode: '01000101ssssdddd', flags: 'Z, N; C e V azzerati' },
   INC: { description: 'Incrementa R.', arguments: 'R', machineCode: '01001000rrrr0000', flags: 'Z, N, C, V' },
   DEC: { description: 'Decrementa R.', arguments: 'R', machineCode: '01001001rrrr0000', flags: 'Z, N, C, V' },
   LSH: { description: 'Shift logico sinistro.', arguments: 'R', machineCode: '01001010rrrr0000', flags: 'Z, N, C; V azzerato' },
   RSH: { description: 'Shift logico destro.', arguments: 'R', machineCode: '01001011rrrr0000', flags: 'Z, N, C; V azzerato' },
   INW: { description: 'Input word da porta A in R.', arguments: 'R, A', machineCode: '10000000dddd0000 IN_ADDR(16) ', flags: 'Z, N' },
   INB: { description: 'Input byte da porta A in R.', arguments: 'R, A', machineCode: '10000001dddd0000 IN_ADDR(16) ', flags: 'Z, N' },
   OUTW: { description: 'Output word da R alla porta A.', arguments: 'R, A', machineCode: '10000010ssss0000 OUT_ADDR(16)', flags: 'nessuna' },
   OUTB: { description: 'Output byte da R alla porta A.', arguments: 'R, A', machineCode: '10000011ssss0000 OUT_ADDR(16)', flags: 'nessuna' },
   TSTI: { description: 'Test input pronto su porta A.', arguments: 'A', machineCode: '1000010000000000 IN_ADDR(16) ', flags: 'Z' },
   TSTO: { description: 'Test output pronto su porta A.', arguments: 'A', machineCode: '1000010100000000 OUT_ADDR(16)', flags: 'Z' },
   BR: { description: 'Salta all’indirizzo assoluto.', arguments: 'indirizzo', machineCode: '1100000000000000 ADDR(16)', flags: 'nessuna' },
   JMP: { description: 'Salta relativo (PC + offset).', arguments: 'offset', machineCode: '11000001FFFFFFFF', flags: 'nessuna' },
   JMPZ: { description: 'Salta se Z = 1.', arguments: 'offset', machineCode: '11000010FFFFFFFF', flags: 'nessuna' },
   JMPNZ: { description: 'Salta se Z = 0.', arguments: 'offset', machineCode: '11000011FFFFFFFF', flags: 'nessuna' },
   JMPN: { description: 'Salta se N = 1.', arguments: 'offset', machineCode: '11000100FFFFFFFF', flags: 'nessuna' },
   JMPNN: { description: 'Salta se N = 0.', arguments: 'offset', machineCode: '11000101FFFFFFFF', flags: 'nessuna' },
   JMPC: { description: 'Salta se C = 1.', arguments: 'offset', machineCode: '11000110FFFFFFFF', flags: 'nessuna' },
   JMPV: { description: 'Salta se V = 1.', arguments: 'offset', machineCode: '11000111FFFFFFFF', flags: 'nessuna' },
   CALL: { description: 'Salva PC e salta a subroutine.', arguments: 'indirizzo', machineCode: '1100100000000000 ADDR(16)', flags: 'nessuna' },
   RET: { description: 'Ritorna da subroutine (PC ← pop).', arguments: '', machineCode: '1100100100000000', flags: 'nessuna' },
   HLT: { description: 'Ferma l’esecuzione del programma.', arguments: '', machineCode: '1100111100000000', flags: 'nessuna' }
};



function getFormattingStyle(context) {
   return context.globalState.get('formattingStyle', 'full');
}

function setFormattingStyle(context, value) {
   context.globalState.update('formattingStyle', value);
   formattingStyle = value;
}

// Comando per aprire la tabella delle istruzioni
function openInstructionsPanel(context) {
   const panel = vscode.window.createWebviewPanel(
      'simasm.instructions', // Identificatore del webview
      'Istruzioni SIMASM',   // Titolo del pannello
      vscode.ViewColumn.One, // Colonna in cui visualizzare il webview
      {}                     // Opzioni del webview
   );

   // Definisci le categorie di istruzioni
   const categories = {
      'Gruppo trasferimento dati': ['LDWI', 'LDWA', 'LDWR', 'LDBI', 'LDBA', 'LDBR', 'STWA', 'STWR', 'STBA', 'STBR', 'MV', 'PUSH', 'POP', 'SPRD', 'SPWR'],
      'Gruppo aritmetico-logiche': ['ADD', 'SUB', 'NOT', 'AND', 'OR', 'XOR', 'INC', 'DEC', 'LSH', 'RSH'],
      'Gruppo I/O': ['INW', 'INB', 'OUTW', 'OUTB', 'TSTI', 'TSTO'],
      'Gruppo di controllo del flusso': ['BR', 'JMP', 'JMPZ', 'JMPNZ', 'JMPN', 'JMPNN', 'JMPC', 'JMPV', 'CALL', 'RET', 'HLT']
   };

   // Genera le righe della tabella con le intestazioni di categoria
   let tableRows = '';
   for (const [category, instructions] of Object.entries(categories)) {
      // Aggiungi l'intestazione della categoria
      tableRows += `
         <tr class="category-header">
            <td colspan="5">${category}</td>
         </tr>
      `;

      // Aggiungi le righe per ogni istruzione nella categoria
      for (const inst of instructions) {
         const { description, arguments: args, machineCode, flags } = instructionDocs[inst];
         tableRows += `
            <tr>
               <td>${inst}</td>
               <td>${description}</td>
               <td>${args}</td>
               <td>${machineCode}</td>
               <td>${flags}</td>
            </tr>
         `;
      }
   }

   panel.webview.html = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Istruzioni SIMASM</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: rgb(31, 138, 210);
          color: white;
        }
        tr:hover {
          background-color: rgba(200, 200, 200, 0.2);
        }
        .category-header {
          background-color: rgb(100, 180, 230);
          color: white;
          font-weight: bold;
          text-align: center;
        }
        .category-header td {
          padding: 6px;
        }
        .category-header:hover {
          background-color: rgb(80, 160, 210);
        }
      </style>
    </head>
    <body>
      <h1>Istruzioni SIMASM</h1>
      <table>
        <thead>
          <tr>
            <th>Istruzione</th>
            <th>Descrizione</th>
            <th>Argomenti</th>
            <th>Codice Macchina</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

/**
 * Fornisce i simboli del documento (etichette, sezioni) per l'Outline View
 */
class SimasmDocumentSymbolProvider {
   provideDocumentSymbols(document, token) {
      const symbols = [];
      let currentSection = null;

      // Analizza il documento linea per linea
      for (let i = 0; i < document.lineCount; i++) {
         const line = document.lineAt(i);
         const text = line.text.trim();

         // Ignora linee vuote
         if (text === '') continue;

         // Rileva commenti di sezione (es. "; --- DATA SECTION ---")
         const sectionMatch = text.match(/;\s*---\s*(.*?)\s*---/);
         if (sectionMatch) {
            const sectionName = sectionMatch[1];
            const range = new vscode.Range(line.lineNumber, 0, line.lineNumber, line.text.length);

            currentSection = new vscode.DocumentSymbol(
               sectionName,
               'Sezione',
               vscode.SymbolKind.Module,
               range,
               range
            );
            symbols.push(currentSection);
            continue;
         }

         // Rileva etichette (es. "label:")
         const labelMatch = text.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
         if (labelMatch) {
            const labelName = labelMatch[1];
            const range = new vscode.Range(line.lineNumber, 0, line.lineNumber, line.text.length);

            const labelSymbol = new vscode.DocumentSymbol(
               labelName,
               'Etichetta',
               vscode.SymbolKind.Function,
               range,
               range
            );

            // Aggiungi l'etichetta alla sezione corrente o direttamente all'elenco principale
            if (currentSection) {
               currentSection.children.push(labelSymbol);
            } else {
               symbols.push(labelSymbol);
            }
            continue;
         }

         // Rileva direttive per definizione dati (es. "word" o "byte")
         const dataMatch = text.match(/^(word|byte)\s+/i);
         if (dataMatch) {
            const dataType = dataMatch[1];
            const range = new vscode.Range(line.lineNumber, 0, line.lineNumber, line.text.length);

            const dataSymbol = new vscode.DocumentSymbol(
               `${dataType.toUpperCase()}`,
               'Dato',
               vscode.SymbolKind.Variable,
               range,
               range
            );

            // Aggiungi la definizione dati alla sezione corrente o direttamente all'elenco principale
            if (currentSection) {
               currentSection.children.push(dataSymbol);
            } else {
               symbols.push(dataSymbol);
            }
         }
      }

      return symbols;
   }
}

function activate(context) {
   console.log('Estensione SIMASM attivata.');

   formattingStyle = getFormattingStyle(context);

   // Formatter
   const provider = {
      provideDocumentFormattingEdits(document) {
         console.log(`Formattazione con stile: ${formattingStyle}`);
         const edits = [];
         const lines = [];

         for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const raw = line.text;

            let label = '', inst = '', op1 = '', op2 = '', comment = '';

            // Gestione speciale per righe che sono interamente commenti
            if (/^\s*;/.test(raw)) {
               // Se inizia con punto e virgola, è un commento
               comment = raw.trim();
            } else {
               // Prima separa la parte di codice dal commento
               const commentIndex = raw.indexOf(';');
               const codePart = commentIndex >= 0 ? raw.substring(0, commentIndex).trim() : raw.trim();
               comment = commentIndex >= 0 ? raw.substring(commentIndex).trim() : '';

               // Poi analizza la parte del codice
               if (codePart) {
                  const match = codePart.match(/^\s*([A-Za-z_][\w]*:)?\s*(\S+)?(?:\s+(\S+))?(?:\s+(\S+))?$/);
                  label = match?.[1]?.trim() || '';
                  inst = match?.[2]?.trim() || '';
                  op1 = match?.[3]?.trim() || '';
                  op2 = match?.[4]?.trim() || '';
               }
            }

            lines.push({ line, label, inst, op1, op2, comment });
         }

         const labelWidth = Math.max(...lines.map(l => l.label.length));
         const instWidth = Math.max(...lines.map (l => l.inst.length));
         const op1Width = Math.max(...lines.map(l => l.op1.length));
         const op2Width = Math.max(...lines.map(l => l.op2.length));

         const codeWidths = lines.map(({ label, inst, op1, op2 }) => {
            let code = '';
            if (formattingStyle === 'full') {
               code += label.padEnd(labelWidth + 2);
               code += inst.padEnd(instWidth + 2);
               code += op1.padEnd(op1Width + 2);
               code += op2.padEnd(op2Width + 2);
            } else {
               code += (label ? label.padEnd(labelWidth + 2) : ' '.repeat(labelWidth + 2));
               code += inst.padEnd(instWidth + 2);
               code += op1 ? op1 + ' ' : '';
               code += op2 ? op2 + ' ' : '';
            }
            return code.trimEnd().length;
         });

         const maxCodeWidth = Math.max(...codeWidths);

         for (const { line, label, inst, op1, op2, comment } of lines) {
            let formatted = '';

            // Handle special comment cases
            if (/^;;/.test(comment) && !label && !inst && !op1 && !op2) {
               // Solo per righe che contengono SOLO commenti che iniziano con ;;
               formatted = comment;
            } else if (comment && !label && !inst && !op1 && !op2) {
               // Allinea tutti i commenti singoli (incluso solo ;) con maxCodeWidth
               formatted = ' '.repeat(maxCodeWidth + 2) + comment;
            } else {
               let codePart = '';
               if (formattingStyle === 'full') {
                  codePart += label.padEnd(labelWidth + 2);
                  codePart += inst.padEnd(instWidth + 2);
                  codePart += op1.padEnd(op1Width + 2);
                  codePart += op2.padEnd(op2Width + 2);
               } else {
                  codePart += (label ? label.padEnd(labelWidth + 2) : ' '.repeat(labelWidth + 2));
                  codePart += inst.padEnd(instWidth + 2);
                  codePart += op1 ? op1 + ' ' : '';
                  codePart += op2 ? op2 + ' ' : '';
               }

               codePart = codePart.trimEnd();

               if (comment) {
                  const padding = maxCodeWidth - codePart.length + 2;
                  formatted = codePart + ' '.repeat(padding) + comment;
               } else {
                  formatted = codePart;
               }
            }

            edits.push(vscode.TextEdit.replace(line.range, formatted.trimEnd()));
         }

         return edits;
      }
   };

   context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider('simasm', provider)
   );

   // Comando per cambiare stile
   context.subscriptions.push(
      vscode.commands.registerCommand('extension.toggleFormattingStyle', () => {
         formattingStyle = formattingStyle === 'full' ? 'compact' : 'full';
         setFormattingStyle(context, formattingStyle);
         vscode.window.showInformationMessage(`Stile di formattazione: ${formattingStyle.toUpperCase()}`);
      })
   );

   // Hover tooltip
   const hoverProvider = vscode.languages.registerHoverProvider('simasm', {
      provideHover(document, position, token) {
         const wordRange = document.getWordRangeAtPosition(position, /\b[A-Z]+\b/);
         if (!wordRange) return;

         const word = document.getText(wordRange).toUpperCase();
         const doc = instructionDocs[word];
         if (doc) {
            return new vscode.Hover(`**${word}** — ${doc.description}\n\n**Argomenti:** ${doc.arguments}\n**Flag:** ${doc.flags}`);
         }

      }
   });

   context.subscriptions.push(hoverProvider);

   // Comando per aprire la tabella delle istruzioni
   context.subscriptions.push(
      vscode.commands.registerCommand('extension.showInstructions', () => {
         openInstructionsPanel(context);
      })
   );

   // Definition Provider
   const definitionProvider = vscode.languages.registerDefinitionProvider('simasm', {
      provideDefinition(document, position, token) {
         const wordRange = document.getWordRangeAtPosition(position, /\b[A-Za-z_][\w]*\b/);
         if (!wordRange) return;

         const word = document.getText(wordRange);
         const text = document.getText();

         // Cerca la definizione dell'etichetta (es. "label:")
         const labelRegex = new RegExp(`^\\s*(${word}):`, 'gm');
         let match;
         while ((match = labelRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            return new vscode.Location(document.uri, new vscode.Range(startPos, endPos));
         }

         return null;
      }
   });

   context.subscriptions.push(definitionProvider);

   // Registra il provider per l'Outline View
   const documentSymbolProvider = vscode.languages.registerDocumentSymbolProvider(
      'simasm',
      new SimasmDocumentSymbolProvider()
   );

   context.subscriptions.push(documentSymbolProvider);

   // Funzione per visualizzare il flow chart del codice
   function showFlowChart() {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'simasm') {
         vscode.window.showInformationMessage('Apri un file SIMASM prima di visualizzare il flow chart');
         return;
      }

      const document = editor.document;
      // Riutilizza il pannello esistente o creane uno nuovo
      if (flowchartPanel) {
         flowchartPanel.reveal(vscode.ViewColumn.Two);
      } else {
         // Crea un WebView per visualizzare il flowchart
         flowchartPanel = vscode.window.createWebviewPanel(
            'simasm.flowchart',
            'SIMASM Flow Chart',
            vscode.ViewColumn.Two,
            {
               enableScripts: true,
               retainContextWhenHidden: true
            }
         );

         // Gestisci evento di chiusura del pannello
         flowchartPanel.onDidDispose(() => {
            flowchartPanel = null;
         }, null, context.subscriptions);
      }

      // Aggiorna il flow chart con i dati attuali
      updateFlowChart(document);
   }

   function updateFlowChart(document) {
      if (!flowchartPanel) return;

      const text = document.getText();
      const lines = text.split('\n');

      // Trova tutte le sezioni
      const sections = [];
      let currentSection = null;

      // Prima passa: identifica tutte le sezioni
      for (let i = 0; i < lines.length; i++) {
         const line = lines[i];
         const sectionMatch = line.match(/;\s*---\s*(.*?)\s*---/);

         if (sectionMatch) {
            const sectionName = sectionMatch[1];

            // Chiudi la sezione precedente
            if (currentSection) {
               currentSection.endLine = i - 1;
            }

            // Crea una nuova sezione
            currentSection = {
               name: sectionName,
               line: i,
               startLine: i + 1, // Inizia dalla riga dopo il commento
               endLine: lines.length - 1, // Temporaneamente fino alla fine del file
               content: ""
            };

            sections.push(currentSection);
         }
      }

      // Seconda passa: estrai il contenuto di ogni sezione
      for (let i = 0; i < sections.length; i++) {
         const section = sections[i];
         // Imposta l'endLine corretto basato sulla prossima sezione
         if (i < sections.length - 1) {
            section.endLine = sections[i + 1].line - 1;
         }
         const sectionLines = lines.slice(section.startLine, section.endLine + 1);
         section.content = sectionLines.join('\n');
      }

      if (sections.length === 0) {
         flowchartPanel.webview.html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
               <meta charset="UTF-8">
               <title>SIMASM Flow Chart</title>
               <style>
                  body { 
                     font-family: Arial, sans-serif; 
                     padding: 20px;
                     text-align: center;
                  }
               </style>
            </head>
            <body>
               <h1>Nessuna sezione trovata</h1>
               <p>Aggiorna commenti con formato "; --- NOME SEZIONE ---" per visualizzare il flow chart.</p>
            </body>
            </html>
         `;
         return;
      }

      // Genera HTML per il flowchart
      flowchartPanel.webview.html = generateFlowChartHtml(sections);

      // Configura la gestione dei messaggi
      flowchartPanel.webview.onDidReceiveMessage(
         message => {
            if (message.command === 'jumpToLine') {
               const editor = vscode.window.activeTextEditor;
               if (editor) {
                  const position = new vscode.Position(message.line, 0);
                  editor.selection = new vscode.Selection(position, position);
                  editor.revealRange(
                     new vscode.Range(position, position),
                     vscode.TextEditorRevealType.InCenter
                  );
               }
            }
         }
      );
   }

   function generateFlowChartHtml(sections) {
      let boxesHtml = '';

      // Mappa per tenere traccia di tutte le etichette definite
      const labelMap = new Map();

      // 1. Prima passata: trova tutte le etichette e le loro posizioni
      sections.forEach((section, sectionIndex) => {
         const lines = section.content.split('\n');
         lines.forEach((line, lineIndex) => {
            // Cerca etichette definite (esempio: "LABEL:")
            const labelMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
            if (labelMatch) {
               const labelName = labelMatch[1];
               labelMap.set(labelName, {
                  section: sectionIndex,
                  line: lineIndex,
                  name: labelName
               });
            }
         });
      });

      // Genera HTML per ogni sezione
      sections.forEach((section, index) => {
         const formattedCode = highlightSyntaxWithReferences(section.content, index);

         boxesHtml += `
         <div class="flowchart-box" id="section-${index}" data-line="${section.line}">
            <div class="section-header">${section.name}</div>
            <div class="section-content">
               <pre>${formattedCode}</pre>
            </div>
         </div>
      `;
      });

      return `
      <!DOCTYPE html>
      <html lang="it">
      <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>SIMASM Flow Chart</title>
         <style>
            body {
               font-family: Arial, sans-serif;
               padding: 20px;
               background-color: #f5f5f5;
               position: relative;
            }
            .flowchart-container {
               display: flex;
               flex-direction: column;
               align-items: center;
               margin-top: 20px;
               position: relative;
               z-index: 1;
            }
            .flowchart-box {
               border: 2px solid #336699;
               border-radius: 8px;
               min-height: 60px;
               background-color: #f0f8ff;
               box-shadow: 0 4px 6px rgba(0,0,0,0.1);
               display: flex;
               flex-direction: column;
               cursor: pointer;
               transition: transform 0.2s;
               margin-bottom: 20px;
               position: relative;
            }
            .flowchart-box:hover {
               transform: scale(1.05);
               box-shadow: 0 6px 10px rgba(0,0,0,0.15);
            }
            .section-header {
               background-color: #336699;
               color: white;
               padding: 8px;
               border-top-left-radius: 6px;
               border-top-right-radius: 6px;
               font-weight: bold;
               text-align: center;
            }
            .section-content {
               padding: 10px;
               font-family: 'Courier New', monospace;
               font-size: 12px;
               overflow: auto;
            }
            pre {
               margin: 0;
               white-space: pre-wrap;
               position: relative;
            }
            h1 {
               color: #336699;
               text-align: center;
            }
            
            /* Stili per evidenziazione sintassi */
            .instruction {
               color: #FF5733; /* Arancione */
               font-weight: bold;
            }
            .label {
               color: #008000; /* Verde */
               font-style: italic;
               position: relative;
            }
            .register {
               color: #1E90FF; /* Blu */
               font-weight: bold;
            }
            .numeric {
               color: #FFD700; /* Giallo */
               font-style: italic;
            }
            .comment {
               color: #888888; /* Grigio */
               font-style: italic;
            }
            .label-ref {
               color: #FFA500; /* Arancione */
               text-decoration: underline;
               position: relative;
            }
            .data-type {
               color: #FFB86C; /* Arancione chiaro */
               font-weight: bold;
            }
            
            /* Stili per le frecce SVG */
            #svg-container {
               position: absolute;
               top: 0;
               left: 0;
               width: 100%;
               height: 100%;
               pointer-events: none;
               z-index: 0;
            }
            .arrow-line {
               stroke: #336699;
               stroke-width: 1.5;
               fill: none;
            }
            .arrow-same-box {
               stroke: #008000; /* Verde - per frecce nella stessa box */
            }
            .arrow-diff-box {
               stroke: #FF5733; /* Arancione - per frecce tra box diverse */
            }
            .arrow-head {
               fill: #336699;
            }
            .arrow-head-same-box {
               fill: #008000;
            }
            .arrow-head-diff-box {
               fill: #FF5733;
            }
            
            /* Stili per i controlli dell'offset */
            .controls-container {
               background-color: rgba(255, 255, 255, 0.8);
               border-radius: 5px;
               padding: 8px;
               margin-bottom: 15px;
               box-shadow: 0 2px 4px rgba(0,0,0,0.1);
               display: flex;
               align-items: center;
               gap: 10px;
            }
            .control-label {
               font-size: 14px;
               font-weight: bold;
               color: #336699;
            }
            .offset-value {
               font-size: 14px;
               font-weight: bold;
               color: #336699;
               width: 30px;
               text-align: center;
            }
         </style>
         <script>
            // Variabile globale per l'offset delle frecce - fissata a 25px
            let arrowOffset = 25;
            
            // Funzione per navigare alla posizione nel codice
            document.addEventListener('DOMContentLoaded', () => {
               const vscode = acquireVsCodeApi();
               const boxes = document.querySelectorAll('.flowchart-box');
               
               // Gestisci i click sulle box
               boxes.forEach(box => {
                  box.addEventListener('click', () => {
                     const line = box.getAttribute('data-line');
                     vscode.postMessage({
                        command: 'jumpToLine',
                        line: parseInt(line)
                     });
                  });
               });
               
               // Imposta tutte le box alla stessa larghezza
               equalizeBoxWidths();
               
               // Disegna le frecce di collegamento dopo che tutto è stato renderizzato
               setTimeout(redrawArrows, 500);
               
               // Aggiungi listener per il ridimensionamento della finestra
               window.addEventListener('resize', debounce(redrawArrows, 250));
               
               // Controlla periodicamente se le frecce devono essere ridisegnate
               setInterval(checkArrows, 2000);
            });

            // Funzione di debounce per evitare troppe chiamate durante il ridimensionamento
            function debounce(func, wait) {
               let timeout;
               return function() {
                  const context = this;
                  const args = arguments;
                  clearTimeout(timeout);
                  timeout = setTimeout(() => func.apply(context, args), wait);
               };
            }
            
            // Funzione per controllare se le frecce sono presenti e ridisegnarle se necessario
            function checkArrows() {
               const svg = document.querySelector('#svg-container svg');
               const paths = svg ? svg.querySelectorAll('path') : [];
               
               if (paths.length === 0) {
                  console.log('Frecce mancanti, ridisegno...');
                  redrawArrows();
               }
            }
            
            // Funzione per ridisegnare completamente le frecce
            function redrawArrows() {
               console.log('Ridisegno frecce...');
               // Pulisci completamente il container SVG esistente
               const existingSvgContainer = document.getElementById('svg-container');
               if (existingSvgContainer) {
                  existingSvgContainer.parentNode.removeChild(existingSvgContainer);
               }
               
               // Attendi che il DOM si stabilizzi dopo il ridimensionamento
               setTimeout(() => {
                  try {
                     drawArrows();
                  } catch (error) {
                     console.error("Errore nel ridisegno delle frecce:", error);
                     // Riprova dopo un timeout più lungo
                     setTimeout(drawArrows, 500);
                  }
               }, 200);
            }
            
            // Funzione per impostare una larghezza uniforme a tutte le box
            function equalizeBoxWidths() {
               const boxes = document.querySelectorAll('.flowchart-box');
               let maxWidth = 0;
               
               boxes.forEach(box => {
                  box.style.width = 'auto';
                  const contentWidth = Math.max(
                     box.querySelector('.section-header').scrollWidth,
                     box.querySelector('.section-content').scrollWidth
                  );
                  // Riduciamo i padding aggiuntivi da 40px a 10px
                  maxWidth = Math.max(maxWidth, contentWidth + 10);
               });
               
               // Riduciamo la larghezza minima da 350px a 300px
               maxWidth = Math.max(maxWidth, 300);
               
               boxes.forEach(box => {
                  box.style.width = maxWidth + 'px';
               });
            }
            
            // Funzione per disegnare frecce tra i riferimenti e le etichette originali
function drawArrows() {
    try {
        // Crea il container SVG se non esiste
        let svgContainer = document.getElementById('svg-container');
        if (!svgContainer) {
            svgContainer = document.createElement('div');
            svgContainer.id = 'svg-container';
            document.body.appendChild(svgContainer);
            
            // Crea l'elemento SVG
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.pointerEvents = 'none';
            svgContainer.appendChild(svg);
            
            // Aggiungi definizioni per le punte delle frecce
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.appendChild(defs);
            
            // Marker per frecce nella stessa box
            const markerSameBox = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            markerSameBox.setAttribute('id', 'arrowhead-same');
            markerSameBox.setAttribute('markerWidth', '10');
            markerSameBox.setAttribute('markerHeight', '7');
            markerSameBox.setAttribute('refX', '10');
            markerSameBox.setAttribute('refY', '3.5');
            markerSameBox.setAttribute('orient', 'auto');
            
            const polygonSame = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygonSame.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygonSame.setAttribute('class', 'arrow-head-same-box');
            markerSameBox.appendChild(polygonSame);
            defs.appendChild(markerSameBox);
            
            // Marker per frecce tra box diverse
            const markerDiffBox = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            markerDiffBox.setAttribute('id', 'arrowhead-diff');
            markerDiffBox.setAttribute('markerWidth', '10');
            markerDiffBox.setAttribute('markerHeight', '7');
            markerDiffBox.setAttribute('refX', '10');
            markerDiffBox.setAttribute('refY', '3.5');
            markerDiffBox.setAttribute('orient', 'auto');
            
            const polygonDiff = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygonDiff.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygonDiff.setAttribute('class', 'arrow-head-diff-box');
            markerDiffBox.appendChild(polygonDiff);
            defs.appendChild(markerDiffBox);
        }

        // Ottieni l'elemento SVG
        const svg = svgContainer.querySelector('svg');
        if (!svg) {
            console.error("SVG non trovato, riprovo...");
            setTimeout(drawArrows, 100);
            return;
        }
        
        // Ottieni tutti i riferimenti e le etichette
        const labelRefs = document.querySelectorAll('.label-ref[data-label]');
        
        // Usa l'offset variabile definito dall'utente
        const standardMargin = arrowOffset;
        
        // Definisci spazi tra le linee verticali e orizzontali
        const horizontalGap = 5;  // Aumentato per maggiore distanza tra linee verticali
        const verticalStep = 0;    // Aumentato per maggiore separazione tra linee orizzontali
        
        // Ottieni tutti i box
        const boxes = document.querySelectorAll('.flowchart-box');
        
        // Raggruppa i riferimenti per destinazione
        const referencesByTarget = new Map();
        
        // Prima, analizza tutti i riferimenti per etichetta
        labelRefs.forEach(ref => {
            const labelName = ref.getAttribute('data-label');
            if (!referencesByTarget.has(labelName)) {
                referencesByTarget.set(labelName, []);
            }
            referencesByTarget.get(labelName).push(ref);
        });
        
        // Mappa per tenere traccia delle linee verticali globali
        const verticalLinesMap = new Map();
        let verticalLineIndex = 0;
        
        // Mappa da etichetta a box contenitore
        const labelToBoxMap = new Map();
        
        // Associa ciascuna etichetta al suo box contenitore
        document.querySelectorAll('.label[data-name]').forEach(label => {
            const labelName = label.getAttribute('data-name');
            const box = label.closest('.flowchart-box');
            if (box) {
                labelToBoxMap.set(labelName, box);
            }
        });
        
        // Preparazione: assegna ad ogni etichetta target una linea verticale unica
        referencesByTarget.forEach((refs, labelName) => {
            const target = document.querySelector('.label[data-name="' + labelName + '"]');
            if (target) {
                const targetBox = target.closest('.flowchart-box');
                if (targetBox) {
                    const rect = targetBox.getBoundingClientRect();
                    const boxLeft = rect.left + window.pageXOffset;
                    
                    // Calcola la posizione della linea verticale per questa etichetta
                    // Stacchiamo le linee verticali tra loro con un gap incrementale
                    const verticalLineX = Math.max(20, boxLeft - standardMargin - (verticalLineIndex * horizontalGap));
                    
                    verticalLinesMap.set(labelName, {
                        x: verticalLineX,
                        index: verticalLineIndex++,
                        box: targetBox,
                        refs: refs
                    });
                }
            }
        });
        
        // Disegna le frecce per ciascuna etichetta target
        referencesByTarget.forEach((refs, labelName) => {
            // Trova l'etichetta target
            const target = document.querySelector('.label[data-name="' + labelName + '"]');
            
            if (target && verticalLinesMap.has(labelName)) {
                const targetBox = target.closest('.flowchart-box');
                const targetRect = target.getBoundingClientRect();
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                
                // Punto finale (a sinistra dell'etichetta)
                const endX = targetRect.left + scrollX - 10; // Spostato 10px a sinistra
                const endY = targetRect.top + scrollY + targetRect.height / 2;
                
                // Ottieni la posizione della linea verticale
                const verticalLineX = verticalLinesMap.get(labelName).x;
                
                // Disegna frecce per ogni riferimento a questa etichetta
                refs.forEach((ref, refIndex) => {
                    // Ottieni le coordinate del riferimento
                    const refRect = ref.getBoundingClientRect();
                    const startX = refRect.left + scrollX - 10; // Spostato 10px a sinistra
                    const startY = refRect.top + scrollY + refRect.height / 2;
                    
                    // Determina se sono nella stessa box
                    const refBox = ref.closest('.flowchart-box');
                    const sameBox = refBox === targetBox;
                    
                    // Calcola offset verticale incrementale per ogni riferimento
                    // Usiamo un offset più grande per separare chiaramente le linee
                    const verticalOffset = refIndex * verticalStep;
                    
                    // Crea il percorso della freccia
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    // Disegna la freccia con percorso migliorato
                    const d = \`M \${startX},\${startY} 
                               H \${verticalLineX} 
                               V \${endY - verticalOffset} 
                               H \${endX}\`;
                    
                    path.setAttribute('d', d);
                    path.setAttribute('class', 'arrow-line ' + (sameBox ? 'arrow-same-box' : 'arrow-diff-box'));
                    path.setAttribute('marker-end', 'url(#' + (sameBox ? 'arrowhead-same' : 'arrowhead-diff') + ')');
                    
                    svg.appendChild(path);
                });
            }
        });

        console.log("Frecce disegnate con successo");
    } catch (error) {
        console.error("Errore nel disegno delle frecce:", error);
        // Riprova tra mezzo secondo
        setTimeout(drawArrows, 500);
    }
}
         </script>
      </head>
      <body>
         <h1>SIMASM Flow Chart</h1>
         <div class="flowchart-container">
            ${boxesHtml}
         </div>
      </body>
      </html>
   `;
   }

   // Funzione aggiornata per evidenziare la sintassi con attributi per i riferimenti
   function highlightSyntaxWithReferences(code, sectionIndex) {
      // Escape dei caratteri HTML
      code = code
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;');

      // Dividi il codice in righe
      const lines = code.split('\n');

      // Pattern per rilevare i vari elementi del codice
      const jumpInstructions = ['BR', 'JMP', 'JMPZ', 'JMPNZ', 'JMPN', 'JMPNN', 'JMPC', 'JMPV', 'CALL'];
      const otherInstructions = ['LDWI', 'LDWA', 'LDWR', 'LDBI', 'LDBA', 'LDBR', 'STWA', 'STWR', 'STBA', 'STBR',
         'MV', 'PUSH', 'POP', 'SPRD', 'SPWR', 'ADD', 'SUB', 'NOT', 'AND', 'OR', 'XOR',
         'INC', 'DEC', 'LSH', 'RSH', 'INW', 'INB', 'OUTW', 'OUTB', 'TSTI', 'TSTO'];

      // Mappa per tenere traccia delle etichette definite in questa sezione
      const localLabels = new Map();

      // Prima passata: trova le definizioni di etichette in questa sezione
      lines.forEach((line, lineIndex) => {
         const labelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
         if (labelMatch) {
            localLabels.set(labelMatch[1], lineIndex);
         }
      });

      // Elabora ogni riga
      const processedLines = lines.map((line, lineIndex) => {
         // Gestione commenti
         const commentIndex = line.indexOf(';');
         if (commentIndex === 0) {
            return `<span class="comment">${line}</span>`;
         } else if (commentIndex > 0) {
            const codePart = line.substring(0, commentIndex);
            const commentPart = line.substring(commentIndex);
            return processCodePart(codePart, lineIndex) + `<span class="comment">${commentPart}</span>`;
         } else {
            return processCodePart(line, lineIndex);
         }
      });

      // Funzione per elaborare la parte di codice
      function processCodePart(codePart, lineIndex) {
         // Tokenizzazione
         const tokens = [];
         let current = '';
         let inWord = false;

         // Dividi in token
         for (let i = 0; i < codePart.length; i++) {
            const char = codePart[i];
            const isWordChar = /[a-zA-Z0-9_]/.test(char);

            // Gestione speciale per ":" nelle etichette
            if (char === ':' && i > 0 && /[a-zA-Z0-9_]/.test(codePart[i - 1])) {
               if (inWord) {
                  current += char;
                  // Estrai il nome dell'etichetta senza i due punti
                  const labelName = current.substring(0, current.length - 1);
                  tokens.push({
                     type: 'label',
                     text: current,
                     name: labelName
                  });
                  current = '';
                  inWord = false;
                  continue;
               }
            }

            if (isWordChar) {
               if (!inWord) {
                  if (current) tokens.push({ type: 'space', text: current });
                  current = '';
                  inWord = true;
               }
               current += char;
            } else {
               if (inWord) {
                  tokens.push({ type: 'word', text: current });
                  current = '';
                  inWord = false;
               }
               current += char;
            }
         }

         // Aggiungi l'ultimo token
         if (current) {
            tokens.push({ type: inWord ? 'word' : 'space', text: current });
         }

         // Elabora i token
         let result = '';
         let lastWasJumpInstruction = false;

         for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'space') {
               result += token.text;
               continue;
            }

            if (token.type === 'label') {
               // Aggiungi attributo data-name per identificare l'etichetta
               result += `<span class="label" data-name="${token.name}" data-line="${lineIndex}">${token.text}</span>`;
               continue;
            }

            const text = token.text;

            // Controlla se è un'etichetta con ":" separato
            if (i < tokens.length - 1 &&
               token.type === 'word' &&
               tokens[i + 1].type === 'space' &&
               tokens[i + 1].text.startsWith(':')) {

               result += `<span class="label" data-name="${text}" data-line="${lineIndex}">${text}${tokens[i + 1].text.charAt(0)}</span>`;
               tokens[i + 1] = {
                  type: 'space',
                  text: tokens[i + 1].text.substring(1)
               };
               continue;
            }

            // Istruzione di salto
            if (jumpInstructions.includes(text.toUpperCase())) {
               result += `<span class="instruction">${text}</span>`;
               lastWasJumpInstruction = true;
               continue;
            }

            // Etichetta riferimento (dopo istruzione di salto)
            if (lastWasJumpInstruction && text.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
               result += `<span class="label-ref" data-label="${text}" data-line="${lineIndex}">${text}</span>`;
               lastWasJumpInstruction = false;
               continue;
            }

            // Altre istruzioni
            if (otherInstructions.includes(text.toUpperCase()) ||
               text.toUpperCase() === "RET" || text.toUpperCase() === "HLT") {
               result += `<span class="instruction">${text}</span>`;
               continue;
            }

            // Tipo di dati
            if (text.match(/^(word|byte)$/i)) {
               result += `<span class="data-type">${text}</span>`;
               continue;
            }

            // Registro
            if (text.match(/^[Rr][0-9]+$/)) {
               result += `<span class="register">${text}</span>`;
               continue;
            }

            // Valore numerico
            if (text.match(/^(0x[0-9A-Fa-f]+|[0-9A-Fa-f]+)$/)) {
               result += `<span class="numeric">${text}</span>`;
               continue;
            }

            // Altro potenziale riferimento a etichetta
            if (text.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
               result += `<span class="label-ref" data-label="${text}" data-line="${lineIndex}">${text}</span>`;
               continue;
            }

            // Default: testo normale
            result += text;
         }

         return result;
      }

      return processedLines.join('\n');
   }

   // Registra il comando per visualizzare il flow chart
   context.subscriptions.push(
      vscode.commands.registerCommand('extension.showFlowChart', () => {
         showFlowChart();
      })
   );

   // Aggiungi listener per l'evento di salvataggio del documento
   context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(document => {
         // Verifica che sia un documento SIMASM
         if (document.languageId === 'simasm' && flowchartPanel) {
            // Aggiorna il flow chart
            updateFlowChart(document);
         }
      })
   );
}

function deactivate() { }

module.exports = {
   activate,
   deactivate
};
