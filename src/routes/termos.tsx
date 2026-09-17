import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/kanoy/LegalPage";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Language } from "@/lib/i18n/translations";

const title = "KANOY — Termos e Condições";
const description = "Termos e condições de utilização do website e dos serviços da KANOY.";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
    links: [{ rel: "canonical", href: "https://kanoy.pt/termos" }],
  }),
  component: TermosPage,
});

const COPY: Record<
  Language,
  { eyebrow: string; title: string; updated: string; backLabel: string; sections: LegalSection[] }
> = {
  pt: {
    eyebrow: "Legal",
    title: "Termos e Condições",
    updated: "Atualizado em setembro de 2026",
    backLabel: "Voltar ao site",
    sections: [
      {
        heading: "1. Âmbito",
        body: [
          "Estes Termos e Condições regulam a utilização do website da KANOY e a contratação dos serviços de conceção, desenvolvimento e manutenção web prestados pela KANOY. Ao utilizar este website ou contratar os nossos serviços, aceita os termos aqui descritos.",
        ],
      },
      {
        heading: "2. Serviços",
        body: [
          "A KANOY presta serviços de websites à medida, sistemas web personalizados, reservas online, alojamento, manutenção e automações. O âmbito, os prazos e os valores de cada projeto são definidos individualmente por escrito (email ou proposta comercial) antes do início dos trabalhos.",
        ],
      },
      {
        heading: "3. Orçamentos e pagamentos",
        body: [
          "Os orçamentos apresentados são válidos por 30 dias, salvo indicação em contrário. Os pagamentos são efetuados nas condições acordadas em cada proposta. O não pagamento nos prazos definidos pode implicar a suspensão dos trabalhos ou dos serviços em curso, incluindo o alojamento.",
        ],
      },
      {
        heading: "4. Prazos",
        body: [
          "Os prazos de entrega são estimativas de boa fé e dependem da colaboração atempada do cliente — envio de conteúdos, acessos e aprovações. Atrasos por parte do cliente podem prolongar o prazo de entrega de forma proporcional.",
        ],
      },
      {
        heading: "5. Propriedade intelectual",
        body: [
          "Após o pagamento integral do projeto, o cliente adquire os direitos de utilização do website desenvolvido para o seu negócio. Componentes internos, bibliotecas de código e o know-how de desenvolvimento da KANOY permanecem propriedade da KANOY e podem ser reutilizados noutros projetos.",
          "Os conteúdos fornecidos pelo cliente — textos, imagens, marca — permanecem propriedade do cliente em qualquer circunstância.",
        ],
      },
      {
        heading: "6. Alojamento e manutenção",
        body: [
          "Sempre que contratados, os serviços de alojamento e manutenção são prestados de forma contínua mediante pagamento periódico. O cancelamento destes serviços pode implicar a indisponibilidade do website findo o período já pago.",
        ],
      },
      {
        heading: "7. Responsabilidade",
        body: [
          "A KANOY compromete-se a prestar os serviços com o cuidado e a competência técnica adequados. A KANOY não se responsabiliza por perdas resultantes de interrupções em serviços de terceiros (por exemplo, fornecedores de alojamento, domínios ou APIs externas) nem pelo conteúdo fornecido pelo cliente.",
        ],
      },
      {
        heading: "8. Cancelamento",
        body: [
          "Qualquer das partes pode rescindir um projeto em curso mediante aviso por escrito, sendo devidos os valores correspondentes ao trabalho já realizado até à data de rescisão.",
        ],
      },
      {
        heading: "9. Alterações aos termos",
        body: [
          "Estes termos podem ser atualizados periodicamente. A versão em vigor é sempre a publicada nesta página.",
        ],
      },
      {
        heading: "10. Lei aplicável",
        body: [
          "Estes termos regem-se pela lei portuguesa. Quaisquer litígios serão submetidos ao foro da comarca competente, sem prejuízo do direito do consumidor a recorrer a mecanismos de resolução alternativa de litígios.",
        ],
      },
      {
        heading: "11. Contactos",
        body: ["Para qualquer questão relacionada com estes termos: hello@kanoy.studio · +351 923 250 729."],
      },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Términos y Condiciones",
    updated: "Actualizado en septiembre de 2026",
    backLabel: "Volver al sitio",
    sections: [
      {
        heading: "1. Ámbito",
        body: [
          "Estos Términos y Condiciones regulan el uso del sitio web de KANOY y la contratación de los servicios de diseño, desarrollo y mantenimiento web prestados por KANOY. Al usar este sitio web o contratar nuestros servicios, aceptas los términos aquí descritos.",
        ],
      },
      {
        heading: "2. Servicios",
        body: [
          "KANOY presta servicios de webs a medida, sistemas web personalizados, reservas online, alojamiento, mantenimiento y automatizaciones. El alcance, los plazos y los importes de cada proyecto se definen individualmente por escrito (email o propuesta comercial) antes de iniciar los trabajos.",
        ],
      },
      {
        heading: "3. Presupuestos y pagos",
        body: [
          "Los presupuestos presentados son válidos durante 30 días, salvo indicación contraria. Los pagos se efectúan en las condiciones acordadas en cada propuesta. El impago en los plazos definidos puede implicar la suspensión de los trabajos o de los servicios en curso, incluido el alojamiento.",
        ],
      },
      {
        heading: "4. Plazos",
        body: [
          "Los plazos de entrega son estimaciones de buena fe y dependen de la colaboración oportuna del cliente — envío de contenidos, accesos y aprobaciones. Los retrasos por parte del cliente pueden prolongar el plazo de entrega de forma proporcional.",
        ],
      },
      {
        heading: "5. Propiedad intelectual",
        body: [
          "Tras el pago íntegro del proyecto, el cliente adquiere los derechos de uso del sitio web desarrollado para su negocio. Los componentes internos, las librerías de código y el know-how de desarrollo de KANOY siguen siendo propiedad de KANOY y pueden reutilizarse en otros proyectos.",
          "Los contenidos aportados por el cliente — textos, imágenes, marca — siguen siendo propiedad del cliente en cualquier circunstancia.",
        ],
      },
      {
        heading: "6. Alojamiento y mantenimiento",
        body: [
          "Cuando se contratan, los servicios de alojamiento y mantenimiento se prestan de forma continuada mediante pago periódico. La cancelación de estos servicios puede implicar la indisponibilidad del sitio web una vez finalizado el periodo ya pagado.",
        ],
      },
      {
        heading: "7. Responsabilidad",
        body: [
          "KANOY se compromete a prestar los servicios con el cuidado y la competencia técnica adecuados. KANOY no se responsabiliza de pérdidas derivadas de interrupciones en servicios de terceros (por ejemplo, proveedores de alojamiento, dominios o APIs externas) ni del contenido aportado por el cliente.",
        ],
      },
      {
        heading: "8. Cancelación",
        body: [
          "Cualquiera de las partes puede rescindir un proyecto en curso mediante aviso por escrito, siendo debidos los importes correspondientes al trabajo ya realizado hasta la fecha de rescisión.",
        ],
      },
      {
        heading: "9. Cambios en los términos",
        body: [
          "Estos términos pueden actualizarse periódicamente. La versión vigente es siempre la publicada en esta página.",
        ],
      },
      {
        heading: "10. Ley aplicable",
        body: [
          "Estos términos se rigen por la ley portuguesa. Cualquier litigio se someterá al fuero competente, sin perjuicio del derecho del consumidor a recurrir a mecanismos de resolución alternativa de litigios.",
        ],
      },
      {
        heading: "11. Contacto",
        body: ["Para cualquier duda relacionada con estos términos: hello@kanoy.studio · +351 923 250 729."],
      },
    ],
  },
  en: {
    eyebrow: "Legal",
    title: "Terms & Conditions",
    updated: "Updated September 2026",
    backLabel: "Back to site",
    sections: [
      {
        heading: "1. Scope",
        body: [
          "These Terms & Conditions govern the use of KANOY's website and the contracting of the web design, development and maintenance services provided by KANOY. By using this website or hiring our services, you accept the terms described here.",
        ],
      },
      {
        heading: "2. Services",
        body: [
          "KANOY provides custom websites, custom web systems, online booking systems, hosting, maintenance and automations. The scope, timeline and price of each project are defined individually in writing (email or proposal) before work begins.",
        ],
      },
      {
        heading: "3. Quotes and payments",
        body: [
          "Quotes are valid for 30 days unless stated otherwise. Payments are made under the terms agreed in each proposal. Non-payment within the agreed timeframe may result in work or ongoing services — including hosting — being suspended.",
        ],
      },
      {
        heading: "4. Timelines",
        body: [
          "Delivery timelines are good-faith estimates and depend on the client's timely collaboration — content, access and approvals. Delays on the client's side may extend the delivery timeline proportionally.",
        ],
      },
      {
        heading: "5. Intellectual property",
        body: [
          "Once the project is paid in full, the client acquires the rights to use the website built for their business. KANOY's internal components, code libraries and development know-how remain KANOY's property and may be reused in other projects.",
          "Content supplied by the client — copy, images, brand assets — remains the client's property under all circumstances.",
        ],
      },
      {
        heading: "6. Hosting and maintenance",
        body: [
          "Where contracted, hosting and maintenance services are provided on an ongoing basis against periodic payment. Cancelling these services may result in the website becoming unavailable once the paid period ends.",
        ],
      },
      {
        heading: "7. Liability",
        body: [
          "KANOY commits to delivering its services with appropriate care and technical competence. KANOY is not liable for losses resulting from interruptions in third-party services (e.g. hosting providers, domain registrars or external APIs), nor for content supplied by the client.",
        ],
      },
      {
        heading: "8. Cancellation",
        body: [
          "Either party may terminate an ongoing project with written notice; amounts corresponding to work already performed up to the termination date remain payable.",
        ],
      },
      {
        heading: "9. Changes to these terms",
        body: [
          "These terms may be updated periodically. The version in force is always the one published on this page.",
        ],
      },
      {
        heading: "10. Governing law",
        body: [
          "These terms are governed by Portuguese law. Any disputes will be submitted to the competent court, without prejudice to the consumer's right to alternative dispute resolution mechanisms.",
        ],
      },
      {
        heading: "11. Contact",
        body: ["For any question about these terms: hello@kanoy.studio · +351 923 250 729."],
      },
    ],
  },
};

function TermosPage() {
  const { language } = useLanguage();
  const copy = COPY[language];
  return (
    <LegalPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      updated={copy.updated}
      backLabel={copy.backLabel}
      sections={copy.sections}
    />
  );
}
