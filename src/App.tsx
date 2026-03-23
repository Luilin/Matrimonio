import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Car, 
  Bed, 
  Heart, 
  CheckCircle2, 
  ChevronDown,
  Info,
  Clock,
  Navigation,
  Users,
  MessageSquare,
  ArrowLeft,
  LayoutDashboard,
  BookHeart,
  Sparkles,
  Menu,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  LogOut,
  Music,
  Gift,
  Mail,
  Lock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  signInWithEmailAndPassword
} from 'firebase/auth';

interface RSVP {
  id: string;
  name: string;
  guests: number;
  guestNames: string[];
  attendance: string;
  message: string;
  song?: string;
  hasIntolerances?: string;
  intolerancesDetails?: string;
  adminNotes?: string;
  created_at: string;
}

const RSVPDashboard = ({ onBack, t }: { onBack: () => void, t: any }) => {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editGuestNames, setEditGuestNames] = useState<string[]>([]);

  const [exportOnlyAttending, setExportOnlyAttending] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'rsvps'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RSVP[];
      setRsvps(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching RSVPs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(t.dashboard.confirmDelete)) {
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'rsvps', id));
      } catch (error) {
        console.error('Error deleting RSVP:', error);
      }
    }
  };

  const handleUpdateRSVP = async (id: string) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'rsvps', id), { 
        adminNotes: editNotes,
        guestNames: editGuestNames,
        name: editGuestNames[0] || '' // Update main name if first guest name changed
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const totalAttending = rsvps
    .filter(r => r.attendance === 'yes')
    .reduce((acc, curr) => acc + curr.guests, 0);

  const totalResponses = rsvps.length;

  const exportToExcel = () => {
    const filteredRsvps = exportOnlyAttending ? rsvps.filter(r => r.attendance === 'yes') : rsvps;
    const data = filteredRsvps.map(r => ({
      [t.rsvp.fullName]: r.name,
      [t.rsvp.numGuests]: r.guests,
      [t.rsvp.willAttend]: r.attendance === 'yes' ? t.rsvp.shortYes : t.rsvp.shortNo,
      [t.rsvp.message]: r.message,
      [t.dashboard.dietary]: r.hasIntolerances === 'yes' ? `${t.rsvp.shortYes}: ${r.intolerancesDetails}` : t.rsvp.shortNo,
      [t.rsvp.song]: r.song || '-',
      [t.dashboard.date]: new Date(r.created_at).toLocaleDateString('it-IT')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Partecipazioni");
    const filename = exportOnlyAttending ? `${t.dashboard.attending}.xlsx` : `${t.dashboard.all}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportToPDF = () => {
    const filteredRsvps = exportOnlyAttending ? rsvps.filter(r => r.attendance === 'yes') : rsvps;
    const doc = new jsPDF();
    const title = exportOnlyAttending ? t.dashboard.exportAttendingTitle : t.dashboard.exportTitle;
    doc.text(title, 14, 15);
    
    const tableData = filteredRsvps.map(r => [
      r.name,
      r.guests.toString(),
      r.attendance === 'yes' ? t.rsvp.shortYes : t.rsvp.shortNo,
      r.message || '-',
      r.hasIntolerances === 'yes' ? `${t.rsvp.shortYes}: ${r.intolerancesDetails}` : t.rsvp.shortNo,
      r.song || '-',
      new Date(r.created_at).toLocaleDateString('it-IT')
    ]);

    autoTable(doc, {
      head: [[t.rsvp.fullName, t.rsvp.numGuests, t.rsvp.willAttend, t.rsvp.message, t.dashboard.dietary, t.rsvp.song, t.dashboard.date]],
      body: tableData,
      startY: 25,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [212, 165, 165] } // wedding-gold color approx
    });

    const filename = exportOnlyAttending ? `${t.dashboard.attending}.pdf` : `${t.dashboard.all}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex-1">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-wedding-gold hover:text-wedding-sage transition-colors mb-4 uppercase tracking-widest text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.dashboard.back}
            </button>
            <h1 className="text-4xl md:text-6xl font-script text-wedding-gold">{t.dashboard.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-wedding-gold/10 shadow-sm">
              <input 
                type="checkbox" 
                id="onlyAttending"
                checked={exportOnlyAttending}
                onChange={(e) => setExportOnlyAttending(e.target.checked)}
                className="w-4 h-4 text-wedding-gold border-wedding-gold/30 rounded focus:ring-wedding-gold"
              />
              <label htmlFor="onlyAttending" className="text-xs font-bold text-wedding-ink/60 cursor-pointer uppercase tracking-widest">
                {t.dashboard.onlyAttending}
              </label>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {t.dashboard.excel}
              </button>
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                {t.dashboard.pdf}
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-wedding-gold/10 flex items-center gap-4">
                <div className="bg-wedding-gold/10 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-wedding-gold" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-wedding-ink/40">{t.dashboard.totalGuests}</p>
                  <p className="text-2xl font-serif font-bold">{totalAttending}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-wedding-gold/10 flex items-center gap-4">
                <div className="bg-wedding-sage/10 p-3 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-wedding-sage" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-wedding-ink/40">{t.dashboard.responses}</p>
                  <p className="text-2xl font-serif font-bold">{totalResponses}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-gold"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {rsvps.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-wedding-gold/30">
                <Info className="w-12 h-12 text-wedding-gold/30 mx-auto mb-4" />
                <p className="text-wedding-ink/50 italic">{t.dashboard.noResponses}</p>
              </div>
            ) : (
              rsvps.map((rsvp) => (
                <motion.div 
                  key={rsvp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-wedding-gold/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-serif font-bold">{rsvp.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                          rsvp.attendance === 'yes' 
                            ? 'bg-wedding-sage/10 text-wedding-sage' 
                            : 'bg-red-50 text-red-500'
                        }`}>
                          {rsvp.attendance === 'yes' ? t.dashboard.present : t.dashboard.absent}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingId(rsvp.id);
                            setEditNotes(rsvp.adminNotes || '');
                            setEditGuestNames(rsvp.guestNames || []);
                          }}
                          className="p-2 text-wedding-gold hover:bg-wedding-gold/10 rounded-full transition-colors"
                          title={t.dashboard.edit}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(rsvp.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                          title={t.dashboard.delete}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-wedding-ink/60">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {rsvp.guests} {rsvp.guests === 1 ? t.dashboard.guests : t.dashboard.guestsPlural}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(rsvp.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>

                      {rsvp.guestNames && rsvp.guestNames.length > 0 && (
                        <div className="bg-wedding-cream/30 p-3 rounded-xl border border-wedding-gold/5">
                          <p className="text-[10px] uppercase tracking-widest text-wedding-ink/40 mb-2">{t.dashboard.guestNames}</p>
                          <div className="flex flex-wrap gap-2">
                            {rsvp.guestNames.map((name, idx) => (
                              <span key={idx} className="bg-white px-3 py-1 rounded-full text-xs border border-wedding-gold/10">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {rsvp.message && (
                        <div className="bg-wedding-cream/20 p-4 rounded-2xl relative">
                          <MessageSquare className="w-4 h-4 text-wedding-gold/30 absolute -top-2 -left-2" />
                          <p className="text-xl italic text-wedding-ink/70">"{rsvp.message}"</p>
                        </div>
                      )}

                      {rsvp.hasIntolerances === 'yes' && (
                        <div className="flex-1 bg-red-50 p-4 rounded-2xl relative">
                          <Info className="w-4 h-4 text-red-400/30 absolute -top-2 -left-2" />
                          <p className="text-sm italic text-red-500 font-medium">{t.dashboard.dietary}: {rsvp.intolerancesDetails}</p>
                        </div>
                      )}

                      {rsvp.song && (
                        <div className="bg-wedding-gold/5 p-4 rounded-2xl relative">
                          <Music className="w-4 h-4 text-wedding-gold/30 absolute -top-2 -left-2" />
                          <p className="text-sm italic text-wedding-gold font-medium">"{rsvp.song}"</p>
                        </div>
                      )}

                      {editingId === rsvp.id ? (
                        <div className="mt-4 p-6 bg-wedding-cream/20 rounded-2xl border border-wedding-gold/20 space-y-4">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-wedding-ink/40 mb-2 block font-bold">{t.dashboard.guestNames}</label>
                            <div className="space-y-2">
                              {editGuestNames.map((name, idx) => (
                                <input 
                                  key={idx}
                                  type="text"
                                  value={name}
                                  onChange={(e) => {
                                    const newNames = [...editGuestNames];
                                    newNames[idx] = e.target.value;
                                    setEditGuestNames(newNames);
                                  }}
                                  className="w-full bg-white border border-wedding-gold/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-wedding-gold"
                                  placeholder={`${t.rsvp.guestName} ${idx + 1}`}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-wedding-ink/40 mb-2 block font-bold">{t.dashboard.adminNotes}</label>
                            <textarea 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full bg-white border border-wedding-gold/20 rounded-xl p-3 text-sm focus:outline-none focus:border-wedding-gold"
                              rows={3}
                              placeholder="..."
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button 
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 text-xs uppercase tracking-widest text-wedding-ink/40 font-bold"
                            >
                              {t.dashboard.cancel}
                            </button>
                            <button 
                              onClick={() => handleUpdateRSVP(rsvp.id)}
                              className="px-6 py-2 bg-wedding-gold text-white text-xs uppercase tracking-widest rounded-lg font-bold shadow-sm"
                            >
                              {t.dashboard.save}
                            </button>
                          </div>
                        </div>
                      ) : rsvp.adminNotes && (
                        <div className="mt-4 p-4 bg-wedding-gold/5 rounded-2xl border border-dashed border-wedding-gold/20">
                          <p className="text-[10px] uppercase tracking-widest text-wedding-gold/60 mb-1">{t.dashboard.adminNotes}</p>
                          <p className="text-sm text-wedding-ink/80">{rsvp.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin, t }: { isOpen: boolean, onClose: () => void, onLogin: () => void, t: any }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;
      
      // Check if user is admin
      const adminEmails = [
        'mariannabattaglia14@gmail.com',
        'loaderweb@gmail.com'
      ];
      console.log('Tentativo di login per:', user.email);
      if (user.email && adminEmails.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) {
        onLogin();
      } else {
        console.log('Email non corrispondente all\'admin predefinito, controllo Firestore...');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          onLogin();
        } else {
          console.warn('Accesso negato per UID:', user.uid);
          setError(t.login.errorDenied);
          await signOut(auth);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(t.login.errorInvalid);
      } else if (err.code === 'auth/too-many-requests') {
        setError(t.login.errorTooMany);
      } else {
        setError(t.login.errorGeneral);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-wedding-gold/20 relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-wedding-ink/20 hover:text-wedding-ink/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <LayoutDashboard className="w-12 h-12 text-wedding-gold mx-auto mb-4" />
          <h3 className="text-3xl font-script text-wedding-gold">{t.login.title}</h3>
          <p className="text-wedding-ink/60 text-sm mt-2">{t.login.subtitle}</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-wedding-ink/40 ml-1 font-bold">{t.login.email}</label>
            <div className="relative">
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-wedding-cream/30 border border-wedding-gold/20 rounded-2xl px-4 py-3 pl-11 focus:outline-none focus:border-wedding-gold transition-all text-wedding-ink text-sm"
                placeholder="admin@esempio.com"
              />
              <Mail className="w-4 h-4 text-wedding-gold/40 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-wedding-ink/40 ml-1 font-bold">{t.login.password}</label>
            <div className="relative">
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-wedding-cream/30 border border-wedding-gold/20 rounded-2xl px-4 py-3 pl-11 focus:outline-none focus:border-wedding-gold transition-all text-wedding-ink text-sm"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-wedding-gold/40 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-50 py-2 rounded-lg">{error}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-wedding-gold hover:bg-wedding-gold/90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all uppercase tracking-[0.2em] text-xs shadow-lg shadow-wedding-gold/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t.login.button
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const translations = {
  it: {
    nav: {
      details: 'Dettagli',
      suggestions: 'Suggerimenti',
      accommodation: 'Pernottamento',
      music: 'Musica',
      registry: 'Lista Nozze',
      rsvp: 'RSVP',
    },
    hero: {
      title: 'Vitantonio & Marianna',
    },
    details: {
      title: 'Il Nostro Giorno',
      when: 'Quando',
      date: 'Domenica, 4 Ottobre 2026',
      ceremony: 'Il rito civile si terrà alle ore 12:00 presso la medesima location',
      schedule: 'Programma',
      event1: '12:00 - Cerimonia Civile',
      event2: '13:30 - Aperitivo di Benvenuto',
      event3: '15:00 - Pranzo di Nozze',
      event4: '18:00 - Taglio della Torta & Party',
      where: 'Dove',
      openMaps: 'Apri in Google Maps',
    },
    directions: {
      title: 'Suggerimenti per arrivare',
      description: 'La Masseria è facilmente raggiungibile in auto. È disponibile un ampio parcheggio riservato agli ospiti.',
      byCar: 'In Auto',
      byCarDesc: 'La Puglia è ancora più bella da vivere in macchina, quindi per chi viene da fuori consigliamo di avere un mezzo per godersi tutte le sue meraviglie. L’aeroporto più vicino è Bari: da lì potete noleggiare un’auto, oppure arrivare direttamente in macchina da Roma.',
      shuttle: 'Servizio navetta',
      shuttleDesc: 'Sarà disponibile una navetta per chi parte da Bisceglie, pensata per agevolare il rientro notturno e permettervi di godervi al massimo la giornata. La partenza è prevista da Bisceglie alle ore 10:30, mentre il rientro è programmato tra le 22:00 e le 23:00. Per favore fateci sapere se interessati al servizio navetta entro il 4 Luglio 2026.',
    },
    accommodations: {
      title: 'Dove Pernottare',
      description: 'Per chi desidera fermarsi per la notte o più giorni, abbiamo selezionato alcune strutture nelle vicinanze.',
      book: 'Prenota',
    },
    music: {
      title: 'La nostra Playlist',
      description: 'La festa sarà ancora più bella con la vostra musica! Lasciate un suggerimento di una canzone che vi piacerebbe ascoltare e proveremo ad aggiungerla alla playlist.',
      suggest: 'Suggerisci una canzone nel modulo RSVP',
    },
    gift: {
      title: 'Lista Nozze',
      quote: '"Il regalo più bello per noi sarà festeggiare questo giorno insieme a voi. Solo se lo desiderate, potete contribuire al nostro viaggio di nozze."',
      holder: 'Intestatario',
      thanks: 'Grazie per accompagnarci in questo nuovo capitolo della nostra vita.',
    },
    rsvp: {
      title: 'Conferma la tua presenza',
      deadline: 'Vi preghiamo di confermare la vostra partecipazione entro il 4 Luglio 2026.',
      successTitle: 'Grazie Mille!',
      successDesc: "La tua risposta è stata registrata con successo. Non vediamo l'ora di festeggiare insieme!",
      anotherResponse: "Invia un'altra risposta",
      numGuests: 'Numero Ospiti',
      willAttend: 'Parteciperai?',
      yes: 'Sì, con piacere',
      no: 'Purtroppo, non potrò esserci',
      shortYes: 'Si',
      shortNo: 'No',
      guestNames: 'Nomi dei partecipanti',
      fullName: 'Il tuo nome completo',
      guestName: 'Nome ospite',
      dietary: 'Hai intolleranze, allergie o esigenze alimentari (es. vegetariano/vegano)? *',
      dietaryDetails: 'Dettagli (allergie, vegetariano, vegano, ecc.) *',
      dietaryPlaceholder: 'Es. Celiachia, vegetariano, vegano, allergia alle noci...',
      message: 'Messaggio (Opzionale)',
      messagePlaceholder: 'Richieste particolari o un semplice saluto...',
      song: 'Una canzone per noi (Opzionale)',
      songPlaceholder: 'Es. Perfect - Ed Sheeran',
      sending: 'Invio in corso...',
      send: 'Invia Conferma',
      error: 'Si è verificato un errore. Riprova più tardi.',
    },
    footer: {
      admin: 'Area Riservata',
    },
    dashboard: {
      back: "Torna all'invito",
      title: 'Dashboard Partecipazioni',
      onlyAttending: 'Solo Presenti',
      totalGuests: 'Totale Ospiti',
      responses: 'Risposte',
      noResponses: 'Nessuna risposta ricevuta finora.',
      present: 'Presente',
      absent: 'Assente',
      guests: 'ospite',
      guestsPlural: 'ospiti',
      date: 'Data',
      guestNames: 'Nomi Partecipanti',
      dietary: 'Dieta/Allergie',
      adminNotes: 'Note Amministratore',
      cancel: 'Annulla',
      save: 'Salva Modifiche',
      confirmDelete: 'Sei sicuro di voler eliminare questa partecipazione?',
      edit: 'Modifica',
      delete: 'Elimina',
      all: 'Tutte',
      attending: 'Presenti',
      exportTitle: 'Lista Partecipazioni - Vitantonio & Marianna',
      exportAttendingTitle: 'Lista Presenti - Vitantonio & Marianna',
      excel: 'Excel',
      pdf: 'PDF',
    },
    login: {
      title: 'Area Riservata',
      subtitle: 'Accedi per visualizzare la dashboard',
      email: 'Email',
      password: 'Password',
      button: 'Accedi',
      errorDenied: 'Accesso negato. Solo gli amministratori possono accedere.',
      errorInvalid: 'Credenziali non valide. Riprova.',
      errorTooMany: 'Troppi tentativi falliti. Riprova più tardi.',
      errorGeneral: 'Errore durante il login. Verifica i dati e riprova.',
    }
  },
  en: {
    nav: {
      details: 'Details',
      suggestions: 'Suggestions',
      accommodation: 'Accommodation',
      music: 'Music',
      registry: 'Registry',
      rsvp: 'RSVP',
    },
    hero: {
      title: 'Vitantonio & Marianna',
    },
    details: {
      title: 'Our Day',
      when: 'When',
      date: 'Sunday, October 4th 2026',
      ceremony: 'The civil ceremony will be held at 12:00 PM at the same location',
      schedule: 'Schedule',
      event1: '12:00 PM - Civil Ceremony',
      event2: '1:30 PM - Welcome Drink',
      event3: '3:00 PM - Wedding Lunch',
      event4: '6:00 PM - Cake Cutting & Party',
      where: 'Where',
      openMaps: 'Open in Google Maps',
    },
    directions: {
      title: 'Arrival Suggestions',
      description: 'The Masseria is easily accessible by car. A large private parking lot is available for guests.',
      byCar: 'By Car',
      byCarDesc: 'Puglia is even more beautiful to experience by car, so for those coming from outside we recommend having a vehicle to enjoy all its wonders. The nearest airport is Bari: from there you can rent a car, or arrive directly by car from Rome.',
      shuttle: 'Shuttle service',
      shuttleDesc: 'A shuttle will be available for those departing from Bisceglie, designed to facilitate the night return and allow you to enjoy the day to the fullest. Departure is scheduled from Bisceglie at 10:30 AM, while the return is scheduled between 10:00 PM and 11:00 PM. Please let us know if you are interested in the shuttle service by July 4th, 2026.',
    },
    accommodations: {
      title: 'Where to Stay',
      description: 'For those who wish to stay for the night or several days, we have selected some nearby accommodations.',
      book: 'Book',
    },
    music: {
      title: 'Our Playlist',
      description: 'The party will be even more beautiful with your music! Leave a suggestion for a song you\'d like to hear and we\'ll try to add it to the playlist.',
      suggest: 'Suggest a song in the RSVP form',
    },
    gift: {
      title: 'Wedding Registry',
      quote: '"The most beautiful gift for us will be celebrating this day together with you. Only if you wish, you can contribute to our honeymoon."',
      holder: 'Account Holder',
      thanks: 'Thank you for accompanying us in this new chapter of our life.',
    },
    rsvp: {
      title: 'Confirm your presence',
      deadline: 'Please confirm your participation by July 4th, 2026.',
      successTitle: 'Thank you very much!',
      successDesc: "Your response has been successfully recorded. We can't wait to celebrate together!",
      anotherResponse: "Send another response",
      numGuests: 'Number of Guests',
      willAttend: 'Will you attend?',
      yes: 'Yes, with pleasure',
      no: 'Unfortunately, I won\'t be able to make it',
      shortYes: 'Yes',
      shortNo: 'No',
      guestNames: 'Names of participants',
      fullName: 'Your full name',
      guestName: 'Guest name',
      dietary: 'Do you have any intolerances, allergies or dietary requirements (e.g. vegetarian/vegan)? *',
      dietaryDetails: 'Details (allergies, vegetarian, vegan, etc.) *',
      dietaryPlaceholder: 'E.g. Celiac, vegetarian, vegan, nut allergy...',
      message: 'Message (Optional)',
      messagePlaceholder: 'Special requests or a simple greeting...',
      song: 'A song for us (Optional)',
      songPlaceholder: 'E.g. Perfect - Ed Sheeran',
      sending: 'Sending...',
      send: 'Send Confirmation',
      error: 'An error occurred. Please try again later.',
    },
    footer: {
      admin: 'Private Area',
    },
    dashboard: {
      back: "Back to invitation",
      title: 'RSVP Dashboard',
      onlyAttending: 'Attending Only',
      totalGuests: 'Total Guests',
      responses: 'Responses',
      noResponses: 'No responses received yet.',
      present: 'Attending',
      absent: 'Not Attending',
      guests: 'guest',
      guestsPlural: 'guests',
      date: 'Date',
      guestNames: 'Guest Names',
      dietary: 'Dietary/Allergies',
      adminNotes: 'Admin Notes',
      cancel: 'Cancel',
      save: 'Save Changes',
      confirmDelete: 'Are you sure you want to delete this RSVP?',
      edit: 'Edit',
      delete: 'Delete',
      all: 'All',
      attending: 'Attending',
      exportTitle: 'RSVP List - Vitantonio & Marianna',
      exportAttendingTitle: 'Attending List - Vitantonio & Marianna',
      excel: 'Excel',
      pdf: 'PDF',
    },
    login: {
      title: 'Private Area',
      subtitle: 'Login to view the dashboard',
      email: 'Email',
      password: 'Password',
      button: 'Login',
      errorDenied: 'Access denied. Only administrators can log in.',
      errorInvalid: 'Invalid credentials. Please try again.',
      errorTooMany: 'Too many failed attempts. Please try again later.',
      errorGeneral: 'Error during login. Please check your data and try again.',
    }
  }
};

const WeddingApp = () => {
  const [lang, setLang] = useState<'it' | 'en'>('it');
  const t = translations[lang];
  const [view, setView] = useState<'invitation' | 'dashboard'>('invitation');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    guests: 1,
    guestNames: [''],
    attendance: 'yes',
    message: '',
    song: '',
    hasIntolerances: 'no',
    intolerancesDetails: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      // Reset active section when at the very top
      if (window.scrollY < 300) {
        setActiveSection('');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Dettagli', key: 'details', href: '#dettagli' },
    { name: 'Suggerimenti', key: 'suggestions', href: '#arrivare' },
    { name: 'Pernottamento', key: 'accommodation', href: '#pernottamento' },
    { name: 'Musica', key: 'music', href: '#musica' },
    { name: 'Lista Nozze', key: 'registry', href: '#regalo' },
    { name: 'RSVP', key: 'rsvp', href: '#rsvp' },
  ];

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-90px 0px -70% 0px',
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    navLinks.forEach((link) => {
      const section = document.querySelector(link.href);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setIsMenuOpen(false);
      setActiveSection('');
      return;
    }
    
    try {
      const element = document.querySelector(href);
      if (element) {
        // Set active section immediately for better UX
        setActiveSection(href);
        
        const offset = 100;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error('Invalid selector:', href);
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const adminEmails = [
        'mariannabattaglia14@gmail.com',
        'loaderweb@gmail.com'
      ];
      if (user && user.email && adminEmails.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setView('invitation');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseInt(value, 10) || 0 : value;
    
    if (name === 'guests') {
      const numGuests = parseInt(value, 10) || 1;
      setFormData(prev => {
        const newGuestNames = [...prev.guestNames];
        if (numGuests > prev.guestNames.length) {
          for (let i = prev.guestNames.length; i < numGuests; i++) {
            newGuestNames.push('');
          }
        } else if (numGuests < prev.guestNames.length) {
          newGuestNames.splice(numGuests);
        }
        return { ...prev, guests: numGuests, guestNames: newGuestNames };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleGuestNameChange = (index: number, value: string) => {
    setFormData(prev => {
      const newGuestNames = [...prev.guestNames];
      newGuestNames[index] = value;
      // Update main name with the first guest name
      return { 
        ...prev, 
        guestNames: newGuestNames,
        name: index === 0 ? value : prev.name
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpStatus('submitting');
    
    try {
      // Ensure guests is a number
      const submissionData = {
        ...formData,
        guests: Number(formData.guests),
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'rsvps'), submissionData);
      setRsvpStatus('success');
    } catch (error: any) {
      console.error('RSVP submission error:', error);
      
      // Detailed error logging for debugging
      if (error.code === 'permission-denied') {
        console.error('Firestore Permission Denied. Check security rules and data types.');
      }
      
      setRsvpStatus('error');
    }
  };

  if (view === 'dashboard' && isAuthenticated) {
    return <RSVPDashboard onBack={() => setView('invitation')} t={t} />;
  }

  return (
    <div className="min-h-screen selection:bg-wedding-gold/30">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={() => {
          setIsAuthenticated(true);
          setIsLoginModalOpen(false);
          setView('dashboard');
        }} 
        t={t}
      />
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          (scrolled || isMenuOpen) ? 'bg-white/95 backdrop-blur-md py-4 shadow-md' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a 
            href="#" 
            onClick={(e) => scrollToSection(e, '#')}
            className={`font-script text-3xl transition-colors ${
              (scrolled || isMenuOpen) ? 'text-wedding-gold' : 'text-white'
            }`}
          >
            V & M
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`text-sm uppercase tracking-[0.2em] font-medium transition-all duration-300 relative group py-1 ${
                  activeSection === link.href
                    ? (scrolled ? 'text-wedding-gold' : 'text-white')
                    : (scrolled ? 'text-wedding-ink/70 hover:text-wedding-gold' : 'text-white/80 hover:text-white')
                }`}
              >
                {t.nav[link.key as keyof typeof t.nav]}
              </a>
            ))}
            
            {/* Language Switcher Desktop */}
            <button
              onClick={() => setLang(lang === 'it' ? 'en' : 'it')}
              className={`ml-4 px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                scrolled 
                  ? 'border-wedding-gold text-wedding-gold hover:bg-wedding-gold hover:text-white' 
                  : 'border-white text-white hover:bg-white hover:text-wedding-gold'
              }`}
            >
              {lang === 'it' ? 'EN' : 'IT'}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setLang(lang === 'it' ? 'en' : 'it')}
              className={`px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                (scrolled || isMenuOpen)
                  ? 'border-wedding-gold text-wedding-gold' 
                  : 'border-white text-white'
              }`}
            >
              {lang === 'it' ? 'EN' : 'IT'}
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="Toggle menu"
              className={`md:hidden p-3 -mr-2 transition-colors rounded-full hover:bg-black/5 relative z-[60] cursor-pointer ${
                (scrolled || isMenuOpen) ? 'text-wedding-ink' : 'text-white'
              }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white/90 backdrop-blur-lg border-b border-wedding-gold/10 overflow-hidden shadow-2xl absolute top-full left-0 w-full"
            >
              <div className="flex flex-col p-6 gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className={`text-base uppercase tracking-[0.2em] font-medium py-5 px-4 transition-all duration-300 flex items-center justify-between rounded-xl ${
                      activeSection === link.href ? 'text-wedding-gold bg-wedding-gold/5' : 'text-wedding-ink/70 active:bg-wedding-gold/5'
                    }`}
                  >
                    {t.nav[link.key as keyof typeof t.nav]}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 parallax-bg"
          style={{ 
            backgroundImage: 'url("https://i.postimg.cc/5tDsH5Rw/BC685B35-5CE4-4FE7-8398-4B7F22030F6A.png")',
            filter: 'brightness(0.65)',
            backgroundPosition: 'center 60%'
          }}
        />
        <div className="relative z-10 text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <h1 className="text-7xl md:text-9xl font-script mb-6">
              {t.hero.title}
            </h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="animate-bounce w-8 h-8 text-white/70" />
          </motion.div>
        </div>
      </section>

      {/* Details Section */}
      <section id="dettagli" className="py-24 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Heart className="w-8 h-8 text-wedding-gold mx-auto mb-8" />
          <h2 className="text-5xl md:text-7xl font-script mb-12 text-wedding-gold">{t.details.title}</h2>
          
          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="space-y-6 p-8 rounded-3xl bg-white/60 shadow-sm border border-wedding-gold/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wedding-gold/20 via-wedding-gold/40 to-wedding-gold/20"></div>
              <div className="flex items-center gap-4 text-wedding-gold">
                <Calendar className="w-6 h-6" />
                <h3 className="text-2xl font-serif font-semibold uppercase tracking-wider">{t.details.when}</h3>
              </div>
              <p className="text-xl leading-relaxed text-wedding-ink/80">
                {t.details.date}<br />
                {t.details.ceremony}
              </p>
              <div className="flex items-center gap-4 text-wedding-gold pt-4">
                <Clock className="w-6 h-6" />
                <h3 className="text-2xl font-serif font-semibold uppercase tracking-wider">{t.details.schedule}</h3>
              </div>
              <ul className="space-y-2 text-xl text-wedding-ink/80">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> {t.details.event1}</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> {t.details.event2}</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> {t.details.event3}</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> {t.details.event4}</li>
              </ul>
            </div>

            <div className="space-y-6 p-8 rounded-3xl bg-white/60 shadow-sm border border-wedding-gold/20 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wedding-gold/20 via-wedding-gold/40 to-wedding-gold/20"></div>
              <div className="flex items-center gap-4 text-wedding-gold">
                <MapPin className="w-6 h-6" />
                <h3 className="text-2xl font-serif font-semibold uppercase tracking-wider">{t.details.where}</h3>
              </div>
              <p className="text-xl leading-relaxed text-wedding-ink/80">
                <strong>Masseria Bonelli</strong><br />
                SP 116km 10,400<br />
                70015 Noci (BA), Italia
              </p>
              
              {/* Interactive Map */}
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-wedding-gold/10 shadow-inner mt-4">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src="https://maps.google.com/maps?q=Masseria%20Bonelli%2C%20SP%20116km%2010%2C400%2C%20Noci&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="grayscale hover:grayscale-0 transition-all duration-700"
                  title="Mappa Masseria Bonelli"
                ></iframe>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=Masseria+Bonelli,+SP+116km+10,400,+70015+Noci+BA,+Italy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-wedding-gold hover:text-wedding-gold/70 transition-colors font-medium bg-wedding-gold/5 px-4 py-2 rounded-full"
                >
                  <Navigation className="w-4 h-4" />
                  {t.details.openMaps}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Directions Section */}
      <section id="arrivare" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Car className="w-8 h-8 text-wedding-sage mx-auto mb-6" />
            <h2 className="text-5xl md:text-6xl font-script mb-4 text-wedding-gold">{t.directions.title}</h2>
            <p className="text-wedding-ink/70 max-w-xl mx-auto">
              {t.directions.description}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-wedding-sage/20">
              <h4 className="font-script text-2xl mb-3 text-wedding-gold">{t.directions.byCar}</h4>
              <p className="text-base text-wedding-ink/80 leading-relaxed">
                {t.directions.byCarDesc}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-wedding-sage/20">
              <h4 className="font-script text-2xl mb-3 text-wedding-gold">{t.directions.shuttle}</h4>
              <p className="text-base text-wedding-ink/80 leading-relaxed">
                {t.directions.shuttleDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodations Section */}
      <section id="pernottamento" className="py-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          < Bed className="w-8 h-8 text-wedding-gold mx-auto mb-6" />
          <h2 className="text-5xl md:text-6xl font-script mb-4 text-wedding-gold">{t.accommodations.title}</h2>
          <p className="text-wedding-ink/70 max-w-xl mx-auto">
            {t.accommodations.description}
          </p>
        </motion.div>

        <div className="space-y-6">
          {[
            { 
              name: "Masseria La Mandra", 
              dist: "Noci (BA)", 
              price: "€€€", 
              link: "https://www.masserialamandra.com/", 
              img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=60&w=400" 
            },
            { 
              name: "Trulli Cibelis", 
              dist: "Noci (BA)", 
              price: "€€", 
              link: "https://www.booking.com/hotel/it/trulli-cibelis.it.html", 
              img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=60&w=400" 
            },
            { 
              name: "Airbnb", 
              dist: "Tra Noci ed Alberobello", 
              price: "€-€€", 
              link: "https://www.airbnb.it/s/Noci--BA--Italia/homes", 
              img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=60&w=400" 
            },
            { 
              name: "Canto dei grilli", 
              dist: "Noci (BA)", 
              price: "€€", 
              link: "https://www.booking.com/hotel/it/wepuglia-canto-dei-grilli-noci.it.html", 
              img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=60&w=400" 
            }
          ].map((hotel, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-4 md:p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-wedding-gold/10 hover:border-wedding-gold/40 hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0">
                  <img 
                    src={hotel.img} 
                    alt={hotel.name} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h4 className="font-serif text-lg md:text-xl group-hover:text-wedding-gold transition-colors">{hotel.name}</h4>
                  <p className="text-sm md:text-base text-wedding-ink/60">{hotel.dist} • {hotel.price}</p>
                </div>
              </div>
              <a 
                href={hotel.link} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-wedding-gold font-medium text-sm md:text-base uppercase tracking-widest hover:underline bg-wedding-gold/5 px-3 md:px-4 py-2 rounded-full group-hover:bg-wedding-gold/10 transition-colors"
              >
                {t.accommodations.book}
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Music Section */}
      <section id="musica" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Music className="w-8 h-8 text-wedding-gold mx-auto mb-6" />
            <h2 className="text-5xl md:text-6xl font-script mb-6 text-wedding-gold">{t.music.title}</h2>
            <p className="text-wedding-ink/70 max-w-2xl mx-auto text-lg leading-relaxed">
              {t.music.description}
            </p>
            <div className="mt-8">
              <a 
                href="#rsvp" 
                className="inline-flex items-center gap-2 text-wedding-gold hover:text-wedding-gold/70 transition-colors font-medium border-b border-wedding-gold/30 pb-1"
              >
                {t.music.suggest}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gift Section */}
      <section id="regalo" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Gift className="w-8 h-8 text-wedding-gold mx-auto mb-6" />
            <h2 className="text-5xl md:text-6xl font-script mb-6 text-wedding-gold">{t.gift.title}</h2>
            <div className="bg-white/60 p-8 md:p-12 rounded-[3rem] shadow-sm border border-wedding-gold/10 max-w-2xl mx-auto backdrop-blur-sm">
              <p className="text-wedding-ink/70 mb-8 leading-relaxed italic">
                {t.gift.quote}
              </p>
              
              <div className="space-y-4 text-left bg-wedding-cream/10 p-6 rounded-2xl border border-wedding-gold/5">
                <div className="flex flex-col md:flex-row md:justify-between gap-1">
                  <span className="text-sm uppercase tracking-widest text-wedding-ink/40">{t.gift.holder}</span>
                  <span className="font-serif text-wedding-ink text-sm">Marianna Battaglia</span>
                </div>
                <div className="h-px bg-wedding-gold/10" />
                <div className="flex flex-col md:flex-row md:justify-between gap-1">
                  <span className="text-sm uppercase tracking-widest text-wedding-ink/40">IBAN</span>
                  <span className="font-mono text-wedding-ink text-sm break-all">BE96 9670 2628 1205</span>
                </div>
                <div className="h-px bg-wedding-gold/10" />
                <div className="flex flex-col md:flex-row md:justify-between gap-1">
                  <span className="text-sm uppercase tracking-widest text-wedding-ink/40">BIC / SWIFT</span>
                  <span className="font-mono text-wedding-ink text-sm">TRWIBEB1XXX</span>
                </div>
              </div>
              <p className="mt-8 text-wedding-ink/60 text-base italic">
                {t.gift.thanks}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RSVP Section */}
      <section id="rsvp" className="py-24 px-6 relative text-wedding-ink">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/60 p-8 md:p-12 rounded-[3rem] shadow-xl shadow-wedding-gold/5 border border-wedding-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-5xl md:text-6xl font-script mb-6 text-wedding-gold">{t.rsvp.title}</h2>
            <p className="text-wedding-ink/70 mb-10">
              {t.rsvp.deadline}
            </p>

            <AnimatePresence mode="wait">
              {rsvpStatus === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-wedding-sage/10 border border-wedding-sage/30 p-12 rounded-3xl"
                >
                  <CheckCircle2 className="w-16 h-16 text-wedding-sage mx-auto mb-6" />
                  <h3 className="text-3xl font-script mb-2 text-wedding-gold">{t.rsvp.successTitle}</h3>
                  <p className="text-wedding-ink/70">{t.rsvp.successDesc}</p>
                  <button 
                    onClick={() => setRsvpStatus('idle')}
                    className="mt-8 text-sm uppercase tracking-widest text-wedding-sage hover:text-wedding-sage/70 transition-colors font-bold"
                  >
                    {t.rsvp.anotherResponse}
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-6 text-left"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">{t.rsvp.numGuests}</label>
                      <select 
                        required
                        name="guests"
                        value={formData.guests}
                        onChange={handleInputChange}
                        className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">{t.rsvp.willAttend}</label>
                      <select 
                        name="attendance"
                        value={formData.attendance}
                        onChange={handleInputChange}
                        className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink appearance-none"
                      >
                        <option value="yes">{t.rsvp.shortYes}</option>
                        <option value="no">{t.rsvp.shortNo}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">{t.rsvp.guestNames}</label>
                    <div className="grid gap-4">
                      {formData.guestNames.map((name, index) => (
                        <div key={index} className="relative">
                          <input 
                            required
                            type="text" 
                            value={name}
                            onChange={(e) => handleGuestNameChange(index, e.target.value)}
                            className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink"
                            placeholder={index === 0 ? t.rsvp.fullName : `${t.rsvp.guestName} ${index + 1}`}
                          />
                          <Users className="w-4 h-4 text-wedding-gold/30 absolute right-4 top-1/2 -translate-y-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">{t.rsvp.dietary}</label>
                    <select 
                      required
                      name="hasIntolerances"
                      value={formData.hasIntolerances}
                      onChange={handleInputChange}
                      className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink appearance-none"
                    >
                      <option value="no">{t.rsvp.shortNo}</option>
                      <option value="yes">{t.rsvp.shortYes}</option>
                    </select>
                  </div>

                  {formData.hasIntolerances === 'yes' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="text-sm uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">{t.rsvp.dietaryDetails}</label>
                      <textarea 
                        required={formData.hasIntolerances === 'yes'}
                        name="intolerancesDetails"
                        value={formData.intolerancesDetails}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink"
                        placeholder={t.rsvp.dietaryPlaceholder}
                      />
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">{t.rsvp.message}</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink"
                      placeholder={t.rsvp.messagePlaceholder}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">{t.rsvp.song}</label>
                    <input 
                      type="text" 
                      name="song"
                      value={formData.song}
                      onChange={handleInputChange}
                      className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink"
                      placeholder={t.rsvp.songPlaceholder}
                    />
                  </div>

                  <button 
                    disabled={rsvpStatus === 'submitting'}
                    className="w-full bg-wedding-gold hover:bg-wedding-gold/90 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all uppercase tracking-[0.2em] text-base mt-4 shadow-lg shadow-wedding-gold/20"
                  >
                    {rsvpStatus === 'submitting' ? t.rsvp.sending : t.rsvp.send}
                  </button>
                  
                  {rsvpStatus === 'error' && (
                    <p className="text-red-400 text-sm text-center">{t.rsvp.error}</p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 bg-wedding-cream/20 text-center border-t border-wedding-gold/10">
        <p className="font-script text-3xl text-wedding-gold mb-4">{t.hero.title}</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-wedding-ink/40 mb-8">{t.details.date} • Noci (BA)</p>
        <div className="flex justify-center gap-6">
          <button 
            onClick={() => {
              if (isAuthenticated) {
                setView('dashboard');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-wedding-gold/40 hover:text-wedding-gold transition-colors"
          >
            <LayoutDashboard className="w-3 h-3" />
            {t.footer.admin}
          </button>
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-red-400/40 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return <WeddingApp />;
}


