const vscode = require('vscode');

let formattingStyle = 'full';

function getFormattingStyle(context) {
  return context.globalState.get('formattingStyle', 'full');
}

function setFormattingStyle(context, value) {
  context.globalState.update('formattingStyle', value);
  formattingStyle = value;
}

function activate(context) {
  console.log('SIMASM extension is active!');

  formattingStyle = getFormattingStyle(context);

  const provider = {
    provideDocumentFormattingEdits(document) {
      console.log(`Formatting with style: ${formattingStyle}`);
      const edits = [];
      const lines = [];

      // Step 1: parse lines
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const raw = line.text;

        let label = '', inst = '', op1 = '', op2 = '', comment = '';

        // Riga con solo commento
        if (/^\s*;/.test(raw)) {
          comment = raw.trim();
        } else {
          const match = raw.match(/^\s*([A-Za-z_][\w]*:)?\s*(\S+)?\s*(\S+)?\s*(\S+)?\s*(;.*)?$/);
          label = match?.[1]?.trim() || '';
          inst = match?.[2]?.trim() || '';
          op1 = match?.[3]?.trim() || '';
          op2 = match?.[4]?.trim() || '';
          comment = match?.[5]?.trim() || '';
        }

        lines.push({ line, label, inst, op1, op2, comment });
      }

      // Step 2: determine column widths
      const labelWidth = Math.max(...lines.map(l => l.label.length));
      const instWidth = Math.max(...lines.map(l => l.inst.length));
      const op1Width = Math.max(...lines.map(l => l.op1.length));
      const op2Width = Math.max(...lines.map(l => l.op2.length));

      // Step 2.5: calculate max code width (without comment)
      const codeWidths = lines.map(({ label, inst, op1, op2 }) => {
        let code = '';
        if (formattingStyle === 'full') {
          code += label.padEnd(labelWidth + 2);
          code += inst.padEnd(instWidth + 2);
          code += op1.padEnd(op1Width + 2);
          code += op2.padEnd(op2Width + 2);
        } else if (formattingStyle === 'compact') {
          code += (label ? label.padEnd(labelWidth + 2) : ' '.repeat(labelWidth + 2));
          code += inst.padEnd(instWidth + 2);
          code += op1 ? op1 + ' ' : '';
          code += op2 ? op2 + ' ' : '';
        }
        return code.trimEnd().length;
      });

      const maxCodeWidth = Math.max(...codeWidths);

      // Step 3: format lines
      for (const { line, label, inst, op1, op2, comment } of lines) {
        let formatted = '';

        // Linea con solo commento
        if (comment && !label && !inst && !op1 && !op2) {
          formatted = comment;
        } else {
          // Parte codice (istruzioni)
          let codePart = '';
          if (formattingStyle === 'full') {
            codePart += label.padEnd(labelWidth + 2);
            codePart += inst.padEnd(instWidth + 2);
            codePart += op1.padEnd(op1Width + 2);
            codePart += op2.padEnd(op2Width + 2);
          } else if (formattingStyle === 'compact') {
            codePart += (label ? label.padEnd(labelWidth + 2) : ' '.repeat(labelWidth + 2));
            codePart += inst.padEnd(instWidth + 2);
            codePart += op1 ? op1 + ' ' : '';
            codePart += op2 ? op2 + ' ' : '';
          }

          codePart = codePart.trimEnd();

          if (comment) {
            const padding = maxCodeWidth - codePart.length + 2; // Spazio tra codice e commento
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

  const disposable = vscode.languages.registerDocumentFormattingEditProvider('simasm', provider);
  context.subscriptions.push(disposable);

  // Command to toggle format style
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.toggleFormattingStyle', () => {
      formattingStyle = formattingStyle === 'full' ? 'compact' : 'full';
      setFormattingStyle(context, formattingStyle);
      vscode.window.showInformationMessage(`Formato SIMASM: ${formattingStyle.toUpperCase()}`);
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
