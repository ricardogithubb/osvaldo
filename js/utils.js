import { openDB,
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

let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

export const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const [year, month, day] = dataStr.split('-');
    return `${day}/${month}/${year}`;
};

export const validarDataNoMesSelecionado = (dateStr, currentMonth, currentYear) => {
    if (!dateStr) return false;
    
    try {
        const selectedDate = new Date(dateStr);
        const selectedMonth = selectedDate.getMonth() + 1;
        const selectedYear = selectedDate.getFullYear();
        
        return selectedMonth === currentMonth && selectedYear === currentYear;
    } catch (error) {
        console.error('Erro ao validar data:', error);
        return false;
    }
};

// Configuração do seletor customizado
// const setupMonthYearSelector = () => {
//     const monthYearBtn = document.getElementById('monthYear');
//     const modal = new bootstrap.Modal(document.getElementById('monthYearModal'));
//     const monthSelect = document.getElementById('monthSelect');
//     const yearSelect = document.getElementById('yearSelect');
//     const confirmBtn = document.getElementById('confirmMonthYear');

//     if (!monthYearBtn || !modal || !monthSelect || !yearSelect || !confirmBtn) {
//         console.error('Elementos do seletor de mês/ano não encontrados!');
//         return;
//     }

//     // Preenche os anos (últimos 10 anos e próximos 2)
//     for (let year = currentYear - 10; year <= currentYear + 2; year++) {
//         const option = document.createElement('option');
//         option.value = year;
//         option.textContent = year;
//         yearSelect.appendChild(option);
//     }

//     // Define os valores atuais
//     monthSelect.value = currentMonth;
//     yearSelect.value = currentYear;

//     // Abre o modal ao clicar no botão
//     monthYearBtn.addEventListener('click', () => {
//         modal.show();
//     });

//     // Confirma a seleção
//     confirmBtn.addEventListener('click', async () => {
//         currentMonth = parseInt(monthSelect.value);
//         currentYear = parseInt(yearSelect.value);
//         // currentPage = 1;
        
//         updateMonthYearLabel(currentMonth, currentYear);
//         await atualizarTabela();
        
//         modal.hide();
//     });
// };

// // Função para atualizar o label
// export const updateMonthYearLabel = (month, year) => {
//     const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
//                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
//     const label = document.getElementById('monthYearLabel');
    
//     if (label) {
//         label.textContent = `${monthNames[month - 1]}/${year}`;
//     }
// };

export const exportToExcel = async (registrosFiltrados) => {
    if (!registrosFiltrados || registrosFiltrados.length === 0) {
        await Swal.fire('Aviso', 'Nenhum registro para exportar', 'warning');
        return;
    }

    try {
        const dados = registrosFiltrados.map(reg => ({
            'Data': formatarData(reg.data),
            'Hora': reg.hora || '',
            'Origem': reg.origem || '',
            'Destino': reg.destino || '',
            'Veículo': reg.veiculo || '',
            'Quantidade': reg.quantidade || 0,
            'Motorista': reg.motorista || '',
            'Observações': reg.observacoes || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transportes");

        const date = new Date();
        const fileName = `transportes_${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}.xlsx`;
        XLSX.writeFile(wb, fileName);
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        await Swal.fire('Erro', 'Falha ao exportar os dados', 'error');
    }
};

export const preencherSelect = (selector, items) => {
    if (!selector || !items) return;
    
    try {
        const element = document.querySelector(selector);
        if (!element) return;

        element.innerHTML = '';
        
        if (Array.isArray(items) && items.length > 0) {
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                element.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum item disponível';
            element.appendChild(option);
        }
    } catch (error) {
        console.error(`Erro ao preencher select ${selector}:`, error);
    }
};

export const carregarDadosIniciais = async () => {
    try {
        const [locais, veiculos, motoristas] = await Promise.all([
            getAllLocais(),
            getAllVeiculos(),
            getAllMotoristas()
        ]);
        
        return { 
            locais: locais || [], 
            veiculos: veiculos || [], 
            motoristas: motoristas || [] 
        };
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        return { locais: [], veiculos: [], motoristas: [] };
    }
};