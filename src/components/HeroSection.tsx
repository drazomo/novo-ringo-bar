import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPizzaSlice, FaBook } from 'react-icons/fa';

const HeroSection = () => {
  return (
    <section className="relative flex items-center justify-center min-h-screen bg-black">
      <div className="absolute inset-0 bg-black opacity-30 z-10" />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/pexels-kampus-production-6603334-1280x720-25fps.mp4"
      ></video>
      <div className="relative z-10 text-center">
        <div className="mx-auto w-40 md:w-60 lg:w-80 mb-8 p-2 rounded-full shadow-lg">
          <Image
            src="/pizzeria_ringo.webp"
            alt="Pizzeria Ringo logo"
            width={320}
            height={320}
            priority
          />
        </div>
        <h1 className="text-white text-xl md:text-3xl font-bold mb-8">
          La Auténtica Pizzería Italiana en Valencia
        </h1>
        <div className="flex justify-center mb-16">
          <Link
            href="/carta"
            className="bg-ringoRed hover:bg-ringoDarkRed text-white text-lg md:text-xl mr-6 border border-transparent rounded-full py-2 px-4 transition duration-500 ease-in-out"
          >
            <FaBook className="inline-block mr-2" /> Ver Carta
          </Link>
          <Link
            href="/hacer-pedido"
            className="bg-ringoRed hover:bg-ringoDarkRed text-white text-lg md:text-xl border border-transparent rounded-full py-2 px-4 transition duration-500 ease-in-out"
          >
            <FaPizzaSlice className="inline-block mr-2" /> Hacer Pedido
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
