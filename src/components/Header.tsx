import { SanityBarraNavSchema } from '@/sanity/schemas/nav';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FaPhone,
  FaFacebook,
  FaInstagram,
  FaBars,
  FaTimes,
  FaClock,
  FaClipboardList,
  FaImages,
  FaEnvelope,
  FaUtensils,
} from 'react-icons/fa';

interface HeaderProps {
  nav: SanityBarraNavSchema;
  forceBackground?: boolean;
}

const Header: React.FC<HeaderProps> = props => {
  const { facebook, instagram, telefono } = props.nav;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    setIsScrolled(window.pageYOffset > 0);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { label: 'Carta', href: '/carta', icon: <FaClipboardList /> },
    { label: 'Horarios', href: '/#horarios', icon: <FaClock /> },
    { label: 'Galería', href: '/#galeria', icon: <FaImages /> },
    { label: 'Contactar', href: '/#contactar', icon: <FaEnvelope /> },
    { label: 'Hacer Pedido', href: '/hacer-pedido', icon: <FaUtensils /> },
    { label: 'Llámanos', href: `tel:${telefono}`, icon: <FaPhone /> },
    {
      label: 'Instagram',
      href: instagram,
      icon: <FaInstagram />,
    },
    { label: 'Facebook', href: facebook, icon: <FaFacebook /> },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen || props.forceBackground
          ? 'bg-ringoRed'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-screen-lg mx-auto px-4 py-2 justify-between flex items-center">
        <div className="flex-grow text-center">
          <Link
            href="/"
            passHref
            className={`text-white text-3xl lg:text-5xl ${
              isScrolled && 'text-3xl'
            } font-bold`}
          >
            Ringo Pizzeria
          </Link>
        </div>

        <button
          onClick={handleMenuToggle}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          className="ml-auto"
        >
          {isMenuOpen ? (
            <FaTimes className="text-white text-2xl" />
          ) : (
            <FaBars className="text-white text-2xl" />
          )}
        </button>
      </nav>
      <div
        className={`max-w-screen-lg mx-auto ${isMenuOpen ? '' : 'hidden'}`}
        role="dialog"
        aria-label="Menú de navegación"
        aria-expanded={isMenuOpen}
      >
        <ul className="flex flex-col">
          {menuItems.map(item => (
            <li
              key={item.label}
              className={`text-white font-semibold text-2xl p-3 border-b border-white transition-all duration-300 ${
                isMenuOpen
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-10'
              } w-full`}
            >
              <Link href={item.href || ''} passHref onClick={handleMenuToggle}>
                <div className="flex items-center">
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default Header;
