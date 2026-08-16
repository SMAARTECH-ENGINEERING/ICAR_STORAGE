import { Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 90, damping: 18 };

export default function AuthLayout() {
  const { pathname } = useLocation();
  const mode = pathname.startsWith('/register') ? 'register' : 'login';

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-slate-50">
      {/* Brand panel — slides to the opposite side when the mode toggles. */}
      <motion.div
        animate={{ x: mode === 'login' ? '0%' : '100%' }}
        transition={SPRING}
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-10 text-white lg:flex"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2">
          <img src="/logo-192.png" alt="Smaatech Agri" className="h-10 w-auto" />
          <span className="text-lg font-semibold">Smaatech Agri</span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-semibold leading-tight">
            Dynamic multi-room
            <br />
            IoT environmental monitoring
          </h2>
          <p className="mt-3 max-w-sm text-emerald-100">
            Live sensor data, relay control, and automation across every room — no hardcoded limits on how many.
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-xl bg-white/10 p-4 backdrop-blur-sm"
          >
            {mode === 'login' ? (
              <>
                <p className="text-sm text-emerald-100">New here?</p>
                <Link
                  to="/register"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline"
                >
                  Create an account →
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-emerald-100">Already have an account?</p>
                <Link
                  to="/login"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline"
                >
                  Sign in →
                </Link>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Form panel — slides the opposite direction, swapping places with the brand panel. */}
      <motion.div
        animate={{ x: mode === 'login' ? '0%' : '-100%' }}
        transition={SPRING}
        className="flex w-full flex-col justify-center px-4 py-10 lg:w-1/2"
      >
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 text-center lg:hidden">
            <img src="/logo-192.png" alt="Smaatech Agri" className="mx-auto h-14 w-auto" />
            <p className="mt-2 text-lg font-semibold text-slate-900">Smaatech Agri</p>
          </div>
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
