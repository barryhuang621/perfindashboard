/**
 * Personal Finance Dashboard - Main Entry Point
 */

async function init() {
  console.log('💰 Personal Finance Dashboard loaded');

  // Elements
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const navItems = document.querySelectorAll('.nav-item');
  const homeView = document.getElementById('home-view');
  const addItemView = document.getElementById('add-item-view');
  
  const fileInput = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  const fileInfo = document.getElementById('file-info');
  const accountNameDisplay = document.getElementById('account-name');
  const fileNameDisplay = document.getElementById('selected-file-name');
  const previewSection = document.getElementById('preview-section');
  const tableHead = document.getElementById('table-head');
  const tableBody = document.getElementById('table-body');
  const clearBtn = document.getElementById('clear-btn');

  // Asset Form Elements
  const assetCategory = document.getElementById('asset-category');
  const subCategory = document.getElementById('sub-category');
  const assetTarget = document.getElementById('asset-target');
  const addAssetBtn = document.getElementById('add-asset-btn');

  // 1. Sidebar Toggle Logic
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    // Also handle mobile state if needed
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('active');
    }
  });

  // 2. View Switching Logic
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      
      // Update Nav UI
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Switch View
      if (view === 'home') {
        homeView.classList.remove('hidden');
        addItemView.classList.add('hidden');
      } else if (view === 'add-item') {
        homeView.classList.add('hidden');
        addItemView.classList.remove('hidden');
        // Update datalists when entering Add Item view
        updateFormDatalists();
      }

      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
      }
    });
  });

  // 2.5 Dynamic Datalist Logic
  async function updateFormDatalists() {
    console.log('🔄 Updating datalists from database...');
    const listBody = document.getElementById('asset-list-body');
    const baseline = {
      categories: [],
      subCategories: [],
      targets: []
    };

    try {
      const res = await fetch('/api/assets?t=' + Date.now());
      const assets = await res.json();
      
      console.log('📊 Assets fetched for datalists:', assets);

      if (Array.isArray(assets)) {
        // 1. Update Datalists
        const dbCategories = [...new Set(assets.map(a => a.category).filter(Boolean))];
        const dbSubCategories = [...new Set(assets.map(a => a.sub_category).filter(Boolean))];
        const dbTargets = [...new Set(assets.map(a => a.target).filter(Boolean))];

        const categories = [...new Set([...baseline.categories, ...dbCategories])];
        const subCategories = [...new Set([...baseline.subCategories, ...dbSubCategories])];
        const targets = [...new Set([...baseline.targets, ...dbTargets])];

        renderDatalist('categories', categories);
        renderDatalist('sub-categories', subCategories);
        renderDatalist('targets', targets);

        // 2. Update Debug Table
        if (listBody) {
          if (assets.length === 0) {
            listBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">資料庫為空</td></tr>';
          } else {
            listBody.innerHTML = assets.map(a => `
              <tr>
                <td>${a.category || '-'}</td>
                <td>${a.sub_category || '-'}</td>
                <td>${a.target || '-'}</td>
                <td style="text-align: center;">
                  <button data-id="${a.id}" class="btn-text delete-asset-btn" style="color: #ef4444; padding: 2px 4px;">刪除</button>
                </td>
              </tr>
            `).join('');
          }
        }
        console.log('✅ Datalists and debug table updated successfully');
      }
    } catch (err) {
      console.error('❌ Failed to fetch assets:', err);
      if (listBody) listBody.innerHTML = `<tr><td colspan="3" style="color: red; text-align: center;">讀取失敗: ${err.message}</td></tr>`;
      renderDatalist('categories', baseline.categories);
      renderDatalist('sub-categories', baseline.subCategories);
      renderDatalist('targets', baseline.targets);
    }
  }

  function renderDatalist(id, options) {
    const oldDatalist = document.getElementById(id);
    if (!oldDatalist) return;
    
    // 1. Create a brand new datalist element
    const newDatalist = document.createElement('datalist');
    newDatalist.id = id;
    
    // 2. Add options
    const uniqueOptions = [...new Set(options.filter(opt => opt))];
    uniqueOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      newDatalist.appendChild(option);
    });
    
    // 3. Replace the old one in the DOM to break browser cache
    oldDatalist.parentNode.replaceChild(newDatalist, oldDatalist);
    
    console.log(`📡 Datalist [${id}] RECONSTRUCTED with ${uniqueOptions.length} items:`, uniqueOptions);
  }

  /**
   * 2.6 Event Delegation for Deletion
   */
  const assetListBody = document.getElementById('asset-list-body');
  if (assetListBody) {
    assetListBody.addEventListener('click', async (e) => {
      // Check if the clicked element is a delete button
      if (e.target.classList.contains('delete-asset-btn')) {
        const id = e.target.getAttribute('data-id');
        console.log('🗑️ Delete requested for ID:', id);
        
        if (!confirm('確定要刪除這筆記錄嗎？')) return;

        try {
          // Disable button during operation
          e.target.disabled = true;
          const originalText = e.target.textContent;
          e.target.textContent = '...';

          // Using POST with action: 'delete' for maximum compatibility
          const res = await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
          });
          
          console.log(`🌐 Response Status: ${res.status}`);
          
          const text = await res.text();
          console.log(`📄 Response Text: ${text}`);
          
          const result = JSON.parse(text);
          
          if (result.success) {
            console.log('✅ Record deleted successfully');
            updateFormDatalists();
          } else {
            console.error('❌ Server side error:', result.error);
            alert('❌ 刪除失敗：' + (result.error || '不明錯誤'));
            e.target.disabled = false;
            e.target.textContent = originalText;
          }
        } catch (err) {
          console.error('❌ Client side error during deletion:', err);
          alert('❌ 網路或解析錯誤，請見 Console');
          e.target.disabled = false;
          e.target.textContent = '刪除';
        }
      }
    });
  }

  // Define a legacy global function just in case, but using delegation is preferred
  window.deleteAssetRecord = (id) => {
    console.warn('⚠️ Legacy deleteAssetRecord called for ID:', id);
    // Trigger the click logic manually if needed
    const btn = document.querySelector(`.delete-asset-btn[data-id="${id}"]`);
    if (btn) btn.click();
  };

  // Populate datalists on initial load
  updateFormDatalists();

  // 3. Asset Submission Logic
  addAssetBtn.addEventListener('click', async () => {
    const data = {
      category: assetCategory.value.trim(),
      subCategory: subCategory.value.trim(),
      target: assetTarget.value.trim()
    };

    if (!data.category || !data.subCategory || !data.target) {
      alert('請填寫所有欄位');
      return;
    }

    addAssetBtn.disabled = true;
    addAssetBtn.textContent = '傳送中...';

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (result.success) {
        if (result.changes > 0) {
          alert('✅ 項目已成功加入！');
          // Refresh datalists to include the new item
          updateFormDatalists();
        } else {
          alert('ℹ️ 項目已存在，未重複加入。');
        }
      } else {
        alert('❌ 發生錯誤：' + result.error);
      }
    } catch (err) {
      alert('❌ 網路錯誤，請稍後再試。');
    } finally {
      addAssetBtn.disabled = false;
      addAssetBtn.textContent = '加入';
    }
  });

  // --- Original File Parsing Logic ---

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
