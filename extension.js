const vscode = require('vscode');

let formattingStyle = 'full';

// Dizionario istruzioni SIMASM con descrizioni in italiano
const instructionDocs = {
   LDWI: { description: 'Carica un word immediato nel registro R.', arguments: 'R, valore', machineCode: '', flags: 'Z, N' },
   LDWA: { description: 'Carica un word da memoria al registro R.', arguments: 'R, indirizzo', machineCode: '', flags: 'Z, N' },
   LDWR: { description: 'Carica un word dall’indirizzo in R2 nel registro R1.', arguments: 'R1, R2', machineCode: '', flags: 'Z, N' },
   LDBI: { description: 'Carica un byte immediato nel registro R.', arguments: 'R, valore', machineCode: '', flags: 'Z' },
   LDBA: { description: 'Carica un byte da memoria nel registro R.', arguments: 'R, indirizzo', machineCode: '', flags: 'Z' },
   LDBR: { description: 'Carica un byte dall’indirizzo in R2 nel registro R1.', arguments: 'R1, R2', machineCode: '', flags: 'Z' },
   STWA: { description: 'Salva un word da R nella memoria.', arguments: 'R, indirizzo', machineCode: '', flags: 'nessuna' },
   STWR: { description: 'Salva un word da R1 all’indirizzo in R2.', arguments: 'R1, R2', machineCode: '', flags: 'nessuna' },
   STBA: { description: 'Salva un byte da R nella memoria.', arguments: 'R, indirizzo', machineCode: '', flags: 'nessuna' },
   STBR: { description: 'Salva un byte da R1 all’indirizzo in R2.', arguments: 'R1, R2', machineCode: '', flags: 'nessuna' },
   MV: { description: 'Copia R2 in R1.', arguments: 'R1, R2', machineCode: '', flags: 'Z, N' },
   PUSH: { description: 'Inserisce il valore di R nello stack.', arguments: 'R', machineCode: '', flags: 'nessuna' },
   POP: { description: 'Estrae un valore dallo stack in R.', arguments: 'R', machineCode: '', flags: 'Z, N' },
   SPRD: { description: 'Copia SP in R.', arguments: 'R', machineCode: '', flags: 'Z, N' },
   SPWR: { description: 'Scrive R nello stack pointer.', arguments: 'R', machineCode: '', flags: 'nessuna' },
   ADD: { description: 'R1 ← R1 + R2.', arguments: 'R1, R2', machineCode: '', flags: 'Z, N, C, V' },
   SUB: { description: 'R1 ← R1 - R2.', arguments: 'R1, R2', machineCode: '', flags: 'Z, N, C, V' },
   NOT: { description: 'Inverte i bit di R.', arguments: 'R', machineCode: '', flags: 'Z, N; C e V azzerati' },
   AND: { description: 'Bitwise AND tra R1 e R2.', arguments: 'R1, R2', machineCode: '', flags: 'Z, N; C e V azzerati' },
   OR: { description: 'Bitwise OR tra R1 e R2.', arguments: 'R1, R2', machineCode: '', flags: 'Z, N; C e V azzerati' },
   XOR: { description: 'Bitwise XOR tra R1 e R2.', arguments: 'R1, R2', machineCode: '', flags: 'Z, N; C e V azzerati' },
   INC: { description: 'Incrementa R.', arguments: 'R', machineCode: '', flags: 'Z, N, C, V' },
   DEC: { description: 'Decrementa R.', arguments: 'R', machineCode: '', flags: 'Z, N, C, V' },
   LSH: { description: 'Shift logico sinistro.', arguments: 'R', machineCode: '', flags: 'Z, N, C; V azzerato' },
   RSH: { description: 'Shift logico destro.', arguments: 'R', machineCode: '', flags: 'Z, N, C; V azzerato' },
   INW: { description: 'Input word da porta A in R.', arguments: 'R, A', machineCode: '', flags: 'Z, N' },
   INB: { description: 'Input byte da porta A in R.', arguments: 'R, A', machineCode: '', flags: 'Z, N' },
   OUTW: { description: 'Output word da R alla porta A.', arguments: 'R, A', machineCode: '', flags: 'nessuna' },
   OUTB: { description: 'Output byte da R alla porta A.', arguments: 'R, A', machineCode: '', flags: 'nessuna' },
   TSTI: { description: 'Test input pronto su porta A.', arguments: 'A', machineCode: '', flags: 'Z' },
   TSTO: { description: 'Test output pronto su porta A.', arguments: 'A', machineCode: '', flags: 'Z' },
   BR: { description: 'Salta all’indirizzo assoluto.', arguments: 'indirizzo', machineCode: '', flags: 'nessuna' },
   JMP: { description: 'Salta relativo (PC + offset).', arguments: 'offset', machineCode: '', flags: 'nessuna' },
   JMPZ: { description: 'Salta se Z = 1.', arguments: 'offset', machineCode: '', flags: 'nessuna' },
   JMPNZ: { description: 'Salta se Z = 0.', arguments: 'offset', machineCode: '', flags: 'nessuna' },
   JMPN: { description: 'Salta se N = 1.', arguments: 'offset', machineCode: '', flags: 'nessuna' },
   JMPNN: { description: 'Salta se N = 0.', arguments: 'offset', machineCode: '', flags: 'nessuna' },
   JMPC: { description: 'Salta se C = 1.', arguments: 'offset', machineCode: '', flags: 'nessuna' },
   JMPV: { description: 'Salta se V = 1.', arguments: 'offset', machineCode: '', flags: 'nessuna' },
   CALL: { description: 'Salva PC e salta a subroutine.', arguments: 'indirizzo', machineCode: '', flags: 'nessuna' },
   RET: { description: 'Ritorna da subroutine (PC ← pop).', arguments: '', machineCode: '', flags: 'nessuna' },
   HLT: { description: 'Ferma l’esecuzione del programma.', arguments: '', machineCode: '', flags: 'nessuna' }
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

   // Crea una tabella HTML
   const tableRows = Object.entries(instructionDocs).map(([name, { description, arguments, machineCode, flags }]) => {
      return `<tr><td>${name}</td><td>${description}</td><td>${arguments}</td><td>${machineCode}</td><td>${flags}</td></tr>`;
   }).join('');


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
          background-color:rgb(31, 138, 210);
        }
        tr:hover {
          background-color:rgb(0, 0, 0);
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

            // Special handling for comments
            if (/^\s*;/.test(raw)) {
               // If it starts with two semicolons, keep it without padding
               if (/^\s*;;/.test(raw)) {
                  comment = raw.trim();
               }
               // If it's just a single semicolon, it will be aligned with other comments
               else if (/^\s*;[^;].*$/.test(raw) || raw.trim() === ';') {
                  label = '';
                  inst = '';
                  op1 = '';
                  op2 = '';
                  comment = raw.trim();
               }
            } else {
               const match = raw.match(/^\s*([A-Za-z_][\w]*:)?\s*(\S+)?(?:\s+(\S+))?(?:\s+(\S+))?\s*(;.*)?$/);
               label = match?.[1]?.trim() || '';
               inst = match?.[2]?.trim() || '';
               op1 = match?.[3]?.trim() || '';
               op2 = match?.[4]?.trim() || '';
               comment = match?.[5]?.trim() || '';
            }

            lines.push({ line, label, inst, op1, op2, comment });
         }

         const labelWidth = Math.max(...lines.map(l => l.label.length));
         const instWidth = Math.max(...lines.map(l => l.inst.length));
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
            if (/^;;/.test(comment)) {
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
}

function deactivate() { }

module.exports = {
   activate,
   deactivate
};
