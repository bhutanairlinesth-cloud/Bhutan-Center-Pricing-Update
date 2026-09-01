export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "Organization"],
    name: "Bhutan Center",
    alternateName: "Bhutan Center by OMG Experience",
    url: "https://www.bhutancenter.org",
    email: "info@omgexp.com",
    telephone: "+66-2-630-4600",
    foundingDate: "2013",
    address: {
      "@type": "PostalAddress",
      streetAddress: "52/13 ชั้น 5 สีลมคอนโด ซอยศาลาแดง 2 แขวงสีลม",
      addressLocality: "บางรัก",
      addressRegion: "กรุงเทพมหานคร",
      postalCode: "10500",
      addressCountry: "TH",
    },
    areaServed: ["TH", "BT"],
    knowsAbout: ["Bhutan travel", "Bhutan tours", "Bhutan visa", "Sustainable Development Fee", "Bhutan Airlines"],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
