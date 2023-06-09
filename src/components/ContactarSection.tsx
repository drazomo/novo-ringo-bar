import { SanityContactarSchema } from '@/sanity/schemas/contactar';
import Image from 'next/image';
import { FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

interface ContactarSectionProps {
  contactar: SanityContactarSchema;
}

const ContactarSection: React.FC<ContactarSectionProps> = ({ contactar }) => {
  const {
    address: { city, country, number, postalCode, province, street },
    comoLlegarLink,
    googlePlaceLink,
    llamarButton,
    phone,
  } = contactar;

  return (
    <section className="bg-ringoRed text-white py-16" id="contactar">
      <div className="container mx-auto flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-16">Contactar</h2>
        <a
          href={googlePlaceLink}
          target="_blank"
          rel="noreferrer"
          className="mb-8"
        >
          <Image
            src="/map_locale_01.webp"
            alt="Mapa"
            width={1280}
            height={720}
            className="rounded-md shadow-md hover:shadow-lg transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-105 cursor-pointer"
          />
        </a>
        <div className="flex flex-col items-center mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center order-2 md:order-1">
              <div className="text-white p-6 rounded-md flex flex-col items-center justify-center">
                <h3 className="text-xl font-bold mb-4">Dirección</h3>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={comoLlegarLink}
                  className="flex items-center justify-center px-4 py-2 mb-4 bg-white text-ringoRed rounded-md hover:bg-gray-200 transition duration-500 ease-in-out"
                >
                  <FaMapMarkerAlt className="mr-2" />
                  <span className="text-lg font-bold">Cómo llegar</span>
                </a>
                <p className="text-sm mb-2">{`${street} ${number}`}</p>
                <p className="text-sm mb-2">{`${postalCode}, ${city}, ${province}`}</p>
                <p className="text-sm">{country}</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-top order-1 md:order-2">
              <div className="text-white p-6 rounded-md flex flex-col items-center justify-center">
                <h3 className="text-xl font-bold mb-4">Llamar</h3>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`tel:${phone}`}
                  className="flex items-center justify-center px-4 py-2 bg-white text-ringoRed rounded-md hover:bg-gray-200 transition duration-500 ease-in-out"
                >
                  <FaPhoneAlt className="mr-2" />
                  <span className="text-lg font-bold">
                    {String(llamarButton)}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactarSection;
