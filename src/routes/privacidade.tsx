import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/kanoy/LegalPage";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Language } from "@/lib/i18n/translations";

const title = "KANOY — Política de Privacidade";
const description = "Como a KANOY recolhe, utiliza e protege os dados pessoais dos visitantes do website.";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PrivacidadePage,
});

const COPY: Record<
  Language,
  { eyebrow: string; title: string; updated: string; backLabel: string; sections: LegalSection[] }
> = {
  pt: {
    eyebrow: "Legal",
    title: "Política de Privacidade",
    updated: "Atualizado em setembro de 2026",
    backLabel: "Voltar ao site",
    sections: [
      {
        heading: "1. Quem somos",
        body: [
          "A KANOY é a responsável pelo tratamento dos dados pessoais recolhidos através deste website (entidade legal, NIF e morada a confirmar). Para qualquer questão sobre esta política, contacte-nos através de hello@kanoy.studio.",
        ],
      },
      {
        heading: "2. Que dados recolhemos",
        body: [
          "Recolhemos apenas os dados que nos fornece voluntariamente através do formulário de contacto: nome, email, telefone (opcional), o conteúdo da mensagem e o idioma em que prefere ser contactado.",
          "Este website não utiliza cookies de rastreio nem ferramentas de analytics de terceiros. É guardada apenas a sua preferência de idioma no armazenamento local (localStorage) do seu navegador, que nunca é enviada para os nossos servidores.",
        ],
      },
      {
        heading: "3. Para que usamos os seus dados",
        body: [
          "Os dados submetidos no formulário de contacto são usados exclusivamente para responder ao seu pedido e, se aplicável, preparar uma proposta comercial.",
        ],
      },
      {
        heading: "4. Base legal",
        body: [
          "O tratamento assenta no seu consentimento, dado ao submeter o formulário, e no interesse legítimo da KANOY em responder a pedidos de contacto que nos são dirigidos.",
        ],
      },
      {
        heading: "5. Partilha com terceiros",
        body: [
          "Para enviar as mensagens de contacto, utilizamos o serviço Resend como plataforma de envio de email. Os seus dados não são vendidos, alugados nem partilhados para fins de marketing de terceiros.",
        ],
      },
      {
        heading: "6. Conservação dos dados",
        body: [
          "Os dados enviados através do formulário são conservados apenas durante o tempo necessário para gerir o pedido de contacto e uma eventual relação comercial subsequente, sendo depois eliminados ou anonimizados.",
        ],
      },
      {
        heading: "7. Os seus direitos",
        body: [
          "Nos termos do RGPD, tem direito a aceder, retificar, apagar, limitar ou opor-se ao tratamento dos seus dados, bem como à portabilidade dos mesmos. Pode exercer estes direitos a qualquer momento através de hello@kanoy.studio.",
          "Tem também o direito de apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD), em www.cnpd.pt.",
        ],
      },
      {
        heading: "8. Segurança",
        body: [
          "Adotamos medidas técnicas e organizativas adequadas para proteger os seus dados pessoais contra acesso não autorizado, perda ou divulgação indevida.",
        ],
      },
      {
        heading: "9. Alterações a esta política",
        body: [
          "Esta política pode ser atualizada periodicamente. A versão em vigor é sempre a publicada nesta página.",
        ],
      },
      {
        heading: "10. Contactos",
        body: ["Para questões sobre privacidade: hello@kanoy.studio · +351 923 250 729."],
      },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Política de Privacidad",
    updated: "Actualizado en septiembre de 2026",
    backLabel: "Volver al sitio",
    sections: [
      {
        heading: "1. Quiénes somos",
        body: [
          "KANOY es la responsable del tratamiento de los datos personales recogidos a través de este sitio web (entidad legal, NIF y domicilio por confirmar). Para cualquier duda sobre esta política, contáctanos en hello@kanoy.studio.",
        ],
      },
      {
        heading: "2. Qué datos recogemos",
        body: [
          "Recogemos únicamente los datos que nos facilitas voluntariamente a través del formulario de contacto: nombre, email, teléfono (opcional), el contenido del mensaje y el idioma en el que prefieres ser contactado.",
          "Este sitio web no utiliza cookies de rastreo ni herramientas de analítica de terceros. Solo se guarda tu preferencia de idioma en el almacenamiento local (localStorage) de tu navegador, que nunca se envía a nuestros servidores.",
        ],
      },
      {
        heading: "3. Para qué usamos tus datos",
        body: [
          "Los datos enviados en el formulario de contacto se usan exclusivamente para responder a tu solicitud y, en su caso, preparar una propuesta comercial.",
        ],
      },
      {
        heading: "4. Base legal",
        body: [
          "El tratamiento se basa en tu consentimiento, otorgado al enviar el formulario, y en el interés legítimo de KANOY en responder a las solicitudes de contacto que se nos dirigen.",
        ],
      },
      {
        heading: "5. Compartición con terceros",
        body: [
          "Para enviar los mensajes de contacto utilizamos el servicio Resend como plataforma de envío de email. Tus datos no se venden, alquilan ni comparten con fines de marketing de terceros.",
        ],
      },
      {
        heading: "6. Conservación de los datos",
        body: [
          "Los datos enviados a través del formulario se conservan solo durante el tiempo necesario para gestionar la solicitud de contacto y una eventual relación comercial posterior, tras lo cual se eliminan o anonimizan.",
        ],
      },
      {
        heading: "7. Tus derechos",
        body: [
          "Conforme al RGPD, tienes derecho a acceder, rectificar, suprimir, limitar u oponerte al tratamiento de tus datos, así como a su portabilidad. Puedes ejercer estos derechos en cualquier momento a través de hello@kanoy.studio.",
          "También tienes derecho a presentar una reclamación ante la autoridad de protección de datos de tu país, o ante la Comissão Nacional de Proteção de Dados (CNPD) de Portugal, en www.cnpd.pt.",
        ],
      },
      {
        heading: "8. Seguridad",
        body: [
          "Adoptamos medidas técnicas y organizativas adecuadas para proteger tus datos personales frente a accesos no autorizados, pérdida o divulgación indebida.",
        ],
      },
      {
        heading: "9. Cambios en esta política",
        body: [
          "Esta política puede actualizarse periódicamente. La versión vigente es siempre la publicada en esta página.",
        ],
      },
      {
        heading: "10. Contacto",
        body: ["Para cuestiones de privacidad: hello@kanoy.studio · +351 923 250 729."],
      },
    ],
  },
  en: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    updated: "Updated September 2026",
    backLabel: "Back to site",
    sections: [
      {
        heading: "1. Who we are",
        body: [
          "KANOY is the data controller for the personal data collected through this website (legal entity name, tax ID and registered address to be confirmed). For any question about this policy, contact us at hello@kanoy.studio.",
        ],
      },
      {
        heading: "2. What data we collect",
        body: [
          "We only collect the data you voluntarily give us through the contact form: name, email, phone (optional), the content of your message, and your preferred reply language.",
          "This website does not use tracking cookies or third-party analytics tools. Only your language preference is stored in your browser's local storage (localStorage), which never leaves your device.",
        ],
      },
      {
        heading: "3. What we use your data for",
        body: [
          "Data submitted through the contact form is used solely to reply to your enquiry and, where relevant, to prepare a proposal.",
        ],
      },
      {
        heading: "4. Legal basis",
        body: [
          "Processing is based on your consent, given when submitting the form, and on KANOY's legitimate interest in responding to enquiries addressed to us.",
        ],
      },
      {
        heading: "5. Sharing with third parties",
        body: [
          "To send contact messages we use Resend as our email delivery platform. Your data is never sold, rented or shared for third-party marketing purposes.",
        ],
      },
      {
        heading: "6. Data retention",
        body: [
          "Data submitted through the form is kept only for as long as needed to handle your enquiry and any subsequent business relationship, after which it is deleted or anonymised.",
        ],
      },
      {
        heading: "7. Your rights",
        body: [
          "Under the GDPR, you have the right to access, rectify, erase, restrict or object to the processing of your data, and to data portability. You can exercise these rights at any time via hello@kanoy.studio.",
          "You also have the right to lodge a complaint with your local data protection authority, or with Portugal's Comissão Nacional de Proteção de Dados (CNPD) at www.cnpd.pt.",
        ],
      },
      {
        heading: "8. Security",
        body: [
          "We use appropriate technical and organisational measures to protect your personal data against unauthorised access, loss or misuse.",
        ],
      },
      {
        heading: "9. Changes to this policy",
        body: [
          "This policy may be updated periodically. The version in force is always the one published on this page.",
        ],
      },
      {
        heading: "10. Contact",
        body: ["For privacy questions: hello@kanoy.studio · +351 923 250 729."],
      },
    ],
  },
};

function PrivacidadePage() {
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
