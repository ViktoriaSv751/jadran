/**
 * Strukturált adat (schema.org JSON-LD) beszúrása.
 *
 * Szerver-komponensben renderelve a botok a HTML-forrásban azonnal látják —
 * nem kell hozzá JavaScriptet futtatniuk. Ez azért fontos, mert több AI-crawler
 * (és néhány keresőmotor) egyáltalán nem futtat JS-t.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // A tartalom saját, statikus adatból jön (lib/seo.ts, lib/articles.ts),
          // nem felhasználói inputból. A `</script>` szekvenciát mégis
          // semlegesítjük, hogy semmilyen esetben ne lehessen kitörni a tagből.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(d).replace(/</g, "\\u003c")
          }}
        />
      ))}
    </>
  );
}
