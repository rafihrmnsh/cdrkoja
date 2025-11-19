// Check user authentication
function checkAuth() {
    const loggedIn = localStorage.getItem('loggedIn');
    if (loggedIn !== 'true') {
        window.location.href = 'login.html';
    }
}

let reports = [];
let signaturePadShip, signaturePadAgent, signaturePadOperational;
let currentReportId;
const draftModal = new bootstrap.Modal(document.getElementById('draftModal'));

function loadReports() {
    const tableBody = document.getElementById('reports-table-body');
    const tableHead = tableBody.previousElementSibling; // Get the thead element
    reports = JSON.parse(localStorage.getItem('draftReports')) || [];

    if (reports.length === 0) {
        const numCols = tableHead.querySelector('tr').children.length;
        tableBody.innerHTML = `<tr><td colspan="${numCols}" class="text-center">No draft reports found.</td></tr>`;
        return;
    }

    let displayKeys = [
        'containerSerialNo',
        'containerStatus',
        'damageContents',
        'damageDate',
        'vessel',
        'voyageNo',
        'Status'
    ];

    let headerRow = '<tr>';
    displayKeys.forEach(key => {
        let displayHeader = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        headerRow += `<th>${displayHeader}</th>`;
    });
    headerRow += '</tr>';
    tableHead.innerHTML = headerRow;

    tableBody.innerHTML = '';

    reports.forEach(report => {
        const row = document.createElement('tr');
        row.setAttribute('data-report-id', report.id);
        row.style.cursor = 'pointer';

        const signatureCount = [report.signatureShip, report.signatureAgent, report.signatureOperational].filter(Boolean).length;
        const isSigned = signatureCount >= 2;

        let rowContent = '';
        displayKeys.forEach(key => {
            let headerText = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            if (key === 'Status') {
                rowContent += `<td data-label="${headerText}">${isSigned ? '<span class="badge bg-success">Signed</span>' : '<span class="badge bg-warning">Unsigned</span>'}</td>`;
            } else {
                let value = report[key] || '-';
                rowContent += `<td data-label="${headerText}">${value}</td>`;
            }
        });
        row.innerHTML = rowContent;
        tableBody.appendChild(row);
    });
}

function openDraftModal(reportId) {
    currentReportId = reportId;
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    document.getElementById('modal-form').reset();

    for (const key in report) {
        if (report.hasOwnProperty(key)) {
            const value = report[key];
            if (key === 'containerStatus' || key === 'damageContents') {
                const radio = document.querySelector(`#modal-form input[name="modal-${key}"][value="${value}"]`);
                if (radio) radio.checked = true;
                continue;
            }
            const el = document.getElementById(`modal-${key}`);
            if (el) {
                el.type === 'checkbox' ? el.checked = value === 'true' : el.value = value;
            }
        }
    }

    const imagePreview = document.getElementById('modal-imagePreview');
    imagePreview.innerHTML = '';
    if (report.damagePhoto) {
        const img = document.createElement('img');
        img.src = report.damagePhoto;
        img.classList.add('img-fluid', 'rounded');
        imagePreview.appendChild(img);
    }

    signaturePadShip.clear();
    signaturePadAgent.clear();
    signaturePadOperational.clear();
    if (report.signatureShip) signaturePadShip.fromDataURL(report.signatureShip);
    if (report.signatureAgent) signaturePadAgent.fromDataURL(report.signatureAgent);
    if (report.signatureOperational) signaturePadOperational.fromDataURL(report.signatureOperational);

    const signatureCount = [report.signatureShip, report.signatureAgent, report.signatureOperational].filter(Boolean).length;
    const isSigned = signatureCount >= 2;
    document.getElementById('convert-to-pdf-btn').style.display = isSigned ? 'inline-block' : 'none';

    draftModal.show();
}

async function generatePdf(reportId, jsPDF) {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Populate the hidden template
    document.getElementById('pdf-eirNo').textContent = report.eirNo || '';
    document.getElementById('pdf-damageDate').textContent = report.damageDate || '';
    document.getElementById('pdf-vessel').textContent = report.vessel || '';
    document.getElementById('pdf-voyageNo').textContent = report.voyageNo || '';
    document.getElementById('pdf-containerSerialNo').textContent = report.containerSerialNo || '';

    document.getElementById('pdf-containerStatus').textContent = `Container: ${report.containerStatus ? report.containerStatus.toUpperCase() : ''}`;
    document.getElementById('pdf-damageContents').textContent = `Damage To: Contents: ${report.damageContents ? report.damageContents.toUpperCase() : ''}`;
    document.getElementById('pdf-reportingPerson').textContent = `Signature of Person Reporting: ${report.reportingPerson || ''}`;
    document.getElementById('pdf-liableParty').textContent = report.liableParty || '';

    // Checkboxes
    const checkboxMap = {
        frontPanel: '1. Panel', frontIntExtPosts: '2. Int/Ext Posts', frontCornerPosts: '3. Corner Posts',
        sidesPanel: '4. Panel', sidesIntExtPosts: '5. Int/Ext Posts', sidesTopRail: '6. Top Rail', sidesBottomRail: '7. Bottom Rail',
        doorsPanel: '8. Panel', doorsDoorGear: '9. Door Gear', doorsCornerPost: '10. Corner Post',
        roofPanel: '11. Panel/Tift', roofTiftWire: '12. Tift Wire',
        underBearers: '13. Bearers', underGussets: '14. Gussets',
        interiorFlooring: '15. Flooring', interiorInteriorPanel: '16. Interior Panel/Battents', interiorRaftBows: '17. Roft Bows',
        othersSeals: '18. Seals'
    };

    for (const key in checkboxMap) {
        const el = document.getElementById(`pdf-${key}`);
        if (el) {
            // Using unicode characters for checked and unchecked boxes
            const checkbox = report[key] === 'true' ? '&#9745;' : '&#9744;';
            el.innerHTML = `${checkbox} ${checkboxMap[key]}`;
        }
    }

    // Damage Plan Checkboxes
    const damagePlanCheckboxes = {
        rearSideCheck: 'pdf-check-rearSideCheck',
        frontSideCheck: 'pdf-check-frontSideCheck',
        topSideCheck: 'pdf-check-topSideCheck',
        underSideCheck: 'pdf-check-underSideCheck',
        rightSideCheck: 'pdf-check-rightSideCheck',
        leftSideCheck: 'pdf-check-leftSideCheck',
        interiorCheck: 'pdf-check-interiorCheck'
    };

    for (const key in damagePlanCheckboxes) {
        const el = document.getElementById(damagePlanCheckboxes[key]);
        if (el) {
            el.innerHTML = report[key] === 'true' ? '&#9745;' : '&#9744;';
        }
    }

    // Images
    const damagePhotoEl = document.getElementById('pdf-damagePhoto');
    damagePhotoEl.innerHTML = '';
    if (report.damagePhoto) {
        const img = document.createElement('img');
        img.src = report.damagePhoto;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        damagePhotoEl.appendChild(img);
    } else {
        damagePhotoEl.textContent = 'Bagian Foto';
    }

    const sigShipEl = document.getElementById('pdf-signatureShip');
    sigShipEl.innerHTML = '';
    if (report.signatureShip) {
        const img = document.createElement('img');
        img.src = report.signatureShip;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        sigShipEl.appendChild(img);
    }

    const sigAgentEl = document.getElementById('pdf-signatureAgent');
    sigAgentEl.innerHTML = '';
    if (report.signatureAgent) {
        const img = document.createElement('img');
        img.src = report.signatureAgent;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        sigAgentEl.appendChild(img);
    }
    
    const sigOpEl = document.getElementById('pdf-signatureOperational');
    sigOpEl.innerHTML = '';
    if (report.signatureOperational) {
        const img = document.createElement('img');
        img.src = report.signatureOperational;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        sigOpEl.appendChild(img);
    }


    const pdfTemplate = document.getElementById('pdf-template-container');
    const canvas = await html2canvas(pdfTemplate, {
        scale: 2,
        useCORS: true // In case images are from other origins
    });
    const imgData = canvas.toDataURL('image/png');
    
    // Using a standard A4 size and fitting the content
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let finalWidth, finalHeight;

    if (canvasAspectRatio > pdfAspectRatio) {
        finalWidth = pdfWidth;
        finalHeight = pdfWidth / canvasAspectRatio;
    } else {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * canvasAspectRatio;
    }

    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;
    
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    pdf.save(`CDR-${report.containerSerialNo || 'report'}.pdf`);
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const { jsPDF } = window.jspdf;
    checkAuth();
    
    const canvasShip = document.getElementById('signature-pad-ship');
    const canvasAgent = document.getElementById('signature-pad-agent');
    const canvasOperational = document.getElementById('signature-pad-operational');
    
    signaturePadShip = new SignaturePad(canvasShip, { backgroundColor: 'rgb(255, 255, 255)' });
    signaturePadAgent = new SignaturePad(canvasAgent, { backgroundColor: 'rgb(255, 255, 255)' });
    signaturePadOperational = new SignaturePad(canvasOperational, { backgroundColor: 'rgb(255, 255, 255)' });

    loadReports();

    document.getElementById('clear-signature-ship').addEventListener('click', () => signaturePadShip.clear());
    document.getElementById('clear-signature-agent').addEventListener('click', () => signaturePadAgent.clear());
    document.getElementById('clear-signature-operational').addEventListener('click', () => signaturePadOperational.clear());

    document.getElementById('save-signatures-btn').addEventListener('click', () => {
        const reportIndex = reports.findIndex(r => r.id === currentReportId);
        if (reportIndex > -1) {
            if (!signaturePadShip.isEmpty()) reports[reportIndex].signatureShip = signaturePadShip.toDataURL();
            if (!signaturePadAgent.isEmpty()) reports[reportIndex].signatureAgent = signaturePadAgent.toDataURL();
            if (!signaturePadOperational.isEmpty()) reports[reportIndex].signatureOperational = signaturePadOperational.toDataURL();
            
            localStorage.setItem('draftReports', JSON.stringify(reports));
            loadReports();
            draftModal.hide();
        }
    });

    document.getElementById('convert-to-pdf-btn').addEventListener('click', () => {
        generatePdf(currentReportId, jsPDF);
    });

    document.getElementById('reports-table-body').addEventListener('click', (event) => {
        const row = event.target.closest('tr');
        if (row && row.dataset.reportId) {
            openDraftModal(row.dataset.reportId);
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        window.location.href = 'index.html';
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const tableBody = document.getElementById('reports-table-body');
        const rows = tableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // If the row is the 'no reports found' row, don't hide it
            if (row.getElementsByTagName('td').length === 1 && row.getElementsByTagName('td')[0].colSpan > 1) {
                continue;
            }
            const rowText = row.textContent.toLowerCase();
            if (rowText.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
});
