const vscode = require('vscode');

let formattingStyle = 'full';

// Dizionario istruzioni SIMASM con descrizioni in italiano
const instructionDocs = {
  LDWI: 'LDWI R, valore — Carica un word immediato nel registro R. Flag: Z, N',
  LDWA: 'LDWA R, indirizzo — Carica un word da memoria al registro R. Flag: Z, N',
  LDWR: 'LDWR R1, R2 — Carica un word dall’indirizzo in R2 nel registro R1. Flag: Z, N',
  LDBI: 'LDBI R, valore — Carica un byte immediato nel registro R. Flag: Z',
  LDBA: 'LDBA R, indirizzo — Carica un byte da memoria nel registro R. Flag: Z',
  LDBR: 'LDBR R1, R2 — Carica un byte dall’indirizzo in R2 nel registro R1. Flag: Z',
  STWA: 'STWA R, indirizzo — Salva un word da R nella memoria. Flag: nessuna',
  STWR: 'STWR R1, R2 — Salva un word da R1 all’indirizzo in R2. Flag: nessuna',
  STBA: 'STBA R, indirizzo — Salva un byte da R nella memoria. Flag: nessuna',
  STBR: 'STBR R1, R2 — Salva un byte da R1 all’indirizzo in R2. Flag: nessuna',
  MV: 'MV R1, R2 — Copia R2 in R1. Flag: Z, N',
  PUSH: 'PUSH R — Inserisce il valore di R nello stack. Flag: nessuna',
  POP: 'POP R — Estrae un valore dallo stack in R. Flag: Z, N',
  SPRD: 'SPRD R — Copia SP in R. Flag: Z, N',
  SPWR: 'SPWR R — Scrive R nello stack pointer. Flag: nessuna',
  ADD: 'ADD R1, R2 — R1 ← R1 + R2. Flag: Z, N, C, V',
  SUB: 'SUB R1, R2 — R1 ← R1 - R2. Flag: Z, N, C, V',
  NOT: 'NOT R — Inverte i bit di R. Flag: Z, N; C e V azzerati',
  AND: 'AND R1, R2 — Bitwise AND tra R1 e R2. Flag: Z, N; C e V azzerati',
  OR: 'OR R1, R2 — Bitwise OR tra R1 e R2. Flag: Z, N; C e V azzerati',
  XOR: 'XOR R1, R2 — Bitwise XOR tra R1 e R2. Flag: Z, N; C e V azzerati',
  INC: 'INC R — Incrementa R. Flag: Z, N, C, V',
  DEC: 'DEC R — Decrementa R. Flag: Z, N, C, V',
  LSH: 'LSH R — Shift logico sinistro. Flag: Z, N, C; V azzerato',
  RSH: 'RSH R — Shift logico destro. Flag: Z, N, C; V azzerato',
  INW: 'INW R, A — Input word da porta A in R. Flag: Z, N',
  INB: 'INB R, A — Input byte da porta A in R. Flag: Z, N',
  OUTW: 'OUTW R, A — Output word da R alla porta A. Flag: nessuna',
  OUTB: 'OUTB R, A — Output byte da R alla porta A. Flag: nessuna',
  TSTI: 'TSTI A — Test input pronto su porta A. Flag: Z',
  TSTO: 'TSTO A — Test output pronto su porta A. Flag: Z',
  BR: 'BR indirizzo — Salta all’indirizzo assoluto. Flag: nessuna',
  JMP: 'JMP offset — Salta relativo (PC + offset). Flag: nessuna',
  JMPZ: 'JMPZ offset — Salta se Z = 1. Flag: nessuna',
  JMPNZ: 'JMPNZ offset — Salta se Z = 0. Flag: nessuna',
  JMPN: 'JMPN offset — Salta se N = 1. Flag: nessuna',
  JMPNN: 'JMPNN offset — Salta se N = 0. Flag: nessuna',
  JMPC: 'JMPC offset — Salta se C = 1. Flag: nessuna',
  JMPV: 'JMPV offset — Salta se V = 1. Flag: nessuna',
  CALL: 'CALL indirizzo — Salva PC e salta a subroutine. Flag: nessuna',
  RET: 'RET — Ritorna da subroutine (PC ← pop). Flag: nessuna',
  HLT: 'HLT — Ferma l’esecuzione del programma. Flag: nessuna'
};


function getFormattingStyle(context) {
  return context.globalState.get('formattingStyle', 'full');
}

function setFormattingStyle(context, value) {
  context.globalState.update('formattingStyle', value);
  formattingStyle = value;
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

        if (/^\s*;/.test(raw)) {
          comment = raw.trim();
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

        if (comment && !label && !inst && !op1 && !op2) {
          formatted = comment;
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
        return new vscode.Hover(`**${word}** — ${doc}`);
      }
    }
  });

  context.subscriptions.push(hoverProvider);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
