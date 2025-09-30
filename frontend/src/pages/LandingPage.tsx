import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Truck, Shield, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">E-Shop</span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-dark-300 hover:text-white transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Welcome to{' '}
            <span className="text-primary-500">E-Shop</span>
          </h1>
          <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
            Discover amazing products, enjoy fast delivery, and experience the future of online shopping.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="btn-outline text-lg px-8 py-3"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose E-Shop?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-500/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Fast Delivery</h3>
              <p className="text-dark-300">
                Get your orders delivered quickly with our efficient delivery network.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure Shopping</h3>
              <p className="text-dark-300">
                Your data and payments are protected with industry-standard security.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Quality Products</h3>
              <p className="text-dark-300">
                We offer only the highest quality products from trusted brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-700 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ShoppingBag className="h-6 w-6 text-primary-500" />
            <span className="text-xl font-bold text-white">E-Shop</span>
          </div>
          <p className="text-dark-400">
            © 2024 E-Shop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
