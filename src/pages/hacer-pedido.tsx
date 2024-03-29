import { FaPhone, FaStore } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GetStaticProps, NextPage } from 'next';
import { client } from '@/lib/client';
import { SanityBarraNavSchema } from '@/sanity/schemas/nav';
import {
  SanityDiaObject,
  SanityHorariosSchema,
} from '@/sanity/schemas/horarios';
import { convertToTime } from '@/utils';
import React from 'react';
import Head from 'next/head';

interface HacerPedidoPageProps {
  nav: SanityBarraNavSchema;
  horarios: SanityHorariosSchema;
}

const HacerPedidoPage: NextPage<HacerPedidoPageProps> = ({ nav, horarios }) => {
  return (
    <>
      <Head>
        <title>Hacer Pedido | Pizzería Ringo Bar</title>
        <meta
          name="description"
          content="Haz tu pedido en nuestra pizzería y disfruta de la mejor comida italiana en la comodidad de tu hogar. Ofrecemos una amplia variedad de pizzas de alta calidad y otros platos italianos deliciosos para que puedas elegir. Realiza tu pedido en línea ahora y disfruta de nuestro servicio de entrega a domicilio confiable y rápido."
        />
        <meta
          name="keywords"
          content="Pizza, comida italiana, pedir pizza, delivery, restaurante, pizzería."
        />
      </Head>
      <div className="min-h-screen flex flex-col bg-ringoBeige">
        <Header nav={nav} forceBackground />
        <main className="flex-grow">
          <div className="relative h-[50vh]">
            <Image
              src="/marten-bjork-r-jA8jEMuYM.jpg"
              alt="Haz tu pedido en Ringo Bar Pizzeria en Valencia para entrega a domicilio, inspirado en una Vespa amarilla en las calles de Milán"
              fill
              style={{ objectFit: 'cover' }}
            />
            <div className="absolute inset-0 bg-black opacity-50" />
            <div className="absolute inset-0 flex justify-center items-center">
              <h1 className="text-4xl font-bold text-white">Hacer Pedido</h1>
            </div>
          </div>
          <section className="py-12">
            <h2 className="text-center text-gray-800 text-2xl md:text-3xl font-bold mb-8">
              Elige un método de entrega
            </h2>
            <div className="container mx-auto">
              <div className="md:grid md:gap-4 md:grid-cols-2 flex flex-col justify-center items-start px-8">
                <div className="flex items-center justify-center mb-4 sm:justify-start lg:justify-center">
                  <MdDeliveryDining className="text-ringoRed mr-2" />
                  <a
                    href="https://negocios.watson.app/business/8ujKLZzGRkFlxlLQw1um"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 text-lg hover:underline"
                  >
                    Entrega a domicilio
                  </a>
                </div>
                <div className="flex items-center justify-center mb-8 sm:justify-start lg:justify-center">
                  <FaPhone className="text-ringoRed mr-2" />
                  <a
                    href="tel:+34-624-41-45-18"
                    className="text-gray-800 text-lg hover:underline"
                  >
                    Pedir o Reservar Mesa
                  </a>
                </div>
              </div>
            </div>
          </section>
          <div className="container mx-auto text-center mb-12">
            <h2 className="text-gray-800 text-2xl md:text-3xl font-bold mb-8">
              Horario de pedido
            </h2>
            <div className="grid grid-cols-2 gap-4 md:text-2xl">
              {horarios.dias.map(
                ({
                  _key,
                  day,
                  horaCierre,
                  horaInicio,
                  abierto,
                }: SanityDiaObject) => (
                  <React.Fragment key={_key}>
                    <div className="capitalize text-gray-800">{day}</div>
                    <div className="text-gray-800">
                      {abierto
                        ? `${convertToTime(horaInicio)} - ${convertToTime(
                            horaCierre,
                          )}`
                        : 'Cerrado'}
                    </div>
                  </React.Fragment>
                ),
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const nav = await client.fetch('*[_type == "navegacion"][0]');
  const horarios = await client.fetch('*[_type == "horarios"][0]');

  return {
    props: { nav, horarios },
  };
};

export default HacerPedidoPage;
