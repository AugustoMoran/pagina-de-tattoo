import React from 'react';
import { useDispatch } from 'react-redux';
import { HiX, HiOutlineTrash, HiOutlineShoppingBag } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { closeCart, selectCartIsOpen } from '../../features/cart/cartSlice';
import { useSelector } from 'react-redux';
import useCart from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';

const CartDrawer = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectCartIsOpen);
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => dispatch(closeCart())}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-surface border-l border-surface-border z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <HiOutlineShoppingBag size={20} />
            <span className="font-display font-bold text-lg">Carrito</span>
            {items.length > 0 && (
              <span className="badge bg-primary-400 text-white font-semibold">{items.length}</span>
            )}
          </div>
          <button onClick={() => dispatch(closeCart())} className="icon-btn">
            <HiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-ink-soft gap-4">
              <div className="w-16 h-16 rounded-full bg-pearl border border-surface-border flex items-center justify-center">
                <HiOutlineShoppingBag size={28} className="text-ink-soft" />
              </div>
              <p className="text-sm">Tu carrito está vacío</p>
              <Link
                to="/insumos"
                onClick={() => dispatch(closeCart())}
                className="btn-primary text-sm"
              >
                Ver insumos
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const producto = item.producto;
                const id = producto?._id || producto;
                const price = Number(producto?.precioOferta || producto?.precio || 0) || 0;
                const imagen = producto?.imagenes?.[0]?.url || '';
                const nombre = producto?.nombre || item.nombre || 'Producto sin nombre';

                return (
                  <li key={id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-pearl flex-shrink-0">
                      {imagen && <img src={imagen} alt={nombre} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 mb-1">{nombre}</p>
                      <div className="text-xs text-ink-soft mb-2 space-y-0.5">
                        <p>{formatCurrency(price)} c/u</p>
                        {item.talla && <p>Talla: <span className="font-medium text-ink">{item.talla}</span></p>}
                        {item.color && <p>Color: <span className="font-medium text-ink">{item.color}</span></p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(id, item.cantidad - 1, item.talla, item.color)}
                          className="w-7 h-7 rounded-full border border-surface-border text-ink flex items-center justify-center text-sm hover:border-primary-400 hover:text-primary-400"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-5 text-center text-ink">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(id, item.cantidad + 1, item.talla, item.color)}
                          className="w-7 h-7 rounded-full border border-surface-border text-ink flex items-center justify-center text-sm hover:border-primary-400 hover:text-primary-400"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeFromCart(id, item.talla, item.color)}
                        className="text-ink-soft hover:text-red-400 transition-colors p-1"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                      <span className="text-sm font-bold">{formatCurrency(price * item.cantidad)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-pearl-dark space-y-3 bg-pearl/40">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Total</span>
              <span className="font-display font-bold text-xl">{formatCurrency(total)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => dispatch(closeCart())}
              className="btn-primary block text-center w-full"
            >
              Finalizar compra
            </Link>
            <button
              onClick={() => clearCart()}
              className="w-full py-2 text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
