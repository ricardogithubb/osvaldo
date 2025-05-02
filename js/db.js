const DB_NAME = 'TransporteDB';
const DB_VERSION = 2;
let dbInstance = null;

const openDB = () => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            return resolve(dbInstance);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Erro ao abrir o banco de dados', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('registros')) {
                const registrosStore = db.createObjectStore('registros', { keyPath: 'id', autoIncrement: true });
                registrosStore.createIndex('data', 'data', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('locais')) {
                db.createObjectStore('locais', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('veiculos')) {
                db.createObjectStore('veiculos', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('motoristas')) {
                db.createObjectStore('motoristas', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

const withDB = (operation) => {
    return openDB().then(db => operation(db)).catch(error => {
        console.error('Database operation failed:', error);
        throw error;
    });
};

// Operações para Registros
export const addRegistro = (registro) => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registros'], 'readwrite');
            const store = transaction.objectStore('registros');
            const request = store.add(registro);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

export const getRegistrosByMonth = (year, month) => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registros'], 'readonly');
            const store = transaction.objectStore('registros');
            const index = store.index('data');
            
            const lowerBound = `${year}-${month.toString().padStart(2, '0')}-01`;
            const upperBound = `${year}-${month.toString().padStart(2, '0')}-31`;
            const range = IDBKeyRange.bound(lowerBound, upperBound);
            
            const request = index.getAll(range);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

export const deleteRegistro = (id) => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registros'], 'readwrite');
            const store = transaction.objectStore('registros');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

export const updateRegistro = (registro) => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['registros'], 'readwrite');
            const store = transaction.objectStore('registros');
            const request = store.put(registro);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

// Operações para Locais
export const getAllLocais = () => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['locais'], 'readonly');
            const store = transaction.objectStore('locais');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result.map(item => item.nome));
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

export const addLocal = (nome) => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['locais'], 'readwrite');
            const store = transaction.objectStore('locais');
            const request = store.add({ nome: nome, tipo: 'ambos' });

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

// Operações para Veículos
export const getAllVeiculos = () => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['veiculos'], 'readonly');
            const store = transaction.objectStore('veiculos');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result.map(item => item.nome));
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

export const addVeiculo = (nome) => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['veiculos'], 'readwrite');
            const store = transaction.objectStore('veiculos');
            const request = store.add({ nome: nome });

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

// Operações para Motoristas
export const getAllMotoristas = () => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['motoristas'], 'readonly');
            const store = transaction.objectStore('motoristas');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result.map(item => item.nome));
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

export const addMotorista = (nome) => {
    return withDB(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['motoristas'], 'readwrite');
            const store = transaction.objectStore('motoristas');
            const request = store.add({ nome: nome });

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    });
};

export {
    openDB
}