import { 
    openDB,
    addRegistro,
    getRegistrosByMonth,
    deleteRegistro,
    updateRegistro,
    getAllLocais,
    addLocal,
    getAllVeiculos,
    addVeiculo,
    getAllMotoristas,
    addMotorista
} from './db.js';

import {
    formatarData,
    validarDataNoMesSelecionado,
    // updateMonthYearLabel,
    exportToExcel,
    preencherSelect,
    carregarDadosIniciais,
    // setupMonthYearSelector
} from './utils.js';

// Configuração inicial
let currentPage = 1;
const recordsPerPage = 10;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let dadosSistema = { locais: [], veiculos: [], motoristas: [] };




// Inicialização do sistema
const initSystem = async () => {
    try {
        // Aguarda a inicialização do banco de dados
        await openDB();
        
        // Atualiza a interface
        updateMonthYearLabel(currentMonth, currentYear);

        // Configura o seletor de mês/ano
        setupMonthYearSelector();
        
        // Carrega dados iniciais
        dadosSistema = await carregarDadosIniciais();
        
        // Preenche os selects
        preencherSelect('#origem', dadosSistema.locais);
        preencherSelect('#destino', dadosSistema.locais);
        preencherSelect('#veiculo', dadosSistema.veiculos);
        preencherSelect('#motorista', dadosSistema.motoristas);
        
        // Preenche os selects de edição
        preencherSelect('#editOrigem', dadosSistema.locais);
        preencherSelect('#editDestino', dadosSistema.locais);
        preencherSelect('#editVeiculo', dadosSistema.veiculos);
        preencherSelect('#editMotorista', dadosSistema.motoristas);
        
        // Configura eventos
        configurarEventos();
        
        // Atualiza a tabela
        await atualizarTabela();
        
    } catch (error) {
        console.error('Erro na inicialização do sistema:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erro de inicialização',
            text: 'Não foi possível carregar o sistema. Por favor, recarregue a página.',
        });
    }
};

const setupMonthYearSelector = () => {
    const monthYearBtn = document.getElementById('monthYear');
    const modal = new bootstrap.Modal(document.getElementById('monthYearModal'));
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const confirmBtn = document.getElementById('confirmMonthYear');

    if (!monthYearBtn || !modal || !monthSelect || !yearSelect || !confirmBtn) {
        console.error('Elementos do seletor de mês/ano não encontrados!');
        return;
    }

    // Preenche os anos (últimos 10 anos e próximos 2)
    for (let year = currentYear - 10; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Define os valores atuais
    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // Abre o modal ao clicar no botão
    monthYearBtn.addEventListener('click', () => {
        modal.show();
    });

    // Confirma a seleção
    confirmBtn.addEventListener('click', async () => {
        currentMonth = parseInt(monthSelect.value);
        currentYear = parseInt(yearSelect.value);
        // currentPage = 1;
        
        updateMonthYearLabel(currentMonth, currentYear);
        await atualizarTabela();
        
        modal.hide();
    });
};

// Função para atualizar o label
export const updateMonthYearLabel = (month, year) => {
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                       "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const label = document.getElementById('monthYearLabel');
    
    if (label) {
        label.textContent = `${monthNames[month - 1]}/${year}`;
    }
};

 const configurarEventos = () => {
    // Seletor de mês/ano
    document.getElementById('monthYear')?.addEventListener('click', () => {
        document.getElementById('monthYearInput')?.click();
    });
    
    document.getElementById('monthYearInput')?.addEventListener('change', function() {
        const [year, month] = this.value.split('-');
        currentMonth = parseInt(month);
        currentYear = parseInt(year);
        currentPage = 1;
        updateMonthYearLabel(currentMonth, currentYear);
        atualizarTabela();
    });
    
    // Formulário de registro
    document.getElementById('registrationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarRegistro();
    });
    
    // Campo de busca
    document.getElementById('searchInput')?.addEventListener('keyup', () => {
        currentPage = 1;
        atualizarTabela();
    });
    
    // Configura datepicker
    if (window.flatpickr) {
        flatpickr("#data", {
            dateFormat: "Y-m-d",
            defaultDate: "today",
            locale: "pt",
            onChange: function(selectedDates, dateStr) {
                if (!validarDataNoMesSelecionado(dateStr, currentMonth, currentYear)) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Data inválida',
                        text: `Por favor, selecione uma data dentro de ${document.getElementById('monthYearLabel')?.textContent || 'do mês selecionado'}`,
                    });
                    document.getElementById('data').value = '';
                }
            }
        });
    }
};

const salvarRegistro = async () => {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    
    const dataValue = form.data.value;
    if (!validarDataNoMesSelecionado(dataValue, currentMonth, currentYear)) {
        return;
    }
    
    try {
        await addRegistro({
            data: dataValue,
            hora: form.hora.value,
            origem: form.origem.value,
            destino: form.destino.value,
            veiculo: form.veiculo.value,
            quantidade: parseInt(form.quantidade.value) || 1,
            motorista: form.motorista.value,
            observacoes: form.observacoes?.value || '',
            criadoEm: new Date().toISOString()
        });
        
        await Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Registro salvo!',
            showConfirmButton: false,
            timer: 1500
        });
        
        // form.reset();
        await atualizarTabela();
        
    } catch (error) {
        console.error('Erro ao salvar registro:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível salvar o registro. Por favor, tente novamente.',
        });
    }
};

const atualizarTabela = async () => {
    try {
        const registros = await getRegistrosByMonth(currentYear, currentMonth);
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        
        // Filtra os registros
        const registrosFiltrados = registros.filter(reg => {
            return (
                reg.origem?.toLowerCase().includes(searchTerm) ||
                reg.destino?.toLowerCase().includes(searchTerm) ||
                reg.veiculo?.toLowerCase().includes(searchTerm) ||
                reg.motorista?.toLowerCase().includes(searchTerm) ||
                reg.observacoes?.toLowerCase().includes(searchTerm)
            );
        });
        
        // Atualiza contador
        const registrosCount = document.getElementById('registrosCount');
        if (registrosCount) {
            registrosCount.textContent = `Mostrando ${registrosFiltrados.length} registro(s)`;
        }
        
        // Atualiza paginação
        updatePagination(registrosFiltrados.length);
        
        // Mostra os registros
        mostrarRegistros(registrosFiltrados);
        
    } catch (error) {
        console.error('Erro ao atualizar tabela:', error);
        const tbody = document.getElementById('registros');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-danger">
                        Erro ao carregar registros
                    </td>
                </tr>
            `;
        }
    }
};

const mostrarRegistros = (registros) => {
    const tbody = document.getElementById('registros');
    if (!tbody) return;
    
    if (!registros || registros.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    Nenhum registro encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    // Calcula os registros para a página atual
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const registrosPagina = registros.slice(startIndex, endIndex);
    
    // Cria as linhas da tabela
    tbody.innerHTML = registrosPagina.map(reg => `
        <tr>
            <td>${formatarData(reg.data)}</td>
            <td>${reg.hora || ''}</td>
            <td><span class="badge badge-transport">${reg.origem || ''}</span></td>
            <td><span class="badge badge-transport">${reg.destino || ''}</span></td>
            <td>${reg.veiculo || ''}</td>
            <td><span class="badge bg-primary rounded-pill">${reg.quantidade || 0}</span></td>
            <td>${reg.motorista || ''}</td>
            <td>${reg.observacoes || ''}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editarRegistro(${reg.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusao(${reg.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

const updatePagination = (totalItems) => {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalItems / recordsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">&laquo;</a>
        </li>
    `;
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1)">1</a>
            </li>
            ${startPage > 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
        `;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        html += `
            ${endPage < totalPages - 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a>
            </li>
        `;
    }
    
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">&raquo;</a>
        </li>
    `;
    
    pagination.innerHTML = html;
};

// Funções globais
window.editarRegistro = async (id) => {
    try {
        const registros = await getRegistrosByMonth(currentYear, currentMonth);
        const registro = registros.find(r => r.id === id);
        
        if (!registro) {
            await Swal.fire('Erro', 'Registro não encontrado', 'error');
            return;
        }
        
        document.getElementById('editId').value = registro.id;
        document.getElementById('editData').value = registro.data;
        document.getElementById('editHora').value = registro.hora || '';
        document.getElementById('editOrigem').value = registro.origem || '';
        document.getElementById('editDestino').value = registro.destino || '';
        document.getElementById('editVeiculo').value = registro.veiculo || '';
        document.getElementById('editQuantidade').value = registro.quantidade || 1;
        document.getElementById('editMotorista').value = registro.motorista || '';
        document.getElementById('editObservacoes').value = registro.observacoes || '';
        
        // Abre o modal de edição
        const modal = new bootstrap.Modal(document.getElementById('editarModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao editar registro:', error);
        await Swal.fire('Erro', 'Não foi possível carregar o registro', 'error');
    }
};

window.salvarEdicao = async () => {
    const form = document.getElementById('editForm');
    if (!form) return;
    
    const id = parseInt(form.editId.value);
    const dataValue = form.editData.value;
    
    if (!validarDataNoMesSelecionado(dataValue, currentMonth, currentYear)) {
        await Swal.fire('Erro', 'A data deve ser do mês selecionado', 'error');
        return;
    }
    
    try {
        await updateRegistro({
            id: id,
            data: dataValue,
            hora: form.editHora.value,
            origem: form.editOrigem.value,
            destino: form.editDestino.value,
            veiculo: form.editVeiculo.value,
            quantidade: parseInt(form.editQuantidade.value) || 1,
            motorista: form.editMotorista.value,
            observacoes: form.editObservacoes?.value || '',
            criadoEm: form.editCriadoEm?.value || new Date().toISOString()
        });
        
        // Fecha o modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editarModal'));
        modal.hide();
        
        await Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Registro atualizado!',
            showConfirmButton: false,
            timer: 1500
        });
        
        await atualizarTabela();
        
    } catch (error) {
        console.error('Erro ao atualizar registro:', error);
        await Swal.fire('Erro', 'Não foi possível atualizar o registro', 'error');
    }
};

window.confirmarExclusao = async (id) => {
    try {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Você não poderá reverter isso!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            await deleteRegistro(id);
            await atualizarTabela();
            
            await Swal.fire(
                'Excluído!',
                'O registro foi removido.',
                'success'
            );
        }
    } catch (error) {
        console.error('Erro ao excluir registro:', error);
        await Swal.fire('Erro', 'Não foi possível excluir o registro', 'error');
    }
};

window.changePage = (page) => {
    currentPage = page;
    atualizarTabela();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.exportToExcel = async () => {
    try {
        const registros = await getRegistrosByMonth(currentYear, currentMonth);
        await exportToExcel(registros);
    } catch (error) {
        console.error('Erro ao exportar:', error);
        await Swal.fire('Erro', 'Falha ao exportar os dados', 'error');
    }
};

window.salvarLocal = async () => {
    const nome = document.getElementById('novoLocal')?.value.trim();
    if (!nome) {
        await Swal.fire('Erro', 'Por favor, informe um nome para o local', 'error');
        return;
    }
    
    try {
        await addLocal(nome);
        dadosSistema.locais = await getAllLocais();
        
        preencherSelect('#origem', dadosSistema.locais);
        preencherSelect('#destino', dadosSistema.locais);
        preencherSelect('#editOrigem', dadosSistema.locais);
        preencherSelect('#editDestino', dadosSistema.locais);
        
        document.getElementById('novoLocal').value = '';
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('localModal'));
        modal.hide();
        
        await Swal.fire('Sucesso', 'Local cadastrado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar local:', error);
        await Swal.fire('Erro', 'Não foi possível cadastrar o local', 'error');
    }
};

window.salvarVeiculo = async () => {
    const nome = document.getElementById('novoVeiculo')?.value.trim();
    if (!nome) {
        await Swal.fire('Erro', 'Por favor, informe a identificação do veículo', 'error');
        return;
    }
    
    try {
        await addVeiculo(nome);
        dadosSistema.veiculos = await getAllVeiculos();
        
        preencherSelect('#veiculo', dadosSistema.veiculos);
        preencherSelect('#editVeiculo', dadosSistema.veiculos);
        
        document.getElementById('novoVeiculo').value = '';
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('veiculoModal'));
        modal.hide();
        
        await Swal.fire('Sucesso', 'Veículo cadastrado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar veículo:', error);
        await Swal.fire('Erro', 'Não foi possível cadastrar o veículo', 'error');
    }
};

window.salvarMotorista = async () => {
    const nome = document.getElementById('novoMotorista')?.value.trim();
    if (!nome) {
        await Swal.fire('Erro', 'Por favor, informe o nome do motorista', 'error');
        return;
    }
    
    try {
        await addMotorista(nome);
        dadosSistema.motoristas = await getAllMotoristas();
        
        preencherSelect('#motorista', dadosSistema.motoristas);
        preencherSelect('#editMotorista', dadosSistema.motoristas);
        
        document.getElementById('novoMotorista').value = '';
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('motoristaModal'));
        modal.hide();
        
        await Swal.fire('Sucesso', 'Motorista cadastrado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar motorista:', error);
        await Swal.fire('Erro', 'Não foi possível cadastrar o motorista', 'error');
    }
};

// Inicializa o sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initSystem);