/* ============================================================
   AllSub — Couche de données (localStorage)
   ============================================================ */

const STORAGE_KEY = 'allsub_db_v1';

const SEED_CLIENTS = [
    {
        id: 1,
        nom: 'Jean Dupont',
        email: 'jean.dupont@exemple.com',
        tel: '+33 6 12 34 56 78',
        service: 'Internet',
        montant: 30,
        dateDebut: '2026-10-01',
        dateFin: '2026-10-25',
        statut: 'actif',
        enRetard: false
    },
    {
        id: 2,
        nom: 'Nexora BioTech SAS',
        email: 'contact@nexora-biotech.fr',
        tel: '+33 1 45 67 89 01',
        service: 'Internet',
        montant: 420,
        dateDebut: '2026-05-22',
        dateFin: '2027-05-22',
        statut: 'actif',
        enRetard: false
    },
    {
        id: 3,
        nom: 'Ateliers Vernet & Fils',
        email: 'info@ateliers-vernet.fr',
        tel: '+33 4 78 90 12 34',
        service: 'Hébergement',
        montant: 189.5,
        dateDebut: '2026-05-21',
        dateFin: '2027-05-21',
        statut: 'actif',
        enRetard: true
    },
    {
        id: 4,
        nom: 'LogiHôtel Méditerranée',
        email: 'direction@logihotel-med.fr',
        tel: '+33 4 91 23 45 67',
        service: 'Infogérance',
        montant: 650,
        dateDebut: '2026-05-20',
        dateFin: '2027-05-20',
        statut: 'actif',
        enRetard: false
    }
];

function loadDB() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('AllSub: lecture localStorage impossible', e);
    }
    return { clients: SEED_CLIENTS.map(c => ({ ...c })) };
}

function saveDB() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    } catch (e) {
        console.warn('AllSub: écriture localStorage impossible', e);
    }
}

const DB = loadDB();

/* ------------------------------------------------------------
   Statistiques
   ------------------------------------------------------------ */
function getStats() {
    const clients = DB.clients || [];
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
        total: clients.length,
        internet: 0,
        hebergement: 0,
        infogerance: 0,
        enRetard: 0,
        proches: 0,
        montantTotal: 0
    };

    for (const c of clients) {
        const svc = (c.service || '').toLowerCase();
        if (svc === 'internet') stats.internet++;
        else if (svc === 'hébergement' || svc === 'hebergement') stats.hebergement++;
        else if (svc === 'infogérance' || svc === 'infogerance') stats.infogerance++;

        if (c.enRetard) stats.enRetard++;

        if (c.dateFin) {
            const fin = new Date(c.dateFin);
            if (fin >= now && fin <= in7Days) stats.proches++;
        }

        stats.montantTotal += Number(c.montant) || 0;
    }

    return stats;
}

/* ------------------------------------------------------------
   Mutations
   ------------------------------------------------------------ */
function ajouterClient(data) {
    const id = (DB.clients.reduce((m, c) => Math.max(m, c.id || 0), 0)) + 1;
    const client = {
        id,
        nom: data.nom || '',
        email: data.email || '',
        tel: data.tel || '',
        service: data.service || 'Internet',
        montant: Number(data.montant) || 0,
        dateDebut: data.dateDebut || new Date().toISOString().slice(0, 10),
        dateFin: data.dateFin || null,
        statut: data.statut || 'actif',
        enRetard: !!data.enRetard
    };
    DB.clients.push(client);
    saveDB();
    return client;
}

function prolongerClient(id, jours, motif, auteur) {
    const client = DB.clients.find(c => c.id === id);
    if (!client) return null;
    if (client.dateFin) {
        const d = new Date(client.dateFin);
        d.setDate(d.getDate() + Number(jours || 0));
        client.dateFin = d.toISOString().slice(0, 10);
    }
    client.historique = client.historique || [];
    client.historique.push({
        date: new Date().toISOString(),
        action: 'prolongation',
        jours: Number(jours) || 0,
        motif: motif || '',
        auteur: auteur || ''
    });
    saveDB();
    return client;
}

function ajouterService(clientId, service, montant) {
    const client = DB.clients.find(c => c.id === clientId);
    if (!client) return null;
    client.services = client.services || [];
    client.services.push({
        service: service || 'Internet',
        montant: Number(montant) || 0,
        dateAjout: new Date().toISOString().slice(0, 10)
    });
    saveDB();
    return client;
}

function resetDB() {
    DB.clients = SEED_CLIENTS.map(c => ({ ...c }));
    saveDB();
    return DB;
}
