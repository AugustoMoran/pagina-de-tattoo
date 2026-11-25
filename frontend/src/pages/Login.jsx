import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../services/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { useSyncCartMutation } from '../services/cartApi';
import { clearGuestCart, selectCartItems } from '../features/cart/cartSlice';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [syncCart] = useSyncCartMutation();
  const guestItems = useSelector(selectCartItems);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const guestCart = guestItems.map((i) => ({
        producto: i.producto?._id || i.producto,
        cantidad: i.cantidad,
      }));
      const result = await login({ ...form, guestCart }).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));

      if (guestCart.length > 0) {
        await syncCart(guestCart).unwrap().catch(() => {});
        dispatch(clearGuestCart());
      }

      toast.success(`¡Bienvenido, ${result.user.nombre}!`);
      navigate(result.user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          <div className="text-center mb-8">
            <p className="font-display text-3xl font-extrabold text-ink mb-3">
              MDFK<span className="text-primary-400">.</span>
            </p>
            <h1 className="font-display text-2xl font-bold text-ink">Iniciar sesión</h1>
            <p className="text-ink-soft text-sm mt-1">Accedé a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-soft mt-6">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="text-primary-400 font-semibold hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
