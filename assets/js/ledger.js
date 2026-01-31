// ========== EXTRATO FINANCEIRO ==========

class LedgerManager {
    constructor() {
        this.ledgerData = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Botão de exportar extrato
        const exportBtn = document.getElementById('export-extrato-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportExtrato();
            });
        }
        
        // Botão de filtrar extrato
        const filterBtn = document.getElementById('filter-extrato-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.showFilterModal();
            });
        }
        
        // Botão de recarregar extrato
        const refreshBtn = document.getElementById('refresh-extrato-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadLedger(true);
            });
        }
    }
    
    // Carregar extrato
    async loadLedger(forceRefresh = false) {
        if (!authManager || !authManager.isLoggedIn()) {
            this.showLoginRequired();
            return;
        }
        
        try {
            showLoading('Carregando extrato...');
            
            const result = await callApi('get_extrato', {
                user_id: authManager.getUserId()
            });
            
            if (result.success) {
                this.ledgerData = result.data || [];
                this.renderLedger();
                
                // Atualizar estatísticas
                this.updateLedgerStats();
                
                console.log(`✅ Extrato carregado: ${this.ledgerData.length} transações`);
            } else {
                throw new Error(result.message || 'Erro ao carregar extrato');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar extrato:', error);
            showNotification('Erro ao carregar extrato', 'error');
            this.renderEmptyState();
        } finally {
            hideLoading();
        }
    }
    
    // Renderizar extrato
    renderLedger() {
        const container = document.getElementById('ledgerContent') || 
                         document.querySelector('#transaction-history tbody') ||
                         document.querySelector('.extrato-table tbody');
        
        if (!container) return;
        
        // Estado vazio
        if (!this.ledgerData || this.ledgerData.length === 0) {
            this.renderEmptyState(container);
            return;
        }
        
        // Ordenar por data (mais recente primeiro)
        const sortedData = [...this.ledgerData].sort((a, b) => {
            const dateA = new Date(a.data || a.Data || 0);
            const dateB = new Date(b.data || b.Data || 0);
            return dateB - dateA;
        });
        
        // Renderizar transações
        container.innerHTML = sortedData.map(transaction => {
            const amount = parseFloat(transaction.valor || transaction.Valor || 0);
            const type = (transaction.tipo || transaction.Tipo || '').toLowerCase();
            const description = transaction.descricao || transaction.Descricao || '';
            const date = transaction.data || transaction.Data || '';
            const contractId = transaction.contrato_id || '';
            
            // Determinar estilo baseado no tipo
            let typeClass = 'text-muted';
            let typeIcon = 'fas fa-receipt';
            let typeBadge = 'secondary';
            let typeLabel = 'Transação';
            
            if (type.includes('deposito') || type.includes('royalty') || amount > 0) {
                typeClass = 'text-success';
                typeIcon = 'fas fa-plus-circle';
                typeBadge = 'success';
                typeLabel = 'Entrada';
            } else if (type.includes('compra') || type.includes('investimento') || amount < 0) {
                typeClass = 'text-danger';
                typeIcon = 'fas fa-shopping-cart';
                typeBadge = 'danger';
                typeLabel = 'Investimento';
            } else if (type.includes('venda') || type.includes('receita')) {
                typeClass = 'text-info';
                typeIcon = 'fas fa-arrow-up-right';
                typeBadge = 'info';
                typeLabel = 'Venda';
            } else if (type.includes('saque')) {
                typeClass = 'text-warning';
                typeIcon = 'fas fa-money-bill-wave';
                typeBadge = 'warning';
                typeLabel = 'Saque';
            } else if (type.includes('royalty')) {
                typeClass = 'text-primary';
                typeIcon = 'fas fa-crown';
                typeBadge = 'primary';
                typeLabel = 'Royalty';
            }
            
            // Formatar data
            const formattedDate = date ? new Date(date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : '--/--/----';
            
            // Formatar hora
            const formattedTime = date ? new Date(date).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '--:--';
            
            return `
                <tr class="ledger-row">
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${typeBadge} me-2">
                                <i class="${typeIcon}"></i>
                            </span>
                            <div>
                                <div class="fw-bold">${typeLabel}</div>
                                <small class="text-muted">${formattedDate} ${formattedTime}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="transaction-desc">${description}</div>
                        ${contractId ? `
                            <small class="text-muted">
                                <i class="fas fa-file-contract"></i> ${contractId}
                            </small>
                        ` : ''}
                    </td>
                    <td class="text-end">
                        <div class="${typeClass} fw-bold fs-5">
                            ${amount >= 0 ? '+' : ''}R$ ${Math.abs(amount).toFixed(2)}
                        </div>
                        <small class="text-muted">
                            ${amount >= 0 ? 'Crédito' : 'Débito'}
                        </small>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Adicionar event listeners para ver contratos
        this.setupTransactionListeners();
    }
    
    renderEmptyState(container = null) {
        const targetContainer = container || 
                               document.getElementById('ledgerContent') || 
                               document.querySelector('#transaction-history tbody');
        
        if (!targetContainer) return;
        
        targetContainer.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-5">
                    <div class="empty-state-actionable">
                        <i class="fas fa-receipt empty-icon fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted mb-2">Nenhuma transação encontrada</h5>
                        <p class="text-muted mb-4">Faça seu primeiro investimento para ver transações aqui</p>
                        <div class="mt-3">
                            <button class="btn btn-primary me-2" onclick="mivApp.navigateTo('marketplace')">
                                <i class="fas fa-shopping-cart me-2"></i> Explorar Marketplace
                            </button>
                            <button class="btn btn-outline-success" onclick="mivApp.showAddFundsModal()">
                                <i class="fas fa-plus-circle me-2"></i> Adicionar Saldo
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }
    
    showLoginRequired() {
        const ledgerContainer = document.getElementById('ledger-view') || 
                               document.querySelector('.ledger-container');
        
        if (ledgerContainer) {
            ledgerContainer.innerHTML = `
                <div class="login-required text-center py-5">
                    <i class="fas fa-sign-in-alt fa-4x text-muted mb-4"></i>
                    <h3 class="mb-3">Login necessário</h3>
                    <p class="text-muted mb-4">Faça login para visualizar seu extrato financeiro</p>
                    <button class="btn btn-primary" onclick="showLoginModal()">
                        <i class="fas fa-sign-in-alt me-2"></i> Fazer Login
                    </button>
                </div>
            `;
        }
    }
    
    updateLedgerStats() {
        if (!this.ledgerData || this.ledgerData.length === 0) return;
        
        // Calcular estatísticas
        let totalDeposits = 0;
        let totalInvestments = 0;
        let totalRoyalties = 0;
        let totalWithdrawals = 0;
        let lastTransaction = null;
        
        this.ledgerData.forEach(transaction => {
            const amount = parseFloat(transaction.valor || 0);
            const type = (transaction.tipo || '').toLowerCase();
            
            if (amount > 0) {
                if (type.includes('deposito')) totalDeposits += amount;
                else if (type.includes('royalty')) totalRoyalties += amount;
            } else if (amount < 0) {
                if (type.includes('compra') || type.includes('investimento')) {
                    totalInvestments += Math.abs(amount);
                } else if (type.includes('saque')) {
                    totalWithdrawals += Math.abs(amount);
                }
            }
            
            // Última transação
            const date = new Date(transaction.data || 0);
            if (!lastTransaction || date > lastTransaction.date) {
                lastTransaction = { date, transaction };
            }
        });
        
        // Atualizar elementos de estatísticas
        const updateStat = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = `R$ ${value.toFixed(2)}`;
            }
        };
        
        updateStat('stats-total-depositos', totalDeposits);
        updateStat('stats-total-investimentos', totalInvestments);
        updateStat('stats-total-royalties', totalRoyalties);
        updateStat('stats-total-saques', totalWithdrawals);
        
        // Última transação
        const lastTransactionEl = document.getElementById('last-transaction-info');
        if (lastTransactionEl && lastTransaction) {
            const desc = lastTransaction.transaction.descricao || 'Última transação';
            const date = lastTransaction.date.toLocaleDateString('pt-BR');
            lastTransactionEl.textContent = `${desc} em ${date}`;
        }
    }
    
    setupTransactionListeners() {
        // Botões para ver contratos
        document.querySelectorAll('.view-contract-btn, .view-transaction-contract').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contractId = btn.dataset.contractId;
                if (contractId) {
                    this.viewContract(contractId);
                }
            });
        });
    }
    
    viewContract(contractId) {
        // Abrir modal com detalhes do contrato
        const contract = this.findContractById(contractId);
        
        if (contract) {
            this.showContractModal(contract);
        } else {
            // Tentar buscar da API
            this.fetchContractDetails(contractId);
        }
    }
    
    findContractById(contractId) {
        // Buscar em ledgerData
        return this.ledgerData.find(t => t.contrato_id === contractId);
    }
    
    async fetchContractDetails(contractId) {
        try {
            showLoading('Buscando contrato...');
            
            // Aqui você precisaria criar um endpoint no backend para buscar contratos
            // Por enquanto, mostraremos uma mensagem
            showNotification('Funcionalidade de visualização de contrato em desenvolvimento', 'info');
            
        } catch (error) {
            console.error('❌ Erro ao buscar contrato:', error);
            showNotification('Contrato não encontrado', 'error');
        } finally {
            hideLoading();
        }
    }
    
    showContractModal(contract) {
        const modalHTML = `
            <div class="modal-overlay" id="contract-modal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3><i class="fas fa-file-contract"></i> Detalhes do Contrato</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="contract-details">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Número do Contrato:</strong><br>
                                    <code>${contract.contrato_id || 'N/A'}</code>
                                </div>
                                <div class="col-md-6">
                                    <strong>Data:</strong><br>
                                    ${new Date(contract.data || contract.Data).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-12">
                                    <strong>Descrição:</strong><br>
                                    ${contract.descricao || contract.Descricao || 'N/A'}
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Tipo:</strong><br>
                                    ${contract.tipo || contract.Tipo || 'N/A'}
                                </div>
                                <div class="col-md-6">
                                    <strong>Valor:</strong><br>
                                    <span class="${parseFloat(contract.valor || 0) >= 0 ? 'text-success' : 'text-danger'}">
                                        R$ ${Math.abs(parseFloat(contract.valor || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="contract-actions mt-4">
                                <button class="btn btn-outline-primary me-2" onclick="printContract()">
                                    <i class="fas fa-print"></i> Imprimir
                                </button>
                                <button class="btn btn-outline-success" onclick="downloadContract()">
                                    <i class="fas fa-download"></i> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeContractModal()">Fechar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Exportar extrato para CSV
    exportExtrato() {
        if (!this.ledgerData || this.ledgerData.length === 0) {
            showNotification('Nenhuma transação para exportar', 'warning');
            return;
        }
        
        // Preparar dados para exportação
        const exportData = this.ledgerData.map(transaction => ({
            Data: new Date(transaction.data || transaction.Data).toLocaleDateString('pt-BR'),
            Hora: new Date(transaction.data || transaction.Data).toLocaleTimeString('pt-BR'),
            Descrição: transaction.descricao || transaction.Descricao || '',
            Tipo: transaction.tipo || transaction.Tipo || '',
            'ID Contrato': transaction.contrato_id || '',
            Valor: `R$ ${parseFloat(transaction.valor || transaction.Valor || 0).toFixed(2)}`,
            Status: transaction.status || 'Concluído'
        }));
        
        // Nome do arquivo com data atual
        const date = new Date().toISOString().split('T')[0];
        const filename = `extrato_selomiv_${date}.csv`;
        
        // Exportar para CSV
        this.exportToCSV(exportData, filename);
        
        showNotification('Extrato exportado com sucesso!', 'success');
    }
    
    exportToCSV(data, filename) {
        // Criar cabeçalho CSV
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','), // Cabeçalho
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escapar vírgulas e aspas
                    const escaped = ('' + value).replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            )
        ];
        
        const csvString = csvRows.join('\n');
        
        // Criar blob e link de download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    showFilterModal() {
        const modalHTML = `
            <div class="modal-overlay" id="filter-extrato-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-filter"></i> Filtrar Extrato</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <form id="filter-extrato-form">
                            <div class="form-group">
                                <label for="filter-type">Tipo de Transação</label>
                                <select id="filter-type" class="form-control" multiple>
                                    <option value="all" selected>Todas</option>
                                    <option value="deposito">Depósitos</option>
                                    <option value="compra">Compras/Investimentos</option>
                                    <option value="venda">Vendas</option>
                                    <option value="royalty">Royalties</option>
                                    <option value="saque">Saques</option>
                                </select>
                                <small class="form-text">Selecione um ou mais tipos</small>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="filter-date-start">Data Inicial</label>
                                        <input type="date" id="filter-date-start" class="form-control">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="filter-date-end">Data Final</label>
                                        <input type="date" id="filter-date-end" class="form-control">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="filter-amount-min">Valor Mínimo (R$)</label>
                                <input type="number" id="filter-amount-min" class="form-control" min="0" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label for="filter-amount-max">Valor Máximo (R$)</label>
                                <input type="number" id="filter-amount-max" class="form-control" min="0" step="0.01">
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="reset-filter">Limpar Filtros</button>
                        <button class="btn btn-primary" id="apply-filter">Aplicar Filtros</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('filter-extrato-modal');
        
        // Aplicar filtros
        document.getElementById('apply-filter').addEventListener('click', () => {
            const filters = this.getCurrentFilters();
            this.applyFilters(filters);
            modal.remove();
        });
        
        // Limpar filtros
        document.getElementById('reset-filter').addEventListener('click', () => {
            this.clearFilters();
            modal.remove();
        });
        
        // Fechar modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    getCurrentFilters() {
        const typeSelect = document.getElementById('filter-type');
        const selectedTypes = Array.from(typeSelect.selectedOptions).map(opt => opt.value);
        
        return {
            types: selectedTypes.includes('all') ? [] : selectedTypes,
            dateStart: document.getElementById('filter-date-start').value,
            dateEnd: document.getElementById('filter-date-end').value,
            amountMin: parseFloat(document.getElementById('filter-amount-min').value) || null,
            amountMax: parseFloat(document.getElementById('filter-amount-max').value) || null
        };
    }
    
    applyFilters(filters) {
        let filteredData = [...this.ledgerData];
        
        // Filtrar por tipo
        if (filters.types.length > 0) {
            filteredData = filteredData.filter(transaction => {
                const type = (transaction.tipo || '').toLowerCase();
                return filters.types.some(filterType => 
                    type.includes(filterType.toLowerCase())
                );
            });
        }
        
        // Filtrar por data
        if (filters.dateStart) {
            const startDate = new Date(filters.dateStart);
            filteredData = filteredData.filter(transaction => {
                const transDate = new Date(transaction.data || transaction.Data);
                return transDate >= startDate;
            });
        }
        
        if (filters.dateEnd) {
            const endDate = new Date(filters.dateEnd);
            endDate.setHours(23, 59, 59, 999); // Final do dia
            filteredData = filteredData.filter(transaction => {
                const transDate = new Date(transaction.data || transaction.Data);
                return transDate <= endDate;
            });
        }
        
        // Filtrar por valor
        if (filters.amountMin !== null) {
            filteredData = filteredData.filter(transaction => {
                const amount = Math.abs(parseFloat(transaction.valor || 0));
                return amount >= filters.amountMin;
            });
        }
        
        if (filters.amountMax !== null) {
            filteredData = filteredData.filter(transaction => {
                const amount = Math.abs(parseFloat(transaction.valor || 0));
                return amount <= filters.amountMax;
            });
        }
        
        // Renderizar dados filtrados
        this.renderFilteredLedger(filteredData);
    }
    
    renderFilteredLedger(filteredData) {
        const container = document.getElementById('ledgerContent');
        if (!container) return;
        
        if (filteredData.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-search fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Nenhuma transação encontrada</h5>
                            <p class="text-muted">Tente ajustar seus filtros de busca</p>
                            <button class="btn btn-outline-primary mt-3" onclick="ledgerManager.clearFilters()">
                                <i class="fas fa-times me-2"></i> Limpar Filtros
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Reutilizar a lógica de renderização com dados filtrados
        const tempData = this.ledgerData;
        this.ledgerData = filteredData;
        this.renderLedger();
        this.ledgerData = tempData;
        
        // Adicionar indicador de filtro ativo
        const filterIndicator = document.getElementById('filter-indicator');
        if (!filterIndicator) {
            const table = container.closest('table');
            if (table) {
                const caption = document.createElement('caption');
                caption.id = 'filter-indicator';
                caption.className = 'text-muted small p-2';
                caption.innerHTML = `
                    <i class="fas fa-filter text-primary me-1"></i>
                    Mostrando ${filteredData.length} de ${this.ledgerData.length} transações
                    <button class="btn btn-sm btn-link ms-2" onclick="ledgerManager.clearFilters()">
                        <i class="fas fa-times"></i> Limpar filtros
                    </button>
                `;
                table.insertBefore(caption, table.firstChild);
            }
        } else {
            filterIndicator.innerHTML = `
                <i class="fas fa-filter text-primary me-1"></i>
                Mostrando ${filteredData.length} de ${this.ledgerData.length} transações
                <button class="btn btn-sm btn-link ms-2" onclick="ledgerManager.clearFilters()">
                    <i class="fas fa-times"></i> Limpar filtros
                </button>
            `;
        }
    }
    
    clearFilters() {
        // Remover indicador de filtro
        const filterIndicator = document.getElementById('filter-indicator');
        if (filterIndicator) {
            filterIndicator.remove();
        }
        
        // Recarregar extrato completo
        this.loadLedger();
    }
}

// Inicializar gerenciador de extrato
document.addEventListener('DOMContentLoaded', function() {
    window.ledgerManager = new LedgerManager();
    
    // Carregar extrato se o usuário estiver logado
    if (authManager && authManager.isLoggedIn()) {
        setTimeout(() => {
            ledgerManager.loadLedger();
        }, 1000);
    }
});

// Exportar funções globais
window.loadLedger = function(forceRefresh = false) {
    if (window.ledgerManager) {
        window.ledgerManager.loadLedger(forceRefresh);
    }
};

window.exportExtrato = function() {
    if (window.ledgerManager) {
        window.ledgerManager.exportExtrato();
    }
};
