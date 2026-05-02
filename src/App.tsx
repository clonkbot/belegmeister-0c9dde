import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Receipt {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  description: string;
  imageUrl: string;
  mwst: number; // German VAT
}

const CATEGORIES = [
  'Bürobedarf',
  'Reisekosten',
  'Bewirtung',
  'Telekommunikation',
  'Software & IT',
  'Fachliteratur',
  'Fortbildung',
  'Versicherung',
  'Sonstiges',
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Simulated receipt OCR extraction
function extractReceiptData(imageUrl: string): Partial<Receipt> {
  const vendors = ['REWE', 'Saturn', 'MediaMarkt', 'IKEA', 'Edeka', 'DM', 'Lidl', 'Amazon', 'Deutsche Bahn'];
  const randomVendor = vendors[Math.floor(Math.random() * vendors.length)];
  const randomAmount = Math.floor(Math.random() * 15000) / 100 + 5;
  const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  // Generate a date within the last 30 days
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));

  return {
    date: date.toISOString().split('T')[0],
    vendor: randomVendor,
    amount: Math.round(randomAmount * 100) / 100,
    category: randomCategory,
    description: `Beleg von ${randomVendor}`,
    imageUrl,
    mwst: Math.round(randomAmount * 0.19 * 100) / 100,
  };
}

function ScannerOverlay({ isScanning }: { isScanning: boolean }) {
  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        >
          <div className="relative w-64 h-80 md:w-80 md:h-96 border-2 border-amber-500/50 rounded-lg overflow-hidden">
            {/* Scanner line */}
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
              initial={{ top: 0 }}
              animate={{ top: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber-500" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-amber-500" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-amber-500" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-amber-500" />

            {/* Grid overlay */}
            <div className="absolute inset-4 grid grid-cols-3 grid-rows-4 gap-px opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border border-amber-500/30" />
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.p
                className="text-amber-500 font-mono text-xs md:text-sm tracking-widest uppercase"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Beleg wird gescannt...
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReceiptCard({ receipt, onDelete }: { receipt: Receipt; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-amber-500/30 transition-colors"
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-amber-500 font-mono text-xs">{formatDate(receipt.date)}</span>
              <span className="text-neutral-600">|</span>
              <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded font-mono truncate max-w-[120px] md:max-w-none">
                {receipt.category}
              </span>
            </div>
            <h3 className="text-white font-medium truncate">{receipt.vendor}</h3>
            <p className="text-neutral-500 text-sm truncate">{receipt.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-mono text-lg">{formatCurrency(receipt.amount)}</p>
            <p className="text-neutral-500 text-xs font-mono">MwSt: {formatCurrency(receipt.mwst)}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-800 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="aspect-[3/4] max-h-48 bg-neutral-800 rounded-lg overflow-hidden">
                <img
                  src={receipt.imageUrl}
                  alt="Beleg"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(receipt.id);
                }}
                className="w-full py-2 px-4 bg-red-500/10 text-red-400 text-sm font-mono rounded hover:bg-red-500/20 transition-colors min-h-[44px]"
              >
                BELEG LÖSCHEN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UploadZone({ onUpload }: { onUpload: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <motion.div
      className={`relative border-2 border-dashed rounded-xl p-6 md:p-12 text-center cursor-pointer transition-all ${
        isDragging
          ? 'border-amber-500 bg-amber-500/5'
          : 'border-neutral-700 hover:border-neutral-600'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-amber-500/50 rounded-lg flex items-center justify-center">
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <div>
          <p className="text-white font-medium text-sm md:text-base">Beleg hochladen</p>
          <p className="text-neutral-500 text-xs md:text-sm mt-1">
            Foto hier ablegen oder klicken
          </p>
        </div>

        <div className="flex items-center gap-2 text-neutral-600 text-xs font-mono">
          <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          AUTOMATISCHE ERKENNUNG AKTIV
        </div>
      </div>
    </motion.div>
  );
}

function StatsPanel({ receipts }: { receipts: Receipt[] }) {
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalMwst = receipts.reduce((sum, r) => sum + r.mwst, 0);
  const categoryCounts = receipts.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
      >
        <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider">Belege</p>
        <p className="text-2xl md:text-3xl font-mono text-white mt-1">{receipts.length}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
      >
        <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider">Gesamt</p>
        <p className="text-2xl md:text-3xl font-mono text-amber-500 mt-1">{formatCurrency(totalAmount)}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
      >
        <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider">MwSt (19%)</p>
        <p className="text-2xl md:text-3xl font-mono text-teal-500 mt-1">{formatCurrency(totalMwst)}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
      >
        <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider">Top Kategorie</p>
        <p className="text-lg md:text-xl font-mono text-white mt-1 truncate">
          {topCategory ? topCategory[0] : '—'}
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');

  const handleUpload = useCallback((file: File) => {
    setIsScanning(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;

      // Simulate OCR processing time
      setTimeout(() => {
        const extractedData = extractReceiptData(imageUrl);
        const newReceipt: Receipt = {
          id: generateId(),
          date: extractedData.date || new Date().toISOString().split('T')[0],
          vendor: extractedData.vendor || 'Unbekannt',
          amount: extractedData.amount || 0,
          category: extractedData.category || 'Sonstiges',
          description: extractedData.description || '',
          imageUrl: extractedData.imageUrl || imageUrl,
          mwst: extractedData.mwst || 0,
        };

        setReceipts((prev) => [newReceipt, ...prev]);
        setIsScanning(false);
      }, 2000);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const filteredReceipts = filterCategory
    ? receipts.filter((r) => r.category === filterCategory)
    : receipts;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      <ScannerOverlay isScanning={isScanning} />

      {/* Header */}
      <header className="border-b border-neutral-800 bg-[#0F0F0F]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-mono font-bold text-lg md:text-xl">B</span>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">BELEGMEISTER</h1>
                <p className="text-neutral-500 text-xs font-mono hidden md:block">Steuerbelege · Deutschland</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-2 text-neutral-500 text-xs font-mono">
                <span className="w-2 h-2 bg-teal-500 rounded-full" />
                {new Date().getFullYear()} STEUERJAHR
              </div>
              <button className="px-3 md:px-4 py-2 bg-amber-500 text-black text-xs md:text-sm font-mono font-medium rounded hover:bg-amber-400 transition-colors min-h-[44px]">
                EXPORT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 w-full">
        <div className="space-y-6 md:space-y-8">
          {/* Upload Zone */}
          <UploadZone onUpload={handleUpload} />

          {/* Stats */}
          {receipts.length > 0 && <StatsPanel receipts={receipts} />}

          {/* Receipts List */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-mono text-neutral-400 uppercase tracking-wider">
                Erfasste Belege ({filteredReceipts.length})
              </h2>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded px-3 py-2 font-mono focus:border-amber-500 focus:outline-none min-h-[44px]"
              >
                <option value="">Alle Kategorien</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {filteredReceipts.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 border border-neutral-800 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-neutral-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-neutral-500 font-mono text-sm">Keine Belege erfasst</p>
                <p className="text-neutral-600 text-xs mt-1">
                  Laden Sie Ihren ersten Beleg hoch
                </p>
              </div>
            ) : (
              <motion.div layout className="grid gap-3 md:gap-4">
                <AnimatePresence>
                  {filteredReceipts.map((receipt) => (
                    <ReceiptCard
                      key={receipt.id}
                      receipt={receipt}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50 py-4 md:py-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-center text-neutral-600 text-xs font-mono">
            Requested by @spvce7 · Built by @clonkbot
          </p>
        </div>
      </footer>
    </div>
  );
}
