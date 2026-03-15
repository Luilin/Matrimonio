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
  Route
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RSVP {
  id: number;
  name: string;
  guests: number;
  attendance: string;
  message: string;
  created_at: string;
}

const RSVPDashboard = ({ onBack }: { onBack: () => void }) => {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRSVPs = async () => {
      try {
        const response = await fetch('/api/rsvps');
        if (response.ok) {
          const data = await response.json();
          setRsvps(data);
        }
      } catch (error) {
        console.error('Error fetching RSVPs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRSVPs();
  }, []);

  const totalAttending = rsvps
    .filter(r => r.attendance === 'yes')
    .reduce((acc, curr) => acc + curr.guests, 0);

  const totalResponses = rsvps.length;

  const exportToExcel = () => {
    const data = rsvps.map(r => ({
      Nome: r.name,
      Ospiti: r.guests,
      Presenza: r.attendance === 'yes' ? 'Sì' : 'No',
      Messaggio: r.message,
      Data: new Date(r.created_at).toLocaleDateString('it-IT')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Partecipazioni");
    XLSX.writeFile(wb, "Partecipazioni_Matrimonio.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Lista Partecipazioni - Vitantonio & Marianna", 14, 15);
    
    const tableData = rsvps.map(r => [
      r.name,
      r.guests.toString(),
      r.attendance === 'yes' ? 'Sì' : 'No',
      r.message || '-',
      new Date(r.created_at).toLocaleDateString('it-IT')
    ]);

    autoTable(doc, {
      head: [['Nome', 'Ospiti', 'Presenza', 'Messaggio', 'Data']],
      body: tableData,
      startY: 25,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [212, 165, 165] } // wedding-gold color approx
    });

    doc.save("Partecipazioni_Matrimonio.pdf");
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
              Torna all'invito
            </button>
            <h1 className="text-4xl md:text-6xl font-script text-wedding-gold">Dashboard Partecipazioni</h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-wedding-gold/10 flex items-center gap-4">
                <div className="bg-wedding-gold/10 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-wedding-gold" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-wedding-ink/40">Totale Ospiti</p>
                  <p className="text-2xl font-serif font-bold">{totalAttending}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-wedding-gold/10 flex items-center gap-4">
                <div className="bg-wedding-sage/10 p-3 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-wedding-sage" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-wedding-ink/40">Risposte</p>
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
                <p className="text-wedding-ink/50 italic">Nessuna risposta ricevuta finora.</p>
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
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-serif font-bold">{rsvp.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                        rsvp.attendance === 'yes' 
                          ? 'bg-wedding-sage/10 text-wedding-sage' 
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {rsvp.attendance === 'yes' ? 'Presente' : 'Assente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-wedding-ink/60">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {rsvp.guests} {rsvp.guests === 1 ? 'ospite' : 'ospiti'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(rsvp.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>

                  {rsvp.message && (
                    <div className="flex-1 bg-wedding-cream/50 p-4 rounded-2xl relative">
                      <MessageSquare className="w-4 h-4 text-wedding-gold/30 absolute -top-2 -left-2" />
                      <p className="text-sm italic text-wedding-ink/70">"{rsvp.message}"</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WeddingApp = () => {
  const [view, setView] = useState<'invitation' | 'dashboard'>('invitation');
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    guests: 1,
    attendance: 'yes',
    message: ''
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
    { name: 'Storia', href: '#storia' },
    { name: 'Dettagli', href: '#dettagli' },
    { name: 'Come Arrivare', href: '#arrivare' },
    { name: 'Pernottamento', href: '#pernottamento' },
    { name: 'RSVP', href: '#rsvp' },
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGetDirections = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const destination = encodeURIComponent("Villa Antica del Lago, Via Panoramica, 42, 21020 Varese VA, Italy");
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}&travelmode=driving`, '_blank');
      }, (error) => {
        console.error("Error getting location:", error);
        const destination = encodeURIComponent("Villa Antica del Lago, Via Panoramica, 42, 21020 Varese VA, Italy");
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
      });
    } else {
      const destination = encodeURIComponent("Villa Antica del Lago, Via Panoramica, 42, 21020 Varese VA, Italy");
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpStatus('submitting');
    
    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setRsvpStatus('success');
      } else {
        setRsvpStatus('error');
      }
    } catch (error) {
      setRsvpStatus('error');
    }
  };

  if (view === 'dashboard') {
    return <RSVPDashboard onBack={() => setView('invitation')} />;
  }

  return (
    <div className="min-h-screen selection:bg-wedding-gold/30">
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
                className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 relative group py-1 ${
                  activeSection === link.href
                    ? (scrolled ? 'text-wedding-gold' : 'text-white')
                    : (scrolled ? 'text-wedding-ink/70 hover:text-wedding-gold' : 'text-white/80 hover:text-white')
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
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

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-b border-wedding-gold/10 overflow-hidden shadow-2xl absolute top-full left-0 w-full"
            >
              <div className="flex flex-col p-6 gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className={`text-sm uppercase tracking-[0.2em] font-medium py-5 px-4 transition-all duration-300 flex items-center justify-between rounded-xl ${
                      activeSection === link.href ? 'text-wedding-gold bg-wedding-gold/5' : 'text-wedding-ink/70 active:bg-wedding-gold/5'
                    }`}
                  >
                    {link.name}
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
            backgroundImage: 'url("https://i.postimg.cc/R0rKYnHD/Whats-App-Image-2026-03-12-at-13-48-53.jpg")',
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
              Vitantonio & Marianna
            </h1>
            <div className="h-px w-24 bg-white/50 mx-auto mb-6" />
            <p className="text-2xl md:text-3xl font-serif italic tracking-wide">
              4 Ottobre 2026
            </p>
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

      {/* Love Story Section */}
      <section id="storia" className="py-24 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <BookHeart className="w-8 h-8 text-wedding-gold mx-auto mb-8" />
          <h2 className="text-5xl md:text-7xl font-script mb-12 text-wedding-gold">La Nostra Storia</h2>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-wedding-gold/30 before:to-transparent">
            {/* Timeline Item 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-wedding-cream bg-wedding-gold text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Heart className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white shadow-sm border border-wedding-gold/10 text-left md:group-odd:text-right">
                <p className="text-wedding-ink font-bold text-sm tracking-widest uppercase mb-1">Agosto 2018</p>
                <h4 className="text-2xl font-script mb-2">Il Primo Incontro</h4>
                <p className="text-wedding-ink/80 text-sm leading-relaxed">Tutto è iniziato per caso, a una festa di amici in comune. Uno sguardo, una risata condivisa, e da quel momento non ci siamo più separati.</p>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-wedding-cream bg-wedding-gold text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white shadow-sm border border-wedding-gold/10 text-left md:group-odd:text-right">
                <p className="text-wedding-ink font-bold text-sm tracking-widest uppercase mb-1">Dicembre 2020</p>
                <h4 className="text-2xl font-script mb-2">Il Primo Viaggio</h4>
                <p className="text-wedding-ink/80 text-sm leading-relaxed">Parigi sotto la neve. Tra cioccolate calde e lunghe passeggiate sulla Senna, abbiamo capito che la nostra era una storia speciale.</p>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-wedding-cream bg-wedding-gold text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white shadow-sm border border-wedding-gold/10 text-left md:group-odd:text-right">
                <p className="text-wedding-ink font-bold text-sm tracking-widest uppercase mb-1">Settembre 2024</p>
                <h4 className="text-2xl font-script mb-2">La Proposta</h4>
                <p className="text-wedding-ink/80 text-sm leading-relaxed">Al tramonto, nel nostro posto preferito. Un "Sì" emozionato che ha dato inizio a questo nuovo meraviglioso capitolo.</p>
              </div>
            </div>
          </div>
        </motion.div>
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
          <h2 className="text-5xl md:text-7xl font-script mb-12 text-wedding-gold">Il Nostro Giorno</h2>
          
          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="space-y-6 p-8 rounded-3xl bg-white shadow-sm border border-wedding-gold/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wedding-gold/20 via-wedding-gold/40 to-wedding-gold/20"></div>
              <div className="flex items-center gap-4 text-wedding-gold">
                <Calendar className="w-6 h-6" />
                <h3 className="text-xl font-serif font-semibold uppercase tracking-wider">Quando</h3>
              </div>
              <p className="text-lg leading-relaxed text-wedding-ink/80">
                Domenica, 4 Ottobre 2026<br />
                Cerimonia alle ore 16:30
              </p>
              <div className="flex items-center gap-4 text-wedding-gold pt-4">
                <Clock className="w-6 h-6" />
                <h3 className="text-xl font-serif font-semibold uppercase tracking-wider">Programma</h3>
              </div>
              <ul className="space-y-2 text-wedding-ink/80">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> 16:30 - Cerimonia Religiosa</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> 18:00 - Aperitivo di Benvenuto</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> 20:00 - Cena di Gala</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-wedding-gold/50"></div> 23:00 - Taglio della Torta & Party</li>
              </ul>
            </div>

            <div className="space-y-6 p-8 rounded-3xl bg-white shadow-sm border border-wedding-gold/20 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wedding-gold/20 via-wedding-gold/40 to-wedding-gold/20"></div>
              <div className="flex items-center gap-4 text-wedding-gold">
                <MapPin className="w-6 h-6" />
                <h3 className="text-xl font-serif font-semibold uppercase tracking-wider">Dove</h3>
              </div>
              <p className="text-lg leading-relaxed text-wedding-ink/80">
                <strong>Villa Antica del Lago</strong><br />
                Via Panoramica, 42<br />
                21020 Varese (VA), Italia
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
                  src="https://maps.google.com/maps?q=Villa%20Antica%20del%20Lago%2C%20Via%20Panoramica%2C%2042%2C%20Varese&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="grayscale hover:grayscale-0 transition-all duration-700"
                  title="Mappa Villa Antica del Lago"
                ></iframe>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=Villa+Antica+del+Lago,+Via+Panoramica,+42,+21020+Varese+VA,+Italy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-wedding-gold hover:text-wedding-gold/70 transition-colors font-medium bg-wedding-gold/5 px-4 py-2 rounded-full"
                >
                  <Navigation className="w-4 h-4" />
                  Apri in Google Maps
                </a>
                <button 
                  onClick={handleGetDirections}
                  className="inline-flex items-center gap-2 text-wedding-gold hover:text-wedding-gold/70 transition-colors font-medium bg-wedding-gold/5 px-4 py-2 rounded-full"
                >
                  <Route className="w-4 h-4" />
                  Calcola Percorso
                </button>
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
            <h2 className="text-5xl md:text-6xl font-script mb-4 text-wedding-gold">Come Arrivare</h2>
            <p className="text-wedding-ink/70 max-w-xl mx-auto">
              La villa è facilmente raggiungibile in auto. È disponibile un ampio parcheggio riservato agli ospiti.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-wedding-sage/20">
              <h4 className="font-script text-2xl mb-3 text-wedding-gold">In Auto</h4>
              <p className="text-sm text-wedding-ink/80 leading-relaxed">
                Prendere l'autostrada A8 in direzione Varese, uscire a Buguggiate e seguire le indicazioni per il Lago di Varese. La villa si trova sulla collina sovrastante il lago.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-wedding-sage/20">
              <h4 className="font-script text-2xl mb-3 text-wedding-gold">In Treno</h4>
              <p className="text-sm text-wedding-ink/80 leading-relaxed">
                La stazione più vicina è Varese FS. Dalla stazione è possibile prendere un taxi (circa 15 minuti) o richiedere il servizio navetta organizzato (contattateci per info).
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
          <Bed className="w-8 h-8 text-wedding-gold mx-auto mb-6" />
          <h2 className="text-5xl md:text-6xl font-script mb-4 text-wedding-gold">Dove Pernottare</h2>
          <p className="text-wedding-ink/70 max-w-xl mx-auto">
            Per chi desidera fermarsi per la notte, abbiamo selezionato alcune strutture nelle vicinanze.
          </p>
        </motion.div>

        <div className="space-y-6">
          {[
            { name: "Grand Hotel Palace", dist: "2km dalla villa", price: "€€€", link: "#", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=60&w=400" },
            { name: "B&B Il Giardino Segreto", dist: "5km dalla villa", price: "€€", link: "#", img: "https://images.unsplash.com/photo-1582719478250-c89cae4df85b?auto=format&fit=crop&q=60&w=400" },
            { name: "Hotel Relais del Lago", dist: "1km dalla villa", price: "€€€", link: "#", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=60&w=400" }
          ].map((hotel, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-4 md:p-6 bg-white rounded-3xl border border-wedding-gold/10 hover:border-wedding-gold/40 hover:shadow-md transition-all group overflow-hidden"
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
                  <p className="text-xs md:text-sm text-wedding-ink/60">{hotel.dist} • {hotel.price}</p>
                </div>
              </div>
              <a href={hotel.link} className="text-wedding-gold font-medium text-[10px] md:text-sm uppercase tracking-widest hover:underline bg-wedding-gold/5 px-3 md:px-4 py-2 rounded-full group-hover:bg-wedding-gold/10 transition-colors">
                Prenota
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RSVP Section */}
      <section id="rsvp" className="py-24 px-6 relative text-wedding-ink">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-wedding-gold/5 border border-wedding-gold/20"
          >
            <h2 className="text-5xl md:text-6xl font-script mb-6 text-wedding-gold">Conferma la tua presenza</h2>
            <p className="text-wedding-ink/70 mb-10 font-light">
              Vi preghiamo di confermare la vostra partecipazione entro il 30 Giugno 2026.
            </p>

            <AnimatePresence mode="wait">
              {rsvpStatus === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-wedding-sage/10 border border-wedding-sage/30 p-12 rounded-3xl"
                >
                  <CheckCircle2 className="w-16 h-16 text-wedding-sage mx-auto mb-6" />
          <h3 className="text-3xl font-script mb-2 text-wedding-gold">Grazie Mille!</h3>
                  <p className="text-wedding-ink/70">La tua risposta è stata registrata con successo. Non vediamo l'ora di festeggiare insieme!</p>
                  <button 
                    onClick={() => setRsvpStatus('idle')}
                    className="mt-8 text-sm uppercase tracking-widest text-wedding-sage hover:text-wedding-sage/70 transition-colors font-bold"
                  >
                    Invia un'altra risposta
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
                      <label className="text-xs uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">Nome Completo</label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink"
                        placeholder="Es. Mario Rossi"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">Numero Ospiti</label>
                      <input 
                        required
                        type="number" 
                        min="1"
                        max="10"
                        name="guests"
                        value={formData.guests}
                        onChange={handleInputChange}
                        className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">Parteciperai?</label>
                    <select 
                      name="attendance"
                      value={formData.attendance}
                      onChange={handleInputChange}
                      className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink appearance-none"
                    >
                      <option value="yes">Sì, con piacere</option>
                      <option value="no">Purtroppo, non potrò esserci</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-wedding-ink/70 ml-1 font-bold">Messaggio (Opzionale)</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-white/80 border border-wedding-gold/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-wedding-gold focus:ring-2 focus:ring-wedding-gold/20 transition-all text-wedding-ink"
                      placeholder="Allergie, intolleranze o un semplice saluto..."
                    />
                  </div>

                  <button 
                    disabled={rsvpStatus === 'submitting'}
                    className="w-full bg-wedding-gold hover:bg-wedding-gold/90 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all uppercase tracking-[0.2em] text-sm mt-4 shadow-lg shadow-wedding-gold/20"
                  >
                    {rsvpStatus === 'submitting' ? 'Invio in corso...' : 'Invia Conferma'}
                  </button>
                  
                  {rsvpStatus === 'error' && (
                    <p className="text-red-400 text-sm text-center">Si è verificato un errore. Riprova più tardi.</p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 text-center border-t border-wedding-gold/10 relative">
        <p className="font-script text-2xl text-wedding-ink/40">
          Vitantonio & Marianna • 04.10.2026
        </p>
        
        <button 
          onClick={() => setView('dashboard')}
          className="mt-8 inline-flex items-center gap-2 text-wedding-gold/30 hover:text-wedding-gold transition-colors uppercase tracking-[0.3em] text-[10px] font-bold"
        >
          <LayoutDashboard className="w-3 h-3" />
          Area Riservata
        </button>
      </footer>
    </div>
  );
};

export default function App() {
  return <WeddingApp />;
}


