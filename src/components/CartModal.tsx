import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, User, Phone, MapPin, Sparkles, Navigation, CheckCircle2 } from 'lucide-react';
import { CartItem, ClientDetails } from '../types';
import { formatCurrency, getProductEffectivePrice } from '../utils';

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
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Optional inputs
  const [nickname, setNickname] = useState('');
  const [reference, setReference] = useState('');

  // Form error validation
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const totalCost = cartItems.reduce((acc, curr) => acc + getProductEffectivePrice(curr.product) * curr.quantity, 0);

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
    if (!phone.trim()) {
      setError('Por favor, indica un teléfono de contacto.');
      return;
    }
    if (!address.trim()) {
      setError('La dirección de entrega es obligatoria.');
      return;
    }

    const clientDetails: ClientDetails = {
      name: name.trim(),
      phone: phone.trim(),
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
    setPhone('');
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
                                {formatCurrency(item.product.price)}
                              </span>
                              <span className="text-xs text-amber-400 font-bold">
                                {formatCurrency(getProductEffectivePrice(item.product))} c/u
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-indigo-400">
                              {formatCurrency(item.product.price)} c/u
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
                <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
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
                <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  Teléfono Móvil <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="Ej. +34 600 000 000"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
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
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                    Apodo / Alias <span className="text-slate-500 font-normal">(Opcional)</span>
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
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                    Punto de Referencia <span className="text-slate-500 font-normal">(Opcional)</span>
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
              <span className="text-lg font-extrabold text-white">{formatCurrency(totalCost)}</span>
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
