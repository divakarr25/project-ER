
let serialNumber = 1;
let data = [];

function showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

function populateTable(dataArray) {
    const tableBody = document.getElementById("tableBody");
    dataArray.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${serialNumber++}</td>
      <td>${entry.id || ''}</td>
      <td>${entry.name || ''}</td>
      <td>${entry.father || ''}</td>
      <td>${entry.house || ''}</td>
      <td>${entry.age || ''}</td>
      <td>${entry.gender || ''}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editRow(this)">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteRow(this)">Delete</button>
        <button class="action-btn save-btn" onclick="saveRow(this)">Save</button>
      </td>
    `;
        tableBody.appendChild(row);
    });
}

function initializeData() {
    // Initialize with stored data or empty array
    const storedData = JSON.parse(localStorage.getItem("voterListData")) || [];
    data.push(...storedData);
    if (data.length > 0) {
        populateTable(data);
    }
}

function handleJSONUpload() {
    const fileInput = document.getElementById("jsonFile");
    const file = fileInput.files[0];
    if (!file) {
        showStatus("Please choose a JSON file.", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const newData = JSON.parse(e.target.result);
            if (!Array.isArray(newData)) throw new Error("Invalid JSON format - expected array");

            // Validate data structure
            const validData = newData.filter(item => {
                return typeof item === 'object' && item !== null;
            }).map(item => ({
                id: item.id || item.cardNumber || item.அட்டைஎண் || '',
                name: item.name || item.பெயர் || '',
                father: item.father || item.fatherName || item.தந்தைபெயர் || '',
                house: item.house || item.houseNumber || item.வீட்டுஎண் || '',
                age: parseInt(item.age || item.வயது || 0),
                gender: item.gender || item.பாலினம் || ''
            }));

            data.push(...validData);
            populateTable(validData);
            updateLocalStorage();
            showStatus(`Successfully uploaded ${validData.length} records from JSON file.`);
            fileInput.value = '';
        } catch (error) {
            showStatus("Error parsing JSON file: " + error.message, "error");
        }
    };
    reader.readAsText(file);
}

function handleExcelUpload() {
    const fileInput = document.getElementById("excelFile");
    const file = fileInput.files[0];

    if (!file) {
        showStatus("Please choose an Excel file.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data_excel = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data_excel, { type: 'array' });

            // Get the first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length === 0) {
                showStatus("Excel file is empty.", "error");
                return;
            }

            // Process the data
            const headers = jsonData[0];
            const rows = jsonData.slice(1);

            // Map headers to our expected format (flexible mapping)
            const headerMapping = {};
            headers.forEach((header, index) => {
                const headerLower = header.toString().toLowerCase().trim();
                if (headerLower.includes('id') || headerLower.includes('card') || headerLower.includes('அட்டை')) {
                    headerMapping.id = index;
                } else if (headerLower.includes('name') || headerLower.includes('பெயர்')) {
                    if (!headerMapping.name) headerMapping.name = index;
                } else if (headerLower.includes('father') || headerLower.includes('தந்தை') || headerLower.includes('husband') || headerLower.includes('கணவர்')) {
                    headerMapping.father = index;
                } else if (headerLower.includes('house') || headerLower.includes('வீடு') || headerLower.includes('address')) {
                    headerMapping.house = index;
                } else if (headerLower.includes('age') || headerLower.includes('வயது')) {
                    headerMapping.age = index;
                } else if (headerLower.includes('gender') || headerLower.includes('sex') || headerLower.includes('பாலினம்')) {
                    headerMapping.gender = index;
                }
            });

            // Convert rows to our format
            const processedData = rows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')).map(row => ({
                id: row[headerMapping.id] || '',
                name: row[headerMapping.name] || '',
                father: row[headerMapping.father] || '',
                house: row[headerMapping.house] || '',
                age: parseInt(row[headerMapping.age]) || 0,
                gender: row[headerMapping.gender] || ''
            }));

            if (processedData.length === 0) {
                showStatus("No valid data found in Excel file.", "error");
                return;
            }

            data.push(...processedData);
            populateTable(processedData);
            updateLocalStorage();
            showStatus(`Successfully uploaded ${processedData.length} records from Excel file.`);
            fileInput.value = '';

        } catch (error) {
            showStatus("Error reading Excel file: " + error.message, "error");
        }
    };

    reader.readAsArrayBuffer(file);
}

function updateLocalStorage() {
    localStorage.setItem("voterListData", JSON.stringify(data));
}

function clearAllData() {
    if (confirm("⚠️ Warning: This will remove all entries permanently. Do you want to proceed?")) {
        localStorage.removeItem("voterListData");
        document.getElementById("tableBody").innerHTML = "";
        data.length = 0;
        serialNumber = 1;
        showStatus("All data cleared successfully.");
    }
}

function editRow(button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');

    // Make cells editable (skip serial number and actions)
    for (let i = 1; i < cells.length - 1; i++) {
        const cell = cells[i];
        const value = cell.textContent;
        if (i === 5) { // Age column
            cell.innerHTML = `<input type="number" value="${value}" style="width: 80px;">`;
        } else {
            cell.innerHTML = `<input type="text" value="${value}" style="width: 100px;">`;
        }
    }

    button.style.display = 'none';
    button.nextElementSibling.style.display = 'none'; // Hide delete button
    button.parentElement.querySelector('.save-btn').style.display = 'inline-block';
}

function saveRow(button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');
    const rowIndex = Array.from(row.parentElement.children).indexOf(row);

    // Get values from inputs and update data
    const updatedData = {
        id: cells[1].querySelector('input').value,
        name: cells[2].querySelector('input').value,
        father: cells[3].querySelector('input').value,
        house: cells[4].querySelector('input').value,
        age: parseInt(cells[5].querySelector('input').value) || 0,
        gender: cells[6].querySelector('input').value
    };

    // Update the data array
    data[rowIndex] = updatedData;

    // Update display
    cells[1].textContent = updatedData.id;
    cells[2].textContent = updatedData.name;
    cells[3].textContent = updatedData.father;
    cells[4].textContent = updatedData.house;
    cells[5].textContent = updatedData.age;
    cells[6].textContent = updatedData.gender;

    // Show edit and delete buttons, hide save button
    button.style.display = 'none';
    button.parentElement.querySelector('.edit-btn').style.display = 'inline-block';
    button.parentElement.querySelector('.delete-btn').style.display = 'inline-block';

    updateLocalStorage();
    showStatus("Row updated successfully.");
}

function deleteRow(button) {
    if (confirm("Are you sure you want to delete this entry?")) {
        const row = button.closest('tr');
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);

        // Remove from data array
        data.splice(rowIndex, 1);

        // Remove row from table
        row.remove();

        // Update serial numbers
        updateSerialNumbers();
        updateLocalStorage();
        showStatus("Entry deleted successfully.");
    }
}

function updateSerialNumbers() {
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
    serialNumber = rows.length + 1;
}

function downloadJSON() {
    const filtered = Array.from(document.querySelectorAll('#voterTable tbody tr'))
        .filter(row => row.style.display !== 'none')
        .map(row => {
            const cells = row.querySelectorAll('td');
            return {
                id: cells[1].innerText,
                name: cells[2].innerText,
                father: cells[3].innerText,
                house: cells[4].innerText,
                age: Number(cells[5].innerText),
                gender: cells[6].innerText
            };
        });
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voter_list.json';
    a.click();
    URL.revokeObjectURL(url);
}

function exportToCSV() {
    const rows = Array.from(document.querySelectorAll('#voterTable tbody tr'))
        .filter(row => row.style.display !== 'none');

    let csv = 'Serial No,Card No,Name,Father/Husband Name,House No,Age,Gender\n';
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [];
        for (let i = 0; i < cells.length - 1; i++) { // Exclude action column
            rowData.push(`"${cells[i].innerText}"`);
        }
        csv += rowData.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voter_list.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function exportToExcel() {
    const rows = Array.from(document.querySelectorAll('#voterTable tbody tr'))
        .filter(row => row.style.display !== 'none');

    const data_export = [
        ['Serial No', 'Card No', 'Name', 'Father/Husband Name', 'House No', 'Age', 'Gender']
    ];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [];
        for (let i = 0; i < cells.length - 1; i++) { // Exclude action column
            rowData.push(cells[i].innerText);
        }
        data_export.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(data_export);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Voter List");
    XLSX.writeFile(wb, "voter_list.xlsx");
}

function filterTable() {
    const keyword = document.getElementById("searchBar").value.toLowerCase().trim();
    const minAgeInput = document.getElementById("minAge").value;
    const maxAgeInput = document.getElementById("maxAge").value;
    const selectedColumn = document.getElementById("columnSelect").value;
    const minAge = minAgeInput === '' ? 0 : parseInt(minAgeInput);
    const maxAge = maxAgeInput === '' ? 150 : parseInt(maxAgeInput);

    const rows = document.querySelectorAll("#tableBody tr");
    const isSearchEmpty = keyword === '' && minAgeInput === '' && maxAgeInput === '';

    rows.forEach(row => {
        if (isSearchEmpty) {
            row.style.display = "";
            return;
        }

        const cells = row.querySelectorAll("td");
        const age = parseInt(cells[5].innerText) || 0;
        const matchesAge = age >= minAge && age <= maxAge;

        let matchesKeyword = false;
        if (selectedColumn === 'all') {
            const fullText = Array.from(cells).slice(1, 7).map(cell => cell.innerText.toLowerCase()).join(" ");
            matchesKeyword = fullText.includes(keyword);
        } else {
            const colIndex = parseInt(selectedColumn);
            if (!isNaN(colIndex) && cells[colIndex]) {
                matchesKeyword = cells[colIndex].innerText.toLowerCase().includes(keyword);
            }
        }

        row.style.display = matchesKeyword && matchesAge ? "" : "none";
    });
}

function resetFilters() {
    document.getElementById("searchBar").value = "";
    document.getElementById("minAge").value = "";
    document.getElementById("maxAge").value = "";
    document.getElementById("columnSelect").value = "all";
    document.getElementById("searchBar").style.display = "block";
    document.getElementById("ageFilter").style.display = "none";
    const rows = document.querySelectorAll("#tableBody tr");
    rows.forEach(row => row.style.display = "");
}

// Event listeners
document.getElementById("columnSelect").addEventListener("change", function () {
    const ageFilter = document.getElementById("ageFilter");
    const searchBar = document.getElementById("searchBar");
    const selected = this.value;
    const showAge = (selected === "all" || selected === "5");
    ageFilter.style.display = showAge ? "flex" : "none";
    searchBar.style.display = showAge ? "none" : "block";
});

function exportToPDF() {
    const { jsPDF } = window.jspdf;

    // Get filtered/visible rows
    const rows = Array.from(document.querySelectorAll('#voterTable tbody tr'))
        .filter(row => row.style.display !== 'none');

    if (rows.length === 0) {
        showStatus("No data to export to PDF.", "error");
        return;
    }

    // Create PDF with proper encoding for Unicode
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    // Function to handle Tamil text properly
    function addTamilText(doc, text, x, y, options = {}) {
        // Convert Tamil text to proper encoding
        const encodedText = unescape(encodeURIComponent(text));
        doc.text(encodedText, x, y, options);
    }

    // Add title and header information with proper Tamil encoding
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');

    // Title in both Tamil and English
    addTamilText(doc, 'வாக்காளர் பட்டியல்', 20, 20);
    doc.text('VOTER LIST', 80, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Header information with Tamil support
    addTamilText(doc, 'சட்டமன்றத் தொகுதியின் எண் மற்றும் பெயர்: 167-மன்னார்குடி', 20, 32);
    doc.text('Assembly Constituency No. & Name: 167-Mannargudi', 20, 39);

    addTamilText(doc, 'பிரிவு எண் மற்றும் பெயர்: 1-தளிக் காட்டை (வ.கி) மற்றும் (ஊ), கீழத் தெரு வார்டு-1', 20, 46);
    doc.text('Part No. & Name: 1-Thalik Kattai (V.P) & (R), Keezha Theru Ward-1', 20, 53);

    addTamilText(doc, 'பாகம் எண்: 133', 20, 60);
    doc.text('Section No: 133', 80, 60);

    addTamilText(doc, 'பட்டியல் வெளியிடப்பட்ட நாள்: 06-01-2025', 20, 67);
    doc.text('List Published Date: 06-01-2025', 120, 67);

    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 20, 74);

    // Prepare table data with proper encoding
    const tableData = rows.map(row => {
        const cells = row.querySelectorAll('td');
        return [
            cells[0].innerText, // Serial No
            cells[1].innerText, // Card No
            // Encode Tamil text properly
            unescape(encodeURIComponent(cells[2].innerText)), // Name
            unescape(encodeURIComponent(cells[3].innerText)), // Father/Husband
            cells[4].innerText, // House No
            cells[5].innerText, // Age
            unescape(encodeURIComponent(cells[6].innerText))  // Gender
        ];
    });

    // Table headers in both Tamil and English
    const tableHeaders = [
        'வரிசை எண்\nS.No',
        'அட்டை எண்\nCard No',
        'பெயர்\nName',
        'தந்தை/கணவர் பெயர்\nFather/Husband',
        'வீட்டு எண்\nHouse No',
        'வயது\nAge',
        'பாலினம்\nGender'
    ];

    // Add table using autoTable plugin with Tamil support
    doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 82,
        styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            font: 'helvetica'
        },
        headStyles: {
            fillColor: [74, 144, 226],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 4,
            halign: 'center',
            valign: 'middle'
        },
        alternateRowStyles: {
            fillColor: [249, 249, 249]
        },
        columnStyles: {
            0: { cellWidth: 18, halign: 'center' }, // S.No
            1: { cellWidth: 28, halign: 'center' }, // Card No
            2: { cellWidth: 50, halign: 'left' },   // Name
            3: { cellWidth: 50, halign: 'left' },   // Father/Husband
            4: { cellWidth: 22, halign: 'center' }, // House No
            5: { cellWidth: 18, halign: 'center' }, // Age
            6: { cellWidth: 25, halign: 'center' }  // Gender
        },
        margin: { left: 15, right: 15 },
        tableWidth: 'auto',
        theme: 'grid',
        didDrawCell: function (data) {
            // Ensure proper text rendering for Tamil content
            if (data.cell.text && data.cell.text.length > 0) {
                // Handle Tamil text rendering
                const text = data.cell.text.join(' ');
                if (/[\u0B80-\u0BFF]/.test(text)) {
                    // Tamil Unicode range detected
                    data.cell.styles.font = 'helvetica';
                }
            }
        }
    });

    // Add footer with summary in both languages
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    addTamilText(doc, `மொத்த பதிவுகள்: ${rows.length}`, 20, finalY + 15);
    doc.text(`Total Records: ${rows.length}`, 80, finalY + 15);

    // Add certification text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    addTamilText(doc, 'இந்த பட்டியல் அதிகாரப்பூர்வ வாக்காளர் பட்டியலிலிருந்து தயாரிக்கப்பட்டது', 20, finalY + 25);
    doc.text('This list is prepared from the official electoral roll', 20, finalY + 32);

    // Add page numbers with Tamil support
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        // Page number in Tamil and English
        addTamilText(doc, `பக்கம் ${i} / ${pageCount}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }

    // Save the PDF with proper filename
    const filename = `voter_list_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    showStatus(`PDF exported successfully with ${rows.length} records. Tamil text properly encoded.`);
}

// Initialize the application
initializeData();