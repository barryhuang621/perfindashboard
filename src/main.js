/**
 * Personal Finance Dashboard - Main Entry Point
 */

import './style.css';

async function init() {
  console.log('💰 Personal Finance Dashboard loaded');

  const fileInput = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  const fileInfo = document.getElementById('file-info');
  const accountNameDisplay = document.getElementById('account-name');
  const fileNameDisplay = document.getElementById('selected-file-name');
  const previewSection = document.getElementById('preview-section');
  const tableHead = document.getElementById('table-head');
  const tableBody = document.getElementById('table-body');
  const clearBtn = document.getElementById('clear-btn');

  // Trigger file input on click
  dropzone.addEventListener('click', () => fileInput.click());

  // Handle Drag & Drop
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) handleFiles(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files[0]);
  });

  clearBtn.addEventListener('click', () => {
    previewSection.classList.add('hidden');
    fileInfo.classList.add('hidden');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    fileInput.value = '';
  });

  function handleFiles(file) {
    const fileName = file.name;
    const accountName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    // Update UI
    accountNameDisplay.textContent = accountName;
    fileNameDisplay.textContent = fileName;
    fileInfo.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseAndDisplay(text);
    };
    reader.readAsText(file);
  }

  function parseAndDisplay(text) {
    console.log('📄 Starting file parsing...');
    
    // 1. Robust CSV Parsing (Handles quotes, multiline cells, and various separators)
    const allRecords = parseCSV(text);
    console.log('📊 Total raw records parsed:', allRecords.length);
    
    if (allRecords.length <= 7) {
      alert('檔案格式不明或行數不足（至少需要 8 筆記錄）。');
      return;
    }

    // 2. Extract Components based on User Rules
    // Skip 4, use 5th as header (Index 4)
    const rawHeader = allRecords[4];
    // Skip last 3
    const rawDataRows = allRecords.slice(5, allRecords.length - 3);

    // 3. Render Header (Ensure exactly 8 columns)
    const headerColumns = rawHeader.slice(0, 8);
    while (headerColumns.length < 8) headerColumns.push(`Col ${headerColumns.length + 1}`);
    
    tableHead.innerHTML = '';
    headerColumns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col || ' (無名稱) ';
      tableHead.appendChild(th);
    });

    // 4. Stitch Fragments into Logical Transactions
    // Rule: A new transaction starts if the 1st column is a Date (YYYY/MM/DD)
    const transactions = [];
    let currentTx = null;

    rawDataRows.forEach((row) => {
      if (row.length === 0 || row.every(f => f === '')) return;

      const firstCol = row[0] || '';
      const isNewTx = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(firstCol);

      if (isNewTx) {
        // Start a new transaction
        currentTx = [...row];
        // Ensure initial padding to 8 columns
        while (currentTx.length < 8) currentTx.push('');
        transactions.push(currentTx);
      } else if (currentTx) {
        // Stitch into previous transaction
        row.forEach((field, i) => {
          if (!field) return;
          if (i === 0) {
            // Append Time/Date fragments to Column 1
            currentTx[0] += ' ' + field;
          } else if (i < 8) {
            // Merge other fields if current is empty, or append if significant
            if (!currentTx[i]) {
              currentTx[i] = field;
            } else {
              currentTx[i] += '\n' + field;
            }
          }
        });
      }
    });

    // 5. Final Processing for each transaction (Handling thousands separators)
    const finalRows = transactions.map(tx => {
      // Create a clean 8-column copy
      const row = tx.slice(0, 8);
      while (row.length < 8) row.push('');
      return row;
    });

    // 6. Render Body
    tableBody.innerHTML = '';
    finalRows.forEach(rowData => {
      const tr = document.createElement('tr');
      rowData.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    console.log('✅ Displayed transactions:', finalRows.length);
    previewSection.classList.remove('hidden');
  }

  function parseCSV(text) {
    const records = [];
    let currentRecord = [];
    let currentField = '';
    let inQuotes = false;
    
    // Detect separator (Tab > Semicolon > Comma)
    let separator = ',';
    if (text.includes('\t')) separator = '\t';
    else if (text.includes(';')) separator = ';';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"'; // Escaped quote
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        currentRecord.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        // End of line
        currentRecord.push(currentField.trim());
        
        // Literal row handling: always push even if empty to maintain row indices (Row 1-5, etc.)
        records.push(currentRecord);
        
        currentRecord = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') i++; // Skip \n in \r\n
      } else {
        currentField += char;
      }
    }
    
    // Last bit
    if (currentField || currentRecord.length) {
      currentRecord.push(currentField.trim());
      records.push(currentRecord);
    }
    
    // Cleanup: Filter out COMPLETELY empty records only at the very end if needed, 
    // but we need them for the first 5 records to get the header correctly.
    return records;
  }

  // API health check
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    console.log('✅ API health:', data);
  } catch {
    console.log('ℹ️  API not available');
  }
}

init();
