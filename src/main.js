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
  const archiveBtn = document.getElementById('archive-btn');

  const filterOwn = document.getElementById('filter-owner');
  const filterCat = document.getElementById('filter-category');
  const filterSub = document.getElementById('filter-sub-category');
  const filterTgt = document.getElementById('filter-target');

  // Asset Form Elements
  const assetCategory = document.getElementById('asset-category');
  const subCategory = document.getElementById('sub-category');
  const assetTarget = document.getElementById('asset-target');
  const assetOwner = document.getElementById('asset-owner');
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


  let allAssets = []; // Global cache for filtering

  // 2.4 UI Update Logic (Unified)
  function updateUI(assets) {
    allAssets = assets;
    const listBody = document.getElementById('asset-list-body');

    if (!Array.isArray(assets)) return;

    // Direct UI refresh based on total data
    refreshDatalists();

    // 2. Update Management Table
    if (listBody) {
      if (assets.length === 0) {
        listBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">資料庫為空</td></tr>';
      } else {
        listBody.innerHTML = assets.map(a => `
          <tr>
            <td>${a.owner || '-'}</td>
            <td>${a.category || '-'}</td>
            <td>${a.sub_category || '-'}</td>
            <td>${a.target || '-'}</td>
            <td style="text-align: center;">
              <button data-id="${a.id}" class="delete-asset-btn btn-text" style="color: #ef4444; padding: 2px 4px;">刪除</button>
            </td>
          </tr>
        `).join('');
      }
    }
    console.log('✅ UI updated with', assets.length, 'records');
  }

  // 2.4.1 Cascading / Chained Datalist Logic (Owner-First)
  function refreshDatalists() {
    const currentOwn = assetOwner.value.trim();
    const currentCat = assetCategory.value.trim();
    const currentSub = subCategory.value.trim();

    // 1. Owners (Always all)
    const owners = [...new Set(allAssets.map(a => a.owner).filter(Boolean))];
    
    // 2. Categories (Filtered by Owner)
    const categories = [...new Set(allAssets
      .filter(a => !currentOwn || a.owner === currentOwn)
      .map(a => a.category)
      .filter(Boolean)
    )];

    // 3. Sub-categories (Filtered by Owner & Category)
    const subCategories = [...new Set(allAssets
      .filter(a => (!currentOwn || a.owner === currentOwn) && 
                   (!currentCat || a.category === currentCat))
      .map(a => a.sub_category)
      .filter(Boolean)
    )];

    // 4. Targets (Filtered by Owner, Category, Sub)
    const targets = [...new Set(allAssets
      .filter(a => (!currentOwn || a.owner === currentOwn) && 
                   (!currentCat || a.category === currentCat) &&
                   (!currentSub || a.sub_category === currentSub))
      .map(a => a.target)
      .filter(Boolean)
    )];

    renderDatalist('owners', owners);
    renderDatalist('categories', categories);
    renderDatalist('sub-categories', subCategories);
    renderDatalist('targets', targets);
    
    console.log('⛓️  Chained datalists (Owner-first) refreshed');
  }

  // Listen for inputs to trigger cascading refresh
  [assetOwner, assetCategory, subCategory].forEach(input => {
    input.addEventListener('input', refreshDatalists);
  });

  // 2.5 Dynamic Datalist Logic
  async function updateFormDatalists() {
    console.log('🔄 Fetching fresh assets from database...');
    try {
      const res = await fetch('/api/assets?t=' + Date.now());
      const assets = await res.json();
      console.log('📊 Assets fetched:', assets);
      updateUI(assets);
    } catch (err) {
      console.error('❌ Failed to fetch assets:', err);
      updateUI([]);
    }
  }

  function renderDatalist(id, options) {
    const oldDatalist = document.getElementById(id);
    if (!oldDatalist) return;
    
    // Create new datalist to force browser update
    const newDatalist = document.createElement('datalist');
    newDatalist.id = id;
    
    const uniqueOptions = [...new Set(options.filter(opt => opt))];
    uniqueOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      newDatalist.appendChild(option);
    });
    
    oldDatalist.parentNode.replaceChild(newDatalist, oldDatalist);
  }

  /**
   * 2.6 Event Delegation for Deletion
   */
  const assetListBody = document.getElementById('asset-list-body');
  if (assetListBody) {
    assetListBody.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-asset-btn')) {
        const id = e.target.getAttribute('data-id');
        if (!confirm('確定要刪除這筆記錄嗎？')) return;

        try {
          e.target.disabled = true;
          const originalText = e.target.textContent;
          e.target.textContent = '...';

          // Using ISOLATED GET for ultimate stability
          const res = await fetch(`/api/delete-item?id=${id}&t=${Date.now()}`);
          const text = await res.text();
          const result = JSON.parse(text);
          
          if (result.success) {
            updateFormDatalists();
          } else {
            alert('❌ 刪除失敗：' + (result.error || '不明內容'));
            e.target.disabled = false;
            e.target.textContent = originalText;
          }
        } catch (err) {
          alert('❌ 發生異常: ' + err.message);
          e.target.disabled = false;
          e.target.textContent = '刪除';
        }
      }
    });
  }

  // Global legacy function
  window.deleteAssetRecord = (id) => {
    const btn = document.querySelector(`.delete-asset-btn[data-id="${id}"]`);
    if (btn) btn.click();
  };

  // Initial load
  updateFormDatalists();

  // 3. Asset Submission Logic
  addAssetBtn.addEventListener('click', async () => {
    const data = {
      category: assetCategory.value.trim(),
      subCategory: subCategory.value.trim(),
      target: assetTarget.value.trim(),
      owner: assetOwner.value.trim()
    };

    if (!data.category || !data.subCategory || !data.target || !data.owner) {
      alert('請填寫所有欄位（包括擁有人）');
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

  // --- Preview Logic & Selection ---
  let selectedRowIndices = new Set();
  let currentParsedRows = [];

  // Clear button functionality
  clearBtn.addEventListener('click', () => {
    if (previewSection) previewSection.classList.add('hidden');
    fileInfo.classList.add('hidden');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    fileInput.value = '';
    selectedRowIndices.clear();
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

  function filterPreviewTable() {
    // 1. Column-specific Filters (The ONLY filters now)
    const colFilterInputs = Array.from(tableHead.querySelectorAll('.column-filter-input'));
    const colFilters = colFilterInputs.map(input => input.value.toLowerCase().trim());

    const rows = Array.from(tableBody.querySelectorAll('tr'));
    
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      
      // Column Match (Must match each filled column filter against its respective cell)
      const columnMatch = colFilters.every((f, i) => {
        if (!f) return true;
        const cellText = (cells[i]?.textContent || '').toLowerCase();
        return cellText.includes(f);
      });

      row.style.display = columnMatch ? '' : 'none';
    });

    // Update Select-All checkbox state after filtering
    syncSelectAllState();
  }

  function syncSelectAllState() {
    const selectAllBox = document.getElementById('select-all-checkbox');
    if (selectAllBox) {
      const allVisible = Array.from(tableBody.querySelectorAll('tr'))
        .filter(tr => tr.style.display !== 'none')
        .map(tr => tr.querySelector('.row-checkbox'));
      
      const allChecked = allVisible.length > 0 && allVisible.every(cb => cb.checked);
      const someChecked = allVisible.some(cb => cb.checked);
      
      selectAllBox.checked = allVisible.length > 0 && allChecked;
      selectAllBox.indeterminate = someChecked && !allChecked;
    }
  }

  // Handle Archive functionality
  if (archiveBtn) {
    archiveBtn.addEventListener('click', async () => {
      const count = selectedRowIndices.size;
      const assignment = {
        owner: filterOwn.value.trim(),
        category: filterCat.value.trim(),
        subCategory: filterSub.value.trim(),
        target: filterTgt.value.trim()
      };

      // 1. Validations
      if (count === 0) {
        alert('❌ 請先從預覽表格中勾選要歸檔的交易項目。');
        return;
      }
      if (!assignment.owner || !assignment.category || !assignment.subCategory || !assignment.target) {
        alert('⚠️ 歸檔失敗：請確保在最上方的「擁有人、類別、子類別、標的」選單中皆已填入資訊。');
        return;
      }

      const confirmed = confirm(`📦 確定要將勾選的 ${count} 筆資料歸檔至「${assignment.target}」嗎？`);
      if (!confirmed) return;

      // 2. Prepare Data for Archive
      const transactionsToArchive = Array.from(selectedRowIndices).map(idx => {
        const rowData = currentParsedRows[parseInt(idx)];
        return {
          owner: assignment.owner,
          category: assignment.category,
          sub_category: assignment.subCategory,
          target: assignment.target,
          transaction_date: rowData[0] || '',
          account_date: rowData[1] || '',
          info: rowData[2] || '',
          withdraw: rowData[3] || '0',
          deposit: rowData[4] || '0',
          balance: rowData[5] || '0',
          transaction_info: rowData[6] || '',
          remark: rowData[7] || ''
        };
      });

      // 3. Send to API
      try {
        archiveBtn.disabled = true;
        archiveBtn.textContent = '歸檔中...';

        const res = await fetch('/api/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: transactionsToArchive })
        });
        
        const result = await res.json();
        
        if (result.success) {
          alert(`✅ 成功歸檔！\n總共處理: ${result.total} 筆\n實際新增: ${result.changes} 筆 (略過重複項目)`);
          
          // 4. Cleanup UI 
          // Hide archived rows and clear selection
          const rowsInDOM = Array.from(tableBody.querySelectorAll('tr'));
          Array.from(selectedRowIndices).forEach(idxString => {
            const idx = parseInt(idxString);
            const tr = rowsInDOM.find(tr => tr.querySelector('.row-checkbox').getAttribute('data-index') === idxString);
            if (tr) {
              tr.style.opacity = '0.3';
              tr.style.pointerEvents = 'none';
              tr.querySelector('.row-checkbox').checked = false;
              tr.querySelector('.row-checkbox').disabled = true;
            }
          });
          selectedRowIndices.clear();
          syncSelectAllState();

        } else {
          alert('❌ 歸檔失敗：' + (result.error || '不明錯誤'));
        }
      } catch (err) {
        alert('❌ 網路異常，無法完成歸檔作業。');
        console.error('Archive failed:', err);
      } finally {
        archiveBtn.disabled = false;
        archiveBtn.textContent = '歸檔';
      }
    });
  }

  // Track selection state (Persistence)
  tableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('row-checkbox')) {
      const idx = e.target.getAttribute('data-index');
      if (e.target.checked) {
        selectedRowIndices.add(idx);
      } else {
        selectedRowIndices.delete(idx);
      }
      console.log('✅ Selection updated:', selectedRowIndices.size, 'selected');
    }
  });

  // --- CSV Logic Extensions ---

  function parseAndDisplay(text) {
    console.log('📄 Starting file parsing...');
    
    const allRecords = parseCSV(text);
    console.log('📊 Total raw records parsed:', allRecords.length);
    
    if (allRecords.length <= 7) {
      alert('檔案格式不明或行數不足（至少需要 8 筆記錄）。');
      return;
    }

    const rawHeader = allRecords[4];
    const rawDataRows = allRecords.slice(5, allRecords.length - 3);

    // Render Header (8 columns + Checkbox column)
    const headerColumns = rawHeader.slice(0, 8);
    while (headerColumns.length < 8) headerColumns.push(`Col ${headerColumns.length + 1}`);
    
    tableHead.innerHTML = '';
    headerColumns.forEach((col, idx) => {
      const th = document.createElement('th');
      
      // Container for label & filter
      const container = document.createElement('div');
      container.className = 'column-filter-container';
      
      const label = document.createElement('span');
      label.className = 'column-label';
      label.textContent = col || `欄位 ${idx + 1}`;
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'column-filter-input';
      input.placeholder = '篩選...';
      input.addEventListener('input', filterPreviewTable);
      
      container.appendChild(label);
      container.appendChild(input);
      th.appendChild(container);
      tableHead.appendChild(th);
    });

    // Add Select header with "Select All" Checkbox
    const thSelect = document.createElement('th');
    thSelect.style.width = '60px';
    thSelect.style.textAlign = 'center';
    thSelect.style.verticalAlign = 'top';
    
    const selContainer = document.createElement('div');
    selContainer.className = 'column-filter-container';
    selContainer.style.alignItems = 'center';
    
    const selLabel = document.createElement('span');
    selLabel.className = 'column-label';
    selLabel.textContent = '選擇';
    
    const selectAllBox = document.createElement('input');
    selectAllBox.type = 'checkbox';
    selectAllBox.id = 'select-all-checkbox';
    selectAllBox.title = '全選 (僅限目前顯示項目)';
    
    // Select All Logic
    selectAllBox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const visibleCheckboxes = Array.from(tableBody.querySelectorAll('tr'))
        .filter(tr => tr.style.display !== 'none')
        .map(tr => tr.querySelector('.row-checkbox'));
      
      visibleCheckboxes.forEach(cb => {
        cb.checked = isChecked;
        const idx = cb.getAttribute('data-index');
        if (isChecked) {
          selectedRowIndices.add(idx);
        } else {
          selectedRowIndices.delete(idx);
        }
      });
      console.log('📢 Select All updated:', selectedRowIndices.size, 'selected');
    });

    selContainer.appendChild(selLabel);
    selContainer.appendChild(selectAllBox);
    thSelect.appendChild(selContainer);
    tableHead.appendChild(thSelect);

    // Process transactions
    const transactions = [];
    let currentTx = null;

    rawDataRows.forEach((row) => {
      if (row.length === 0 || row.every(f => f === '')) return;
      const firstCol = row[0] || '';
      const isNewTx = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(firstCol);

      if (isNewTx) {
        currentTx = [...row];
        while (currentTx.length < 8) currentTx.push('');
        transactions.push(currentTx);
      } else if (currentTx) {
        row.forEach((field, i) => {
          if (!field) return;
          if (i === 0) currentTx[0] += ' ' + field;
          else if (i < 8) {
            if (!currentTx[i]) currentTx[i] = field;
            else currentTx[i] += '\n' + field;
          }
        });
      }
    });

    currentParsedRows = transactions.map(tx => tx.slice(0, 8));
    selectedRowIndices.clear(); // Reset on new file upload

    // Render Body
    tableBody.innerHTML = '';
    currentParsedRows.forEach((rowData, idx) => {
      const tr = document.createElement('tr');
      rowData.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      
      // Add Checkbox cell
      const tdCheck = document.createElement('td');
      tdCheck.style.textAlign = 'center';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'row-checkbox';
      checkbox.setAttribute('data-index', idx);
      checkbox.checked = selectedRowIndices.has(idx.toString());
      tdCheck.appendChild(checkbox);
      tr.appendChild(tdCheck);
      
      tableBody.appendChild(tr);
    });

    // Populate the filter datalists from allAssets
    populatePreviewFilters();

    console.log('✅ Displayed transactions:', currentParsedRows.length);
    previewSection.classList.remove('hidden');
  }

  function populatePreviewFilters() {
    const owners = [...new Set(allAssets.map(a => a.owner).filter(Boolean))];
    const categories = [...new Set(allAssets.map(a => a.category).filter(Boolean))];
    const subCategories = [...new Set(allAssets.map(a => a.sub_category).filter(Boolean))];
    const targets = [...new Set(allAssets.map(a => a.target).filter(Boolean))];

    renderDatalist('owners-filter', owners);
    renderDatalist('categories-filter', categories);
    renderDatalist('sub-categories-filter', subCategories);
    renderDatalist('targets-filter', targets);
  }

  function parseCSV(text) {
    const records = [];
    let currentRecord = [];
    let currentField = '';
    let inQuotes = false;
    let separator = ',';
    if (text.includes('\t')) separator = '\t';
    else if (text.includes(';')) separator = ';';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        currentRecord.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRecord.length) {
      currentRecord.push(currentField.trim());
      records.push(currentRecord);
    }
    return records;
  }

  // API health check
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      console.log('✅ API health:', data);
    }
  } catch {
    console.log('ℹ️ API not available');
  }
}

init();
