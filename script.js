class InventoryManager {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('inventory')) || [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.renderTable();
        this.setTodayDate();
        this.attachEventListeners();
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tanggalMasuk').value = today;
    }

    attachEventListeners() {
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateKodeBarang() {
        const count = this.items.length + 1;
        return `BRG${String(count).padStart(4, '0')}`;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: this.currentEditId || this.generateId(),
            kodeBarang: document.getElementById('kodeBarang').value,
            namaBarang: document.getElementById('namaBarang').value,
            kategori: document.getElementById('kategori').value,
            stok: parseInt(document.getElementById('stok').value),
            hargaBeli: parseInt(document.getElementById('hargaBeli').value),
            hargaJual: parseInt(document.getElementById('hargaJual').value),
            tanggalMasuk: document.getElementById('tanggalMasuk').value
        };

        if (this.currentEditId) {
            const index = this.items.findIndex(item => item.id === this.currentEditId);
            this.items[index] = formData;
            this.showAlert('Data berhasil diupdate!', 'success');
        } else {
            // Cek duplikat kode barang
            const duplicate = this.items.find(item => item.kodeBarang === formData.kodeBarang);
            if (duplicate) {
                this.showAlert('Kode barang sudah ada!', 'error');
                return;
            }
            this.items.unshift(formData);
            this.showAlert('Data berhasil ditambahkan!', 'success');
        }

        this.saveData();
        this.renderTable();
        this.closeModal();
        this.resetForm();
    }

    editItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            this.currentEditId = id;
            document.getElementById('editId').value = id;
            document.getElementById('kodeBarang').value = item.kodeBarang;
            document.getElementById('namaBarang').value = item.namaBarang;
            document.getElementById('kategori').value = item.kategori;
            document.getElementById('stok').value = item.stok;
            document.getElementById('hargaBeli').value = item.hargaBeli;
            document.getElementById('hargaJual').value = item.hargaJual;
            document.getElementById('tanggalMasuk').value = item.tanggalMasuk;
            document.getElementById('modalTitle').textContent = 'Edit Barang';
            this.openModal();
        }
    }

    deleteItem(id) {
        if (confirm('Yakin ingin menghapus barang ini?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveData();
            this.renderTable();
            this.showAlert('Data berhasil dihapus!', 'success');
        }
    }

    renderTable(filteredItems = null) {
        const tbody = document.getElementById('tableBody');
        const itemsToShow = filteredItems || this.items;
        
        if (itemsToShow.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 50px; color: #6c757d;">Tidak ada data barang</td></tr>';
            return;
        }

        tbody.innerHTML = itemsToShow.map(item => {
            const stokClass = item.stok <= 5 ? 'stok-critical' : item.stok <= 20 ? 'stok-low' : '';
            const profit = item.hargaJual - item.hargaBeli;
            const profitMargin = profit > 0 ? `+Rp${profit.toLocaleString()}` : `Rp${profit.toLocaleString()}`;
            
            return `
                <tr class="${stokClass}">
                    <td>${this.items.indexOf(item) + 1}</td>
                    <td><strong>${item.kodeBarang}</strong></td>
                    <td>${item.namaBarang}</td>
                    <td>
                        <span class="badge">${item.kategori}</span>
                    </td>
                    <td><strong>${item.stok}</strong></td>
                    <td>Rp${item.hargaBeli.toLocaleString()}</td>
                    <td>Rp${item.hargaJual.toLocaleString()}</td>
                    <td>${new Date(item.tanggalMasuk).toLocaleDateString('id-ID')}</td>
                    <td class="action-buttons">
                        <button class="btn btn-primary" onclick="inventory.editItem('${item.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="inventory.deleteItem('${item.id}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    searchItems() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const filtered = this.items.filter(item => 
            item.kodeBarang.toLowerCase().includes(query) ||
            item.namaBarang.toLowerCase().includes(query) ||
            item.kategori.toLowerCase().includes(query)
        );
        this.renderTable(filtered);
    }

    saveData() {
        localStorage.setItem('inventory', JSON.stringify(this.items));
    }

    resetForm() {
        document.getElementById('itemForm').reset();
        this.currentEditId = null;
        document.getElementById('editId').value = '';
        document.getElementById('modalTitle').textContent = 'Tambah Barang';
        this.setTodayDate();
        document.getElementById('kodeBarang').value = this.generateKodeBarang();
    }

    openModal(mode = 'add') {
        document.getElementById('itemModal').style.display = 'block';
        if (mode === 'add') {
            this.resetForm();
        }
    }

    closeModal() {
        document.getElementById('itemModal').style.display = 'none';
        this.resetForm();
    }

    showAlert(message, type) {
        const alert = document.getElementById('alert');
        const alertMessage = document.getElementById('alertMessage');
        alertMessage.textContent = message;
        alert.className = `alert ${type} show`;
        setTimeout(() => {
            alert.classList.remove('show');
        }, 3000);
    }

    exportData() {
        if (this.items.length === 0) {
            this.showAlert('Tidak ada data untuk diexport!', 'error');
            return;
        }

        const headers = ['ID', 'Kode Barang', 'Nama Barang', 'Kategori', 'Stok', 'Harga Beli', 'Harga Jual', 'Tanggal Masuk'];
        const csvContent = [
            headers.join(','),
            ...this.items.map(item => [
                item.id,
                `"${item.kodeBarang}"`,
                `"${item.namaBarang}"`,
                `"${item.kategori}"`,
                item.stok,
                item.hargaBeli,
                item.hargaJual,
                item.tanggalMasuk
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showAlert('Data berhasil diexport!', 'success');
    }
}

// Global functions
const inventory = new InventoryManager();

function openModal(mode) {
    inventory.openModal(mode);
}

function closeModal() {
    inventory.closeModal();
}

function hideAlert() {
    document.getElementById('alert').classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('itemModal');
    if (event.target === modal) {
        inventory.closeModal();
    }
}

// Badge style for categories
const style = document.createElement('style');
style.textContent = `
    .badge {
        display: inline-block;
        padding: 4px 12px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
    }
`;
document.head.appendChild(style);