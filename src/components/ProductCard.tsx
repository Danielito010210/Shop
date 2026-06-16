import React from 'react';
import { Plus, Check, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, getProductEffectivePrice } from '../utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  addedIndicator: boolean;
}

export default function ProductCard({ product, onAddToCart, addedIndicator }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.isOnSale && product.discountPercent;
  const effectivePrice = getProductEffectivePrice(product);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-lg transition-all hover:translate-y-[-4px] hover:border-slate-700 hover:shadow-indigo-950/20">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
          <span className="rounded-lg bg-slate-950/90 border border-slate-800 px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-350 backdrop-blur-md">
            {product.category}
          </span>
          {hasDiscount && (
            <span className="rounded-lg bg-yellow-500 text-slate-950 font-extrabold px-3 py-1 text-[10px] uppercase tracking-wide shadow-md border border-yellow-400">
              Promo -{product.discountPercent}%
            </span>
          )}
          {product.stock <= 3 && product.stock > 0 && (
            <span className="rounded-lg bg-amber-650/90 border border-amber-500/30 px-3 py-1 text-[10px] font-extrabold uppercase text-white shadow-lg animate-pulse">
              ¡Solo {product.stock}!
            </span>
          )}
          {isOutOfStock && (
            <span className="rounded-lg bg-red-655/90 border border-red-500/30 px-3 py-1 text-[10px] font-extrabold uppercase text-white shadow-lg">
              Agotado
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-5 bg-gradient-to-b from-slate-900/20 to-slate-950/40">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            {hasDiscount && (
              <span className="text-[9px] font-bold tracking-wider uppercase bg-red-950/80 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded">
                Oferta Especial
              </span>
            )}
          </div>
          <h3 className="font-sans text-base font-bold tracking-tight text-white line-clamp-1 transition-colors group-hover:text-indigo-300">
            {product.name}
          </h3>
          <p className="mt-2 font-sans text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-850">
          <div className="flex flex-col">
            <span className="font-sans text-[10px] font-medium text-slate-500 uppercase tracking-wider">Precio</span>
            <div className="flex items-baseline gap-1.5">
              {hasDiscount ? (
                <>
                  <span className="font-sans text-xs text-slate-500 line-through">
                    {formatCurrency(product.price, product.currency)}
                  </span>
                  <span className="font-sans text-lg font-extrabold text-amber-400">
                    {formatCurrency(effectivePrice, product.currency)}
                  </span>
                </>
              ) : (
                <span className="font-sans text-lg font-extrabold text-white">
                  {formatCurrency(product.price, product.currency)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => !isOutOfStock && onAddToCart(product)}
            disabled={isOutOfStock}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-sans text-xs font-bold transition-all ${
              isOutOfStock
                ? 'bg-slate-800/50 text-slate-500 border border-slate-850 cursor-not-allowed'
                : addedIndicator
                ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                : 'bg-indigo-650/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-650 hover:text-white hover:border-indigo-500 active:scale-95 shadow-md'
            }`}
          >
            {addedIndicator ? (
              <>
                <Check className="h-3.5 w-3.5 animate-bounce" />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Añadir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
