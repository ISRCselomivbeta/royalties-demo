// ========== EXTRATO FINANCEIRO ==========

// Carregar extrato
async function loadLedger(forceRefresh = false) {
    if (!state.currentUser) return;
    
    try {
        showLoading('Carregando extrato...');
        
        const result = await dataManager.getExtrato(
            state.currentUser.id || state.currentUser.email
        );
        
        if (result.success) {
            state.ledgerData = result.data || [];
            renderLedger();
        }
    } catch (error) {
        console.error('Erro ao carregar extrato:', error);
        renderLedger();
    } finally {
        hideLoading();
    }
}

// Renderizar extrato
function renderLedger() {
    const container = document.getElementById('ledgerContent');
    if (!container) return;
    
    // Estado vazio
    if (!state.ledgerData || state.ledgerData.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-5">
                    <div class="empty-state-actionable">
                        <i class="bi bi-receipt empty-icon"></i>
                        <h5 class="text-muted">Nenhuma transação encontrada</h5>
                        <p class="text-muted">Faça seu primeiro investimento para ver transações aqui</p>
                        <div class="mt-3">
                            <button class="btn-miv me-2" onclick="changeSection('marketplace')">
                                <i class="bi bi-currency-dollar me-2"></i> Investir Agora
                            </button>
                            <button class="btn btn-outline-success" onclick="openAddBalanceModal()">
                                <i class="bi bi-plus-circle me-2"></i> Adicionar Saldo
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const sortedData = [...state.ledgerData].sort((a, b) => {
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
        
        // Determinar estilo baseado no tipo
        let typeClass = 'text-muted';
        let typeIcon = 'bi-receipt';
        let typeBadge = 'secondary';
        
        if (type.includes('deposito') || type.includes('royalty') || amount > 0) {
            typeClass = 'text-success';
            typeIcon = 'bi-plus-circle';
            typeBadge = 'success';
        } else if (type.includes('compra') || type.includes('investimento') || amount < 0) {
            typeClass = 'text-danger';
            typeIcon = 'bi-currency-dollar';
            typeBadge = 'danger';
        } else if (type.includes('venda') || type.includes('receita')) {
            typeClass = 'text-info';
            typeIcon = 'bi-arrow-up-right';
            typeBadge = 'info';
        } else if (type.includes('saque')) {
            typeClass = 'text-warning';
            typeIcon = 'bi-cash-coin';
            typeBadge = 'warning';
        }
        
        return `
            <tr>
                <td>
                    <small class="text-muted">${formatDate(date)}</small>
                </td>
                <td>
                    <span class="badge bg-${typeBadge} me-2">
                        <i class="bi ${typeIcon}"></i>
                    </span>
                    ${description}
                </td>
                <td class="text-end ${typeClass} fw-bold">
                    ${amount >= 0 ? '+' : ''}${formatCurrency(amount)}
                </td>
            </tr>
        `;
    }).join('');
}

// Exportar extrato para CSV
function exportExtrato() {
    if (!state.ledgerData || state.ledgerData.length === 0) {
        showToast('Nenhuma transação para exportar', 'warning');
        return;
    }
    
    // Preparar dados para exportação
    const exportData = state.ledgerData.map(transaction => ({
        Data: transaction.data || transaction.Data || '',
        Descrição: transaction.descricao || transaction.Descricao || '',
        Tipo: transaction.tipo || transaction.Tipo || '',
        Valor: transaction.valor || transaction.Valor || 0
    }));
    
    // Nome do arquivo com data atual
    const date = new Date().toISOString().split('T')[0];
    const filename = `extrato_selomiv_${date}.csv`;
    
    // Exportar
    exportToCSV(exportData, filename);
}

// Exportar funções
window.loadLedger = loadLedger;
window.exportExtrato = exportExtrato;
