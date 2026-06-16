import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, User, Phone, MapPin, Sparkles, Navigation, CheckCircle2 } from 'lucide-react';
import { CartItem, ClientDetails } from '../types';
import { formatCurrency, getProductEffectivePrice } from '../utils';

const countries = [
  { name: 'Cuba', code: '+53', flag: '🇨🇺' },
  { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
  { name: 'España', code: '+34', flag: '🇪🇸' },
  { name: 'México', code: '+52', flag: '🇲🇽' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
  { name: 'Nicaragua', code: '+505', flag: '🇳🇮' },
  { name: 'Panamá', code: '+507', flag: '🇵🇦' },
  { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
  { name: 'República Dominicana', code: '+1', flag: '🇩🇴' },
  { name: 'Perú', code: '+51', flag: '🇵🇪' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Uruguay', code: '+598', flag: '🇺🇾' },
  { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
  { name: 'Honduras', code: '+504', flag: '🇭🇳' },
  { name: 'Guatemala', code: '+502', flag: '🇬🇹' },
  { name: 'El Salvador', code: '+503', flag: '🇸🇻' },
  { name: 'Puerto Rico', code: '+1', flag: '🇵🇷' },
  { name: 'Canadá', code: '+1', flag: '🇨🇦' },
  { name: 'Italia', code: '+39', flag: '🇮🇹' },
  { name: 'Alemania', code: '+49', flag: '🇩🇪' },
  { name: 'Francia', code: '+33', flag: '🇫🇷' },
];

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onConfirmCheckout: (details: ClientDetails) => void;
  lastGeneratedInvoice: string | null;
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmCheckout,
  lastGeneratedInvoice,
}: CartModalProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  
  // Mandatory inputs
  const [name, setName] = useState('');
  const [localPhone, setLocalPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // default Cuba (+53)
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [address, setAddress] = useState('');
  
  // Optional inputs
  const [nickname, setNickname] = useState('');
  const [reference, setReference] = useState('');

  // Form error validation
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const totalCost = cartItems.reduce((acc, curr) => acc + getProductEffectivePrice(curr.product) * curr.quantity, 0);

  const getCartTotalsFormatted = () => {
    const totals: { [currency: string]: number } = {};
    cartItems.forEach((item) => {
      const currency = item.product.currency || 'CUP';
      const price = getProductEffectivePrice(item.product);
      totals[currency] = (totals[currency] || 0) + price * item.quantity;
    });
    
    const keys = Object.keys(totals);
    if (keys.length === 0) return formatCurrency(0, 'CUP');
    return keys.map((k) => formatCurrency(totals[k], k)).join(' + ');
  };

  const handleNextStep = () => {
    if (cartItems.length === 0) return;
    setStep('checkout');
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validation - mandatory fields
    if (!name.trim()) {
      setError('Por favor, introduce tu nombre.');
      return;
    }
    if (!localPhone.trim()) {
      setError('Por favor, indica un teléfono de contacto.');
      return;
    }
    if (!address.trim()) {
      setError('La dirección de entrega es obligatoria.');
      return;
    }

    const finalPhone = `${selectedCountry.code} ${localPhone.trim()}`;

    const clientDetails: ClientDetails = {
      name: name.trim(),
      phone: finalPhone,
      address: address.trim(),
    };

    if (nickname.trim()) clientDetails.nickname = nickname.trim();
    if (reference.trim()) clientDetails.reference = reference.trim();

    onConfirmCheckout(clientDetails);
    setStep('success');
  };

  const handleResetAndClose = () => {
    // Reset state
    setStep('cart');
    setName('');
    setLocalPhone('');
    setSelectedCountry(countries[0]);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
    setAddress('');
    setNickname('');
    setReference('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md font-sans">
      <div 
        id="cart-modal-container"
        className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 p-5 bg-slate-950">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-extrabold text-white">
              {step === 'cart' && 'Tu Carrito de Compras'}
              {step === 'checkout' && 'Datos de Envío y Facturación'}
              {step === 'success' && '¡Pedido Recibido!'}
            </h2>
          </div>
          <button
            onClick={step === 'success' ? handleResetAndClose : onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950">
          {step === 'cart' && (
            <>
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="h-8 w-8 text-slate-600" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Tu carrito está vacío</h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-[240px]">
                    Explora nuestra tienda premium y agrega los mejores productos al carrito.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div 
                      key={item.product.id} 
                      className="flex gap-4 items-center p-3 rounded-xl border border-slate-850 bg-slate-900/40 hover:bg-slate-900/80 transition-colors"
                    >
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        className="h-14 w-14 rounded-lg object-cover bg-slate-950 border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.product.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.product.isOnSale && item.product.discountPercent ? (
                            <>
                              <span className="text-[10px] text-slate-500 line-through">
                                {formatCurrency(item.product.price, item.product.currency)}
                              </span>
                              <span className="text-xs text-amber-400 font-bold">
                                {formatCurrency(getProductEffectivePrice(item.product), item.product.currency)} c/u
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-indigo-400">
                              {formatCurrency(item.product.price, item.product.currency)} c/u
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-indigo-650 hover:text-white hover:border-indigo-400 active:scale-95 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-indigo-650 hover:text-white hover:border-indigo-400 active:scale-95 text-xs font-bold"
                          disabled={item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>

                      {/* Remove item button */}
                      <button 
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1.5 text-red-400 hover:bg-rose-955/20 hover:text-red-500 rounded-lg border border-transparent hover:border-red-900/30 transition-colors"
                        title="Quitar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form onSubmit={handleSubmitCheckout} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 text-xs rounded-xl font-bold">
                  {error}
                </div>
              )}

              {/* Informative Label */}
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/30 rounded-xl text-xs text-indigo-300 leading-relaxed">
                Necesitamos tus datos para registrar el pedido y procesar el envío. Los campos marcados con asterisco (<span className="text-red-500 font-bold">*</span>) son obligatorios.
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ej. Juan Manuel Pérez"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                  Teléfono Móvil <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 relative">
                  {/* Country Prefix Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="h-full flex items-center gap-1.5 px-3 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white hover:bg-slate-850 focus:outline-none transition-all font-medium whitespace-nowrap min-w-[95px] justify-between"
                    >
                      <span className="flex items-center gap-1">{selectedCountry.flag} <span className="font-mono">{selectedCountry.code}</span></span>
                      <span className="text-[9px] text-slate-500">▼</span>
                    </button>

                    {/* Popover list with search query */}
                    {isCountryDropdownOpen && (
                      <div className="absolute left-0 mt-2 z-50 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-60 overflow-y-auto">
                        <input
                          type="text"
                          placeholder="Buscar país o código..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40">
                          {countries
                            .filter(
                              (c) =>
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.code.includes(countrySearch)
                            )
                            .map((c) => (
                              <button
                                type="button"
                                key={`${c.name}-${c.code}`}
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setIsCountryDropdownOpen(false);
                                  setCountrySearch('');
                                }}
                                className={`flex items-center justify-between px-2.5 py-2 text-left text-xs rounded-lg transition-colors leading-none ${
                                  selectedCountry.name === c.name && selectedCountry.code === c.code
                                    ? 'bg-indigo-650 text-white font-bold'
                                    : 'text-slate-350 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span className="truncate max-w-[100px]">{c.name}</span>
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 font-bold">{c.code}</span>
                              </button>
                            ))}
                          {countries.filter(
                            (c) =>
                              c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                              c.code.includes(countrySearch)
                          ).length === 0 && (
                            <span className="text-[11px] text-center text-slate-500 py-2">No se encontraron resultados</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rest of Phone Number Input */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      value={localPhone}
                      onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="Completa tu número de teléfono"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                  Dirección de Entrega <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Calle, número, piso, código postal y ciudad"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Grid for optional parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Nickname */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                    Apodo / Alias <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Ej. Alex / Mi casa"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                    Punto de Referencia <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Navigation className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ej. Frente a parque colón"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Hidden submit trigger to catch "Enter" */}
              <input type="submit" className="hidden" />
            </form>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-950">
              <div className="h-20 w-20 bg-indigo-950/40 border border-indigo-500/30 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10 text-indigo-400 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white">¡Pedido registrado con éxito!</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-[340px] px-2 leading-relaxed">
                Tu solicitud ha sido enviada al equipo de administración. Se ha asignado una factura provisional con número de seguimiento.
              </p>

              {lastGeneratedInvoice && (
                <div className="mt-5 px-6 py-3.5 bg-slate-900 border border-slate-850 rounded-2xl">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Petición de Factura</span>
                  <span className="text-base font-mono font-bold text-indigo-300 mt-0.5 block">{lastGeneratedInvoice}</span>
                </div>
              )}

              <p className="text-xs text-yellow-500 font-medium mt-6 bg-yellow-950/30 border border-yellow-900/20 px-3.5 py-2.5 rounded-xl">
                ⚙️ Puedes revisar y procesar este pedido ingresando en el &quot;Panel Personal&quot; con tu clave de empleado o administrador.
              </p>
            </div>
          )}
        </div>

        {/* Footer Area */}
        {step !== 'success' && (
          <div className="border-t border-slate-900 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400 font-semibold">Total de Compra</span>
              <span className="text-lg font-extrabold text-white">{getCartTotalsFormatted()}</span>
            </div>

            {step === 'cart' ? (
              <button
                onClick={handleNextStep}
                disabled={cartItems.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-98"
              >
                <span>Proceder al Pago</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 font-bold py-3 px-4 rounded-xl text-sm transition-all active:scale-98"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCheckout}
                  className="flex-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/35 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-lg shadow-indigo-600/15 transition-all active:scale-98"
                >
                  Confirmar Pedido
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="border-t border-slate-900 bg-slate-950 p-5">
            <button
              onClick={handleResetAndClose}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all active:scale-98"
            >
              Entendido, continuar comprando
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
