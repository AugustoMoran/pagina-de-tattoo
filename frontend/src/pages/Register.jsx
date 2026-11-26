import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../services/authApi';
import { setCredentials } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import Logo from '../components/common/Logo';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', telefono: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await register(form).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      toast.success('¡Cuenta creada correctamente!');
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || err?.data?.errors?.[0]?.msg || 'Error al registrarse');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          <div className="text-center mb-8">
            <Logo className="h-16 w-16 rounded-md mx-auto mb-4 shadow-[0_0_0_1px_rgba(186,214,206,0.16)]" />
            <p className="font-display text-3xl font-extrabold text-ink mb-3">
              MDFK<span className="text-primary-400">.</span>
            </p>
            <h1 className="font-display text-2xl font-bold text-ink">Crear cuenta</h1>
            <p className="text-ink-soft text-sm mt-1">Completá tus datos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">Nombre</label>
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1.5">Apellido</label>
                <input type="text" name="apellido" value={form.apellido} onChange={handleChange} className="input-field" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" required autoComplete="email" />
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
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  minLength={6}
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
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Teléfono (opcional)</label>
              <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2">
              {isLoading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-soft mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-primary-400 font-semibold hover:underline">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
