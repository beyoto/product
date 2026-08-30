import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { FavoritesProvider } from './components/FavoritesContext.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/home/HomePage.jsx'
import AdminLogin from './pages/adminLogin/AdminLogin.jsx';
import AdminPanel from './pages/adminPanel/AdminPanel.jsx';
import AddProduct from './pages/addProduct/AddProduct.jsx';
import FavoritesPage from './pages/favoritesPage/FavoritesPage.jsx';
import ProductPage from './pages/ProductPage/ProductPage.jsx';
import EditProduct from './pages/editProduct/EditProduct.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import ContactsPage from './pages/contactPage/ContactsPage.jsx';

const App = () => {
  return (
    <AuthProvider>
      <SplashScreen>
        <BrowserRouter>
          <FavoritesProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path='/favorites' element={<FavoritesPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path='/contacts' element={<ContactsPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/add"
                element={
                  <ProtectedRoute>
                    <AddProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/edit/:id"
                element={
                  <ProtectedRoute>
                    <EditProduct />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </FavoritesProvider>
        </BrowserRouter>
      </SplashScreen>
    </AuthProvider>
  );
};

export default App;