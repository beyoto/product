import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { BASENAME } from './site.js';
import { AuthProvider } from './components/AuthContext.jsx';
import { FavoritesProvider } from './components/FavoritesContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import ContactsPage from './pages/ContactsPage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import ProductForm from './pages/ProductForm.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';

const admin = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

function NotFound() {
  return (
    <main className="page-status">
      <h1>Страница не найдена</h1>
      <p><Link to="/">Перейти в каталог</Link></p>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <SplashScreen>
        <BrowserRouter basename={BASENAME}>
          <FavoritesProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={admin(<AdminPanel />)} />
              <Route path="/admin/add" element={admin(<ProductForm />)} />
              <Route path="/admin/edit/:id" element={admin(<ProductForm />)} />
              <Route path="/admin/analytics" element={admin(<AdminAnalytics />)} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FavoritesProvider>
        </BrowserRouter>
      </SplashScreen>
    </AuthProvider>
  );
}

export default App;
